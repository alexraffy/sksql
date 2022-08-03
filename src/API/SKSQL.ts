import {ITable} from "../Table/ITable";
import {readTableDefinition} from "../Table/readTableDefinition";
import {SQLStatement} from "./SQLStatement";
import {TSQLResult} from "./TSQLResult";
import {generateV4UUID} from "./generateV4UUID";
import {
    compileNewRoutines,
    decompress,
    genStatsForTable,
    kConnectionStatus,
    kModifiedBlockType,
    SQLResult,
    TableColumnType,
    TExecutionContext,
    TWSRDataResponse,
    TWSRGNIDResponse,
    TWSRSQLResponse,
    WSRGNID,
    WSROK,
    WSRSQLResponse
} from "../main";
import {kFunctionType} from "../Functions/kFunctionType";
import {TRegisteredFunction} from "../Functions/TRegisteredFunction";
import {registerFunctions} from "../Functions/registerFunctions";
import {CWebSocket} from "../WebSocket/CWebSocket";
import {TWebSocketDelegate} from "../WebSocket/TWebSocketDelegate";
import {TSocketResponse} from "../WebSocket/TSocketResponse";
import {
    TWSRAuthenticateRequest,
    TWSRAuthenticateResponse,
    TWSRDataRequest,
    TWSRSQL,
    WSRAuthenticate,
    WSRAuthenticatePlease,
    WSRDataRequest,
    WSRSQL
} from "../WebSocket/TMessages";
import {TAuthSession} from "../WebSocket/TAuthSession";
import {TDBEventsDelegate} from "./TDBEventsDelegate";
import {TQueryCreateFunction} from "../Query/Types/TQueryCreateFunction";
import {TQueryCreateProcedure} from "../Query/Types/TQueryCreateProcedure";
import {readTableName} from "../Table/readTableName";
import {CTableInfoManager} from "./CTableInfoManager";
import {flowCallback, flowExit, kBreakerState, newFlow} from "flowbreaker";

let workerJavascript = "";
workerJavascript = "const { WorkerData, parentPort } = require('worker_threads')\n";
workerJavascript += "\n";
workerJavascript += "let db = new sksql.SKSQL();\n";
workerJavascript += "function runQuery(id, str, params) {\n";
//workerJavascript += "   console.log(\"QUERY: \" + str);\n";
workerJavascript += "   let st = new sksql.SQLStatement(db, str);\n";
workerJavascript += "   if (params !== undefined && params.length > 0) {\n"
workerJavascript += "       for (let i = 0; i < params.length; i++) {\n";
workerJavascript += "           st.setParameter(params[i].key, params[i].value);\n";
workerJavascript += "       }\n";
workerJavascript += "   }\n";
workerJavascript += "   let result = st.runSync();\n";
//workerJavascript += "   console.dir(result);\n";
workerJavascript += "   if (result.error === undefined && result.resultTableName !== \"\") {\n";
workerJavascript += "       parentPort.postMessage({c: \"DB\", d: db.allTables});\n";
workerJavascript += "   }\n";
workerJavascript += "   parentPort.postMessage({ c: \"QS\", d: {id: id, openedTempTables: st.context.openedTempTables, result: result.getStruct()} });\n";
workerJavascript += "   st.close();\n";
workerJavascript += "}\n\n";
workerJavascript += "parentPort.on('message', (value) => {\n";
workerJavascript += "   if (value !== undefined && value.c !== undefined) {\n";
// workerJavascript += "       console.log(\"WW Received:\", value.c);\n";
workerJavascript += "       switch (value.c) {\n";
workerJavascript += "           case \"DB\":\n";
workerJavascript += "               db.allTables = value.d;\n";
workerJavascript += "               db.tableInfo.syncAll();\n";
workerJavascript += "               break;\n";
workerJavascript += "           case \"QR\":\n";
workerJavascript += "               runQuery(value.d.id, value.d.query, value.d.params);\n";
workerJavascript += "               break;\n";
workerJavascript += "       }\n";
workerJavascript += "   }\n";
workerJavascript += "});";

interface TConnectionData {
    socket: CWebSocket;
    databaseHashId: string;
    auth?: TAuthSession;
    socketDelegate?: TWebSocketDelegate;
    delegate: TDBEventsDelegate;
}

export enum kDebugLevel {
    L0_none = 0,
    L4_executionPlan = 4,
    L5_resultTableDefinition = 5,
    L8_scans = 8,
    L80_fromSubQueryDump = 80,
    L900_eachRow = 900,
    L910_scanPredicate = 910,
    L990_contextUpdate = 990,
    all = 999
}


// Initialize a local database

// let db = new SKSQL();
// db.initWorkerPool(0, "");
// let st = new SQLStatement(db, "CREATE TABLE users(FirstName VARCHAR(255), Lastname VARCHAR(255))");
// st.run();
export class SKSQL {
    debugLevel: kDebugLevel = kDebugLevel.L0_none;
    // All tables and temp results are stored here
    allTables: ITable[];
    // The connection to the server
    public connection: TConnectionData = undefined;
    // webworkers instances
    private workers: Worker[] = [];
    // list of queries that need to be processed
    private pendingQueries: {id: string, statement:SQLStatement, resolve: (result: SQLResult) => void}[] = [];
    // SQL and js functions
    functions: TRegisteredFunction[] = [];
    // SQL procs
    procedures: TQueryCreateProcedure[] = [];
    // Cached info about all tables
    tableInfo: CTableInfoManager;
    // callbacks to hook DROP TABLE and VACUUM events
    // used in skserver to delete/rename physical tables
    callbackDropTable: (db: SKSQL, tableName: string) => void = (db, tableName) => {};
    callbackRenameTable: (db: SKSQL, tableName: string, newName: string) => void = (db, tableName, newName) => {};

    constructor() {
        this.allTables = [];
        this.tableInfo = new CTableInfoManager(this);
        // SELECT without a FROM is not supported. you can use SELECT ... FROM DUAL instead
        let dual = new SQLStatement(this, "CREATE TABLE dual(DUMMY VARCHAR(1)); INSERT INTO dual (DUMMY) VALUES('X');", false);
        dual.runSync();
        // store number of active/dead rows in tables,
        let stats = new SQLStatement(this, "CREATE TABLE master.sys_table_statistics(id uint32 identity(1,1), timestamp datetime, table VARCHAR(255), active_rows UINT32, dead_rows UINT32, header_size UINT32, total_size UINT32, largest_block_size UINT32, table_timestamp DATETIME);", false);
        stats.runSync();
        // functions and procedures definitions are stored in the routines table.
        let routines = new SQLStatement(this, "CREATE TABLE master.routines(schema VARCHAR(255), name VARCHAR(255), type VARCHAR(10), definition VARCHAR(64536), modified DATETIME);", false);
        routines.runSync();
        registerFunctions(this);
    }

    get connected(): kConnectionStatus {
        if (this.connection === undefined) {
            return kConnectionStatus.disconnected;
        }
        if (this.connection.socket === undefined) {
            return kConnectionStatus.disconnected;
        }
        return this.connection.socket.connected;
    }

    get isReadOnly(): boolean {
        if (this.connection === undefined || this.connection.socket === undefined) {
            return false;
        }
        if (this.connection.auth === undefined) { return false; }
        return this.connection.auth.readOnly;
    }

    get isRemoteOnly(): boolean {
        if (this.connection === undefined || this.connection.socket === undefined) {
            return false;
        }
        if (this.connection.auth === undefined) { return false; }
        return this.connection.auth.remoteOnly;
    }


    async connectAsync(databaseHashId: string, token: string, name: string = "", remoteModeOnly: boolean = false): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            let delegate: TDBEventsDelegate & {resolve: (boolean) => void} = {
                resolve: resolve,
                on(db: SKSQL, databaseHashId: string, message: string, payload: any) {

                },
                connectionError(db: SKSQL, databaseHashId: string, error: string) {
                    if (this.resolve !== undefined) {
                        resolve(false);
                        this.resolve = undefined;
                    }
                },
                connectionLost(db: SKSQL, databaseHashId: string) {
                },
                ready(db: SKSQL, databaseHashId: string) {
                    if (this.resolve !== undefined) {
                        resolve(true);
                        this.resolve = undefined;
                    }
                },
                authRequired(db: SKSQL, databaseHashId: string): TAuthSession {
                    return {
                        token: token,
                        name: name,
                        remoteOnly: remoteModeOnly
                    };
                }
            }
            this.connectToDatabase(databaseHashId, delegate);
        });
    }


    // Connect to a remote database
    // databaseHashId can be a sksql.com database or a websocket
    // implement TDBEventsDelegate if you want to get notifications about disconnection, SQL statements from other clients connected to the same DB.
    connectToDatabase(databaseHashId: string, delegate: TDBEventsDelegate) {
        if (this.connection !== undefined) {
            this.disconnect();
        }
        let connectionEntry: TConnectionData = {
            databaseHashId: databaseHashId,
            socket: new CWebSocket(this, databaseHashId),
            delegate: delegate,
        }
        let socketDelegate: TWebSocketDelegate = {
            databaseHashId: databaseHashId,
            connectionError(db: SKSQL, databaseHashId: string, error: string) {
                let connectionInfo: TConnectionData = db.getConnectionInfoForDB();
                if (connectionInfo !== undefined) {
                    if (connectionInfo.delegate !== undefined && connectionInfo.delegate.connectionError !== undefined) {
                        connectionInfo.delegate.connectionError(db, databaseHashId, error);
                    }
                }
            },
            on(db: SKSQL, databaseHashId: string, msg: TSocketResponse) {
                let connectionInfo: TConnectionData = db.getConnectionInfoForDB();
                if (connectionInfo === undefined) {
                    return;
                }
                if (msg.message === WSRAuthenticatePlease) {
                    if (connectionInfo.delegate !== undefined && connectionInfo.delegate.authRequired !== undefined) {
                        connectionInfo.auth = connectionInfo.delegate.authRequired(db, databaseHashId);

                        connectionInfo.socket.send(WSRAuthenticate, {
                            id: msg.id,
                            info: connectionInfo.auth
                        } as TWSRAuthenticateRequest)

                    } else {
                        throw new Error("SKSQL: DBData requires a TDBEventsDelegate to access a remote database.")
                    }
                }
                if (msg.message === WSRAuthenticate) {
                    let payload = msg.param as TWSRAuthenticateResponse;
                    let connection_id = payload.con_id;
                    let info = db.getConnectionInfoForDB();
                    if (info === undefined) {
                        // client attempted to disconnect the connection was accepted?
                        return;
                    }
                    info.auth = JSON.parse(JSON.stringify(payload.info));
                    if (info.auth.valid !== true) {
                        if  (info.delegate.connectionError !== undefined) {
                            info.delegate.connectionError(db, databaseHashId, "Connection was denied.");
                        }
                        return;
                    }
                    // Request data
                    connectionInfo.socket.send(WSRDataRequest, {id: connectionInfo.auth.id} as TWSRDataRequest)

                }
                if (msg.message === WSRSQL) {
                    let payload = msg.param as TWSRSQL;
                    try {
                        let statement = new SQLStatement(db, payload.r, false);
                        if (payload.p !== undefined) {
                            for (let i = 0; i < payload.p.length; i++) {
                                statement.setParameter(payload.p[i].name, payload.p[i].value, payload.p[i].type);
                            }
                        }
                        let rets = statement.runSync();
                    } catch (e) {
                        console.warn(e.message);
                    }
                }
                if (msg.message === WSRSQLResponse) {
                    let payload = msg.param as TWSRSQLResponse;
                    if (payload.res.error === undefined) {
                        let restack : TWSRDataResponse[] = [];
                        let restackCount = 0;
                        while (payload.t.length > 0 || restack.length > 0) {
                            let block: TWSRDataResponse = undefined;
                            if (payload.t.length > 0) {
                                block = payload.t.splice(0, 1)[0];
                            } else if (restack.length > 0) {
                                restackCount++;

                                if (restackCount > restack.length  && restack.length > 0) {
                                    // we have gone through the restack and can't find anything to process correctly.
                                    console.log("Response sent by server could not be synced completely.");
                                    break;
                                }
                                block = restack.splice(0, 1)[0];
                            }
                            if (block !== undefined) {
                                // decompress the block
                                let compressedBuf: ArrayBuffer = new ArrayBuffer(block.size);
                                let dvCompressedBuf = new DataView(compressedBuf);
                                for (let i = 0; i < block.size; i++) {
                                    dvCompressedBuf.setUint8(i, block.data[i]);
                                }
                                let decompressedBuf: SharedArrayBuffer | ArrayBuffer = decompress(compressedBuf, SKSQL.supportsSharedArrayBuffers);

                                switch (block.type) {
                                    case kModifiedBlockType.tableHeader:
                                    {
                                        let table: ITable;
                                        let tableDataAndIndex = db.getTableDataAndIndex(block.tableName);
                                        if (tableDataAndIndex === undefined) {
                                            // table doesn't exist
                                            table = {
                                                data: {
                                                    tableDef: undefined,
                                                    blocks: []
                                                }
                                            };
                                            table.data.tableDef = decompressedBuf;
                                            db.allTables.push(table);
                                        } else {
                                            // table header was updated
                                            tableDataAndIndex.table.data.tableDef = decompressedBuf;
                                        }
                                        restackCount = 0;
                                    }
                                    break;
                                    case kModifiedBlockType.tableBlock:
                                    {
                                        let tableDataAndIndex = db.getTableDataAndIndex(block.tableName);
                                        if (tableDataAndIndex === undefined) {
                                            // table doesn't exist
                                            // put the block in restack to process it after we have processed the table header
                                            restack.push(block);
                                        } else {
                                            // does the block already exists
                                            if ( block.indexBlock <= tableDataAndIndex.table.data.blocks.length - 1) {
                                                tableDataAndIndex.table.data.blocks[block.indexBlock] = decompressedBuf;
                                                restackCount = 0;
                                            } else {
                                                if (block.indexBlock > tableDataAndIndex.table.data.blocks.length) {
                                                    // block index is not in order
                                                    restack.push(block);
                                                } else {
                                                    tableDataAndIndex.table.data.blocks.push(decompressedBuf);
                                                    restackCount = 0;
                                                }
                                            }
                                        }
                                    }
                                    break;
                                }
                            }
                        }
                        // recreate the cache
                        db.tableInfo.syncAll();
                    }
                    // notify callback
                    let pq = db.pendingQueries.find((p) => {
                        return p.id ===  payload.u;
                    });
                    if (pq !== undefined) {
                        if (pq.resolve !== undefined) {
                            pq.resolve(new SQLResult(db, payload.res));
                        }
                    }
                }
                if (msg.message === WSROK) {
                    db.tableInfo.syncAll();
                    compileNewRoutines(db);
                    if (connectionInfo.delegate !== undefined && connectionInfo.delegate.ready !== undefined) {
                        db.tableInfo.syncAll();
                        connectionInfo.delegate.ready(db, databaseHashId);
                    }
                }
                if (msg.message === WSRDataRequest) {
                    let payload = msg.param as TWSRDataResponse;
                    if (payload.type === kModifiedBlockType.tableHeader) {
                        let buf: SharedArrayBuffer | ArrayBuffer;
                        if (SKSQL.supportsSharedArrayBuffers) {
                            buf = new SharedArrayBuffer(payload.size);
                        } else {
                            buf = new ArrayBuffer(payload.size);
                        }
                        let dv = new DataView(buf)
                        for (let i = 0; i < payload.size; i++) {
                            dv.setUint8(i, payload.data[i]);
                        }
                        let t: ITable = {
                            data: {
                                tableDef: decompress(buf, SKSQL.supportsSharedArrayBuffers),
                                blocks: []
                            }
                        }
                        let tblDef = readTableDefinition(t.data, true);
                        if (db.getTable(tblDef.name) !== undefined) {
                            db.dropTable(tblDef.name);
                        }
                        db.allTables.push(t);

                    } else if (payload.type === kModifiedBlockType.tableBlock) {
                        let t = db.getTable(payload.tableName);
                        if (t !== undefined) {
                            let buf: SharedArrayBuffer | ArrayBuffer;
                            if (SKSQL.supportsSharedArrayBuffers) {
                                buf = new SharedArrayBuffer(payload.size);
                            } else {
                                buf = new ArrayBuffer(payload.size);
                            }
                            let dv = new DataView(buf)
                            for (let i = 0; i < payload.size; i++) {
                                dv.setUint8(i, payload.data[i]);
                            }
                            t.data.blocks.push(decompress(buf, SKSQL.supportsSharedArrayBuffers));
                        }
                    }
                }

                if (connectionInfo.delegate !== undefined && connectionInfo.delegate.on !== undefined) {
                    connectionInfo.delegate.on(db, databaseHashId, msg.message, msg.param);
                }
            },
            connectionLost(db: SKSQL, databaseHashId: string) {
                let t: TConnectionData = db.getConnectionInfoForDB();
                if (t !== undefined && t.delegate !== undefined) {
                    t.delegate.connectionLost(db, databaseHashId);
                }
            }
        }
        connectionEntry.socket.delegate = socketDelegate;
        this.connection = connectionEntry;
        if (databaseHashId.startsWith("wss://") || databaseHashId.startsWith("ws://")) {
            connectionEntry.socket.connect(connectionEntry.databaseHashId).then( (v) => {
                if (v === false) {
                    if (connectionEntry.delegate !== undefined && connectionEntry.delegate.connectionError) {
                        connectionEntry.delegate.connectionError(this, databaseHashId, "Connection was rejected.");
                    }
                }
            }).catch((e) => {
                if (connectionEntry.delegate !== undefined && connectionEntry.delegate.connectionError) {
                    connectionEntry.delegate.connectionError(this, databaseHashId, "Connection error: " + e.message);
                }
            })
        } else {
            let token = "";
            if (connectionEntry.delegate !== undefined && connectionEntry.delegate.authRequired) {
                let authSession = connectionEntry.delegate.authRequired(this, databaseHashId);
                token = authSession.token;
            }
            let payload = {
                dbHashId: databaseHashId,
                token: token
            };

            newFlow("sksqlConnection", [
                    {
                        name: "connect",
                        run: (flowId: number, breakerId: number, attemptId: number) => {
                            if (attemptId > 5) {
                                flowExit(flowId);
                                if (connectionEntry.delegate !== undefined && connectionEntry.delegate.connectionError) {
                                    connectionEntry.delegate.connectionError(this, databaseHashId, "Connection error: " + status);
                                }
                                return;
                            }
                            fetch("https://sksql.com/api/v1/connect", {
                                method: 'post',
                                mode: 'cors', // no-cors, *cors, same-origin
                                cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-
                                body: JSON.stringify(payload),
                                headers: {'Content-Type': 'application/json'}
                            }).then((value: Response) => {
                                try {
                                    value.json().then((json) => {
                                        if (json.valid !== true) {
                                            return flowCallback(flowId, false, "Rejected");
                                        }
                                        return flowCallback(flowId, true, json.address, json);

                                    }).catch((err) => {
                                        return flowCallback(flowId, false, "Rejected: " + err.message);
                                    });
                                } catch (jsonERROR) {
                                    return flowCallback(flowId, false, "Rejected: " + jsonERROR.message);
                                }
                            }).catch((reason) => {
                                return flowCallback(flowId, false, "Rejected: " + reason.message);
                            });
                        }
                    },
                    {
                        name: "waitForServer",
                        run: (flowId, breakerId, attemptId, payload) => {
                            connectionEntry.socket.connect(payload["address"]).then((v) => {
                                if (v === false) {
                                    return flowCallback(flowId, false, "Rejected");
                                }
                                return flowCallback(flowId, true, "");
                            }).catch((e) => {
                                return flowCallback(flowId, false, "Rejected: " + e.message);
                            });
                        }
                    }

                ],
                (flowId: number, breakerStatus: kBreakerState, status: string) => {
                    if (breakerStatus === kBreakerState.opened) {
                        flowExit(flowId);
                        if (connectionEntry.delegate !== undefined && connectionEntry.delegate.connectionError) {
                            connectionEntry.delegate.connectionError(this, databaseHashId, "Connection error: " + status);
                        }
                    }
                },
                () => {

                });
        }


    }

    // Connect to a websocket
    connectToServer(address: string, delegate: TDBEventsDelegate) {
        if (address !== undefined && address.startsWith("ws")) {
            this.connectToDatabase(address, delegate);
        } else {
            throw new Error("address should starts with ws:// or wss://");
        }
    }

    // Make a javascript/typescript function callable in SQL
    // scalar function must have the signature (context: TExecutionContext, param1: any, ...): returnType
    // aggregate function must have the signature (context: TExecutionContext, mode: "init" | "row" | "final", isDistinct: boolean, groupInfo: any, param1: any, ...)
    //  the function will be called for each group with mode = "init" and must initialize and return a JSON dictionary for groupInfo
    //  for each row in the group, the function will be called with mode = "row" and must store/update data in groupInfo and return groupInfo
    //  at the end of each group, the function will be called with mode = "final" and must return a scalar value
    //
    // functions added directly with declareFunction are not saved between sessions. You must use CREATE FUNCTION to persist a SQL function.
    //
    // For functions that take different types, use TableColumnType.any in the parameter list.
    // To return different type, use TableColumnType.any in returnType. You must in this case set returnTypeSameTypeHasParameterX to the index
    // of the parameter to use for the evaluation of the return type.
    declareFunction(type: kFunctionType,
                    name: string,
                    parameters: {name: string, type: TableColumnType}[],
                    returnType: TableColumnType,
                    fn: ((...args) => any) | TQueryCreateFunction,
                    hasVariableParams: boolean = false,
                    returnTypeSameTypeHasParameterX: number = undefined) {
        let exists = this.functions.find((f) => { return f.name.toUpperCase() === name.toUpperCase();});
        if (exists) {
            exists.hasVariableParams = hasVariableParams;
            exists.parameters = JSON.parse(JSON.stringify(parameters));
            exists.returnType = returnType;
            exists.fn = fn;
            exists.returnTypeSameTypeHasParameterX = returnTypeSameTypeHasParameterX;
        } else {
            this.functions.push(
                {
                    type: type,
                    name: name,
                    parameters: JSON.parse(JSON.stringify(parameters)),
                    returnType: returnType,
                    fn: fn,
                    hasVariableParams: hasVariableParams,
                    returnTypeSameTypeHasParameterX: returnTypeSameTypeHasParameterX
                }
            );
        }
    }


    // remove the function for the session
    // to remove a function definitely use the SQL statement DROP FUNCTION
    dropFunction(fnName: string) {
        let exists = this.functions.findIndex((f) => { return f.name.toUpperCase() === fnName.toUpperCase();});
        if (exists > -1) {
            this.functions.splice(exists, 1);
        }
    }

    // add a procedure
    // use CREATE PROCEDURE for persistence.
    declareProcedure(proc: TQueryCreateProcedure) {
        let exists = this.procedures.find((p) => { return p.procName === proc.procName;});
        if (exists) {
            exists.ops = proc.ops;
            exists.parameters = proc.parameters;
        } else {
            this.procedures.push(proc);
        }
    }

    // disconnect from a socket
    disconnect() {
        let index = -1;
        if (this.connection === undefined) {
            return;
        }
        if (this.connection.socket !== undefined) {
            this.connection.socket.close();
        }
        this.connection = undefined;
    }

    // remove a table from the local session
    // to broadcast use the SQL statement DROP TABLE xxx
    dropTable(tableName: string) {
        let idx = this.allTables.findIndex((t) => {
            let tb = readTableName(t.data);
            return (tb.toUpperCase() === tableName.toUpperCase());
        });
        if (idx > -1) {

            this.allTables.splice(idx, 1);
            this.tableInfo.remove(tableName);

            if (!["DUAL", "SYS_TABLE_STATISTICS"].includes(tableName.toUpperCase())) {
                genStatsForTable(this, tableName.toUpperCase());
            }
        }
    }

    // Reserve the next identity for a table from the remote server
    // do not expect locally-generated identity to be safe if multiple users access the same table.
    // if a UUID is used as identity, make sure to generate it in JAVASCRIPT code before passing it to a SQLStatement as a string param.
    // Important: calling NEWID() in SQL will generate a different UUID locally and remotely.
    getNextId(table: string, count: number = 1): Promise<(number | number[])> {
        return new Promise<(number | number[])> ( (resolve, reject) => {
            let ci = this.getConnectionInfoForDB();
            if (ci === undefined) {
                return reject({message: "Unknown connection."});
            }
            let uid = generateV4UUID();
            ci.socket.registerForCallback(uid, WSRGNID, (payload: any) => {
                let res = payload as TWSRGNIDResponse;
                ci.socket.deregisterCallback(uid);
                if (res.ids.length === 1) {
                    resolve(res.ids[0]);
                } else if (res.ids.length > 1) {
                    resolve(res.ids);
                }
            });
            ci.socket.send(WSRGNID, { uid: uid, table: table, count: count });

        });
    }

    // Connection data
    getConnectionInfoForDB() {
        return this.connection;
    }

    // Get the function data
    getFunctionNamed(name: string): TRegisteredFunction {
        return this.functions.find((f) => { return f.name.toUpperCase() === name.toUpperCase();});
    }

    // get the ITable for a table.
    // if you need the table declaration, you will have to call readTableDefinition with the ITable
    // this is quite slow, use <SKSQL instance>.tableInfo.get to get the cached version
    getTable(tableName: string) {
        let at = this.allTables;
        for (let i = 0; i < at.length; i++ ) {
            let tb = readTableName(at[i].data);
            if (tb.toUpperCase().localeCompare(tableName.toUpperCase()) === 0) {
                return at[i];
            }
        }
        return undefined;
    }
    // return the ITable and the index of the table
    getTableDataAndIndex(tableName: string): {index: number, table: ITable} {
        let at = this.allTables;
        for (let i = 0; i < at.length; i++ ) {
            let tb = readTableName(at[i].data);
            if (tb.toUpperCase().localeCompare(tableName.toUpperCase()) === 0) {
                return {index: i, table: at[i]};
            }
        }
        return undefined;
    }

    // send the list of Buffers to a WebWorker
    updateWorkerDB(idx: number) {
        this.workers[idx].postMessage({c:"DB", d: this.allTables});
    }

    sendRemoteDatabaseQuery(query: SQLStatement, context: TExecutionContext, returnData: boolean, broadcast: boolean, resolve: (SQLResult) => void) {
        if (this.connection === undefined) {
            let res: TSQLResult = {
                error: "No remote connection.",
                messages: "",
                queries: [],
                resultTableName: "",
                rowCount: 0,
                returnValue: undefined,
                totalRuntime: 0,
                rowsModified: 0,
                rowsInserted: 0,
                rowsDeleted: 0,
                dropTable: [],
                parserTime: 0
            }
            if (resolve !== undefined) {
                resolve(res);
            }
            return;
        }

        this.pendingQueries.push({
            id: query.id,
            statement: query,
            resolve: resolve
        });

        let msg: TWSRSQL = {
            id: this.connection.socket.con_id,
            r: query.query,
            p: [],
            u: query.id,
            rd: returnData,
            b: broadcast
        };
        msg.p = JSON.parse(JSON.stringify(context.stack));
        this.connection.socket.send(WSRSQL, msg);
    }

    sendWorkerQuery(idx: number, query: SQLStatement, resolve: (SQLResult) => void) {

        this.pendingQueries.push({
            id: query.id,
            statement: query,
            resolve: resolve
        });

        let msg = { c: "QR", d: { id: query.id, query: query.query, params: []}};
        for (let i = 0; i < query.context.stack.length; i++) {
            msg.d.params.push({key: query.context.stack[i].name, value: query.context.stack[i].value});
        }
        this.workers[idx].postMessage(msg);
    }

    // internal, callback from a WebWorker
    receivedResult(id: string, openedTempTables: string[], result: TSQLResult) {
        let idx = this.pendingQueries.findIndex((pq) => { return pq.id === id;});
        if (idx > -1) {
            if (this.pendingQueries[idx].statement !== undefined && openedTempTables !== undefined && openedTempTables.length > 0) {
                this.pendingQueries[idx].statement.context.openedTempTables.push(...openedTempTables);
            }
            if (this.pendingQueries[idx].resolve !== undefined) {
                this.pendingQueries[idx].resolve(new SQLResult(this, result));
            }
        }
        this.pendingQueries.splice(idx, 1);
    }


    // dump all tables information
    tablesInfo() {
        let at = this.allTables;
        for (let i = 0; i < at.length; i++ ) {
            let tb = readTableDefinition(at[i].data);
            console.log("*****************");
            console.log("TABLE: " + tb.name);
            console.log("COLUMNS");
            for (let x = 0; x < tb.columns.length; x++) {
                console.log(`${tb.columns[x].name} ${tb.columns[x].type} ${tb.columns[x].length} ${tb.columns[x].offset}`);
            }
            console.log("BLOCKS: " + at[i].data.blocks.length);
        }
    }


    // Initialize multiple (poolSize) WebWorker
    // sksqlLib must contain the minified string of this library
    initWorkerPool(poolSize: number, sksqlLib: string) {

        let blob_src = sksqlLib + "\n\n"+workerJavascript;
        var isBrowser = new Function("try {return this===window;}catch(e){ return false;}");
        for (let i = 0; i < poolSize; i++) {
            var worker = undefined;
            if (isBrowser()) {
                let blob = new Blob([
                    blob_src as unknown as string
                ], {type: "text/javascript"});

                worker = new Worker(window.URL.createObjectURL(blob));
                worker.onmessage = (e) => {
                    //console.log("Received: " + e);
                    if (e !== undefined && e.c !== undefined) {
                        switch (e.c) {
                            case "QS": {
                                this.receivedResult(e.d.id, e.d.openedTempTables, e.d.result);
                            }
                                break;
                            case "DB": {
                                for (let i = 0; i < e.d.length; i++) {
                                    let d: ITable = e.d[i];
                                    let name = readTableName(d.data);
                                    if (!["dual", "routines", "sys_table_statistics"].includes(name)) {
                                        let exists = this.allTables.find((at) => { let n = readTableName(at.data); return (n.toUpperCase() === name.toUpperCase());});
                                        if (exists) {
                                            exists.data.tableDef = d.data.tableDef;
                                            exists.data.blocks = d.data.blocks;
                                        } else {
                                            this.allTables.push(d);
                                        }
                                    }
                                }
                                this.tableInfo.syncAll();
                            }
                                break;
                        }

                    }
                }
                worker.onerror = (e) => {
                    console.log("Error: ", e);
                }
                worker.onexit = (e) => {

                }

            } else {
                const {Worker} = require("worker_threads");
                let blob = blob_src;
                worker = new Worker(blob, {eval: true});
                worker.on("message", (e) => {
                    //console.log("Received: " + e);
                    if (e !== undefined && e.c !== undefined) {
                        switch (e.c) {
                            case "QS": {
                                this.receivedResult(e.d.id, e.d.openedTempTables, e.d.result);
                            }
                                break;
                            case "DB": {
                                for (let i = 0; i < e.d.length; i++) {
                                    let d: ITable = e.d[i];
                                    let name = readTableName(d.data);
                                    if (!["dual", "routines", "sys_table_statistics"].includes(name)) {
                                        let exists = this.allTables.find((at) => { let n = readTableName(at.data); return (n.toUpperCase() === name.toUpperCase());});
                                        if (exists) {
                                            exists.data.tableDef = d.data.tableDef;
                                            exists.data.blocks = d.data.blocks;
                                        } else {
                                            this.allTables.push(d);
                                        }
                                    }
                                }
                                this.tableInfo.syncAll();
                            }
                                break;
                        }

                    }
                });
                worker.on("error", (e) => {
                    console.log("Error: ", e);
                    //resolve(e.message);
                });
                worker.on('exit', (code) => {
                    if (code !== 0) {
                        //   reject(new Error(`stopped with  ${code} exit code`));
                    }
                });
            }
            //worker.postMessage("hello"); // Start the worker.
            let idx = this.workers.push(worker);
            this.updateWorkerDB(idx - 1);
        }

    }



    // Are SharedArrayBuffers supported?
    private static _sharedArrayBufferSupported: boolean = undefined;
    static get supportsSharedArrayBuffers(): boolean {
        try {
            if (SKSQL._sharedArrayBufferSupported === undefined) {
                let _ = new SharedArrayBuffer(1);
                SKSQL._sharedArrayBufferSupported = true;
                return true;
            } else {
                return SKSQL._sharedArrayBufferSupported;
            }
        } catch (e) {
            SKSQL._sharedArrayBufferSupported = false;
            return false;
        }
    }


}

