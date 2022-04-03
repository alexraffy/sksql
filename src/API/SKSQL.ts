import {ITable} from "../Table/ITable";
import {readTableDefinition} from "../Table/readTableDefinition";
import {SQLStatement} from "./SQLStatement";
import {SQLResult} from "./SQLResult";
import {generateV4UUID} from "./generateV4UUID";
import {
    compileNewRoutines, decompress, genStatsForTable,
    ITableDefinition,
    TableColumnType,
    TWSRDataResponse,
    TWSRGNIDResponse,
    WSRGNID,
    WSROK
} from "../main";
import {kFunctionType} from "../Functions/kFunctionType";
import {TRegisteredFunction} from "../Functions/TRegisteredFunction";
import {registerFunctions} from "../Functions/registerFunctions";
import {CWebSocket} from "../WebSocket/CWebSocket";
import {TWebSocketDelegate} from "../WebSocket/TWebSocketDelegate";
import {TSocketResponse} from "../WebSocket/TSocketResponse";
import {
    TWSRAuthenticateRequest,
    TWSRAuthenticateResponse, TWSRDataRequest, TWSRSQL,
    WSRAuthenticate,
    WSRAuthenticatePlease, WSRDataRequest, WSRSQL
} from "../WebSocket/TMessages";
import {TAuthSession} from "../WebSocket/TAuthSession";
import {TDBEventsDelegate} from "./TDBEventsDelegate";
import {TQueryCreateFunction} from "../Query/Types/TQueryCreateFunction";
import {TQueryCreateProcedure} from "../Query/Types/TQueryCreateProcedure";
import {readTableName} from "../Table/readTableName";
import {CTableInfoManager} from "./CTableInfoManager";

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
workerJavascript += "   let result = st.run();\n";
//workerJavascript += "   console.dir(result);\n";
workerJavascript += "   if (result.error === undefined && result.resultTableName !== \"\") {\n";
workerJavascript += "       parentPort.postMessage({c: \"DB\", d: db.allTables});\n";
workerJavascript += "   }\n";
workerJavascript += "   parentPort.postMessage({ c: \"QS\", d: {id: id, result: result} });\n";
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


export class SKSQL {

    allTables: ITable[];
    public connections: TConnectionData[] = [];

    private workers: Worker[] = [];
    private pendingQueries: {id: string, resolve: (result: string) => void, reject: (reason: string) => void}[] = [];
    functions: TRegisteredFunction[] = [];
    procedures: TQueryCreateProcedure[] = [];

    tableInfo: CTableInfoManager;

    constructor() {
        this.allTables = [];
        //SKSQL._instance = this;
        this.tableInfo = new CTableInfoManager(this);

        let dual = new SQLStatement(this, "CREATE TABLE dual(DUMMY VARCHAR(1)); INSERT INTO dual (DUMMY) VALUES('X');", false);
        dual.run();

        let stats = new SQLStatement(this, "CREATE TABLE master.sys_table_statistics(id uint32 identity(1,1), timestamp datetime, table VARCHAR(255), active_rows UINT32, dead_rows UINT32, header_size UINT32, total_size UINT32, largest_block_size UINT32, table_timestamp DATETIME);", false);
        stats.run();

        let routines = new SQLStatement(this, "CREATE TABLE master.routines(schema VARCHAR(255), name VARCHAR(255), type VARCHAR(10), definition VARCHAR(64536), modified DATETIME);", false);
        routines.run();
        registerFunctions(this);



    }

    /*
    static get instance(): SKSQL {
        if (SKSQL._instance === undefined) {
            new SKSQL();
        }
        return SKSQL._instance;
    }
     */


    connectToDatabase(databaseHashId: string, delegate: TDBEventsDelegate) {

        let connectionEntry: TConnectionData = {
            databaseHashId: databaseHashId,
            socket: new CWebSocket(this, databaseHashId),
            delegate: delegate,
        }
        let socketDelegate: TWebSocketDelegate = {
            databaseHashId: databaseHashId,
            connectionError(db: SKSQL, databaseHashId: string, error: string) {
                let connectionInfo: TConnectionData = db.getConnectionInfoForDB(this.databaseHashId);
                if (connectionInfo !== undefined) {
                    if (connectionInfo.delegate !== undefined && connectionInfo.delegate.connectionError !== undefined) {
                        connectionInfo.delegate.connectionError(db, databaseHashId, error);
                    }
                }
            },
            on(db: SKSQL, databaseHashId: string, msg: TSocketResponse) {
                let connectionInfo: TConnectionData = db.getConnectionInfoForDB(databaseHashId);
                if (msg.message === WSRAuthenticatePlease) {
                    if (connectionInfo.delegate !== undefined) {
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
                    // Request data
                    connectionInfo.socket.send(WSRDataRequest, { id: connectionInfo.auth.id } as TWSRDataRequest)
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
                        let rets = statement.run();
                    } catch (e) {
                        console.warn(e.message);
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
                    if (payload.type === "T") {
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

                    } else if (payload.type === "B") {
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

                if (connectionInfo.delegate !== undefined) {
                    connectionInfo.delegate.on(db, databaseHashId, msg.message, msg.param);
                }
            },
            connectionLost(db: SKSQL, databaseHashId: string) {
                let t: TConnectionData = db.getConnectionInfoForDB(databaseHashId);
                if (t.delegate !== undefined) {
                    t.delegate.connectionLost(db, databaseHashId);
                }
            }
        }
        connectionEntry.socket.delegate = socketDelegate;
        this.connections.push(connectionEntry);
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
            fetch("https://sksql.com/api/v1/connect", {
                method: 'post',
                body: JSON.stringify(payload),
                headers: {'Content-Type': 'application/json'}
            }).then((value: Response) => {
                value.json().then((json) => {
                    if (json.valid === false) {
                        if (connectionEntry.delegate !== undefined && connectionEntry.delegate.connectionError) {
                            connectionEntry.delegate.connectionError(this, databaseHashId, "Connection was rejected.");
                        }
                        return;
                    }
                    connectionEntry.socket.connect(json.address).then( (v) => {
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
                }).catch ((err) => {
                    if (connectionEntry.delegate !== undefined && connectionEntry.delegate.connectionError) {
                        connectionEntry.delegate.connectionError(this, databaseHashId, "Connection error: " + err.message);
                    }
                })
            }).catch ((reason) => {
                if (connectionEntry.delegate !== undefined && connectionEntry.delegate.connectionLost) {
                    connectionEntry.delegate.connectionError(this, databaseHashId, "Connection error: " + reason.message);
                }
            })
        }


    }

    connectToServer(address: string, delegate: TDBEventsDelegate) {
        if (address !== undefined && address.startsWith("ws")) {
            this.connectToDatabase(address, delegate);
        } else {
            throw new Error("address should starts with ws:// or wss://");
        }
    }


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

    dropFunction(fnName: string) {
        let exists = this.functions.findIndex((f) => { return f.name.toUpperCase() === fnName.toUpperCase();});
        if (exists > -1) {
            this.functions.splice(exists, 1);
        }

    }


    declareProcedure(proc: TQueryCreateProcedure) {
        let exists = this.procedures.find((p) => { return p.procName === proc.procName;});
        if (exists) {
            exists.ops = proc.ops;
            exists.parameters = proc.parameters;
        } else {
            this.procedures.push(proc);
        }
    }

    disconnect(databaseHashId: string) {
        let cn  = this.getConnectionInfoForDB(databaseHashId);
        if (cn !== undefined) {
            cn.socket.close();
        }
    }

    dropTable(tableName: string) {
        let idx = this.allTables.findIndex((t) => {
            let tb = readTableName(t.data);
            return (tb.toUpperCase() === tableName.toUpperCase());
        });
        if (idx > -1) {
            this.allTables.splice(idx, 1);
            this.tableInfo.remove(tableName);
            genStatsForTable(this, tableName.toUpperCase());
        }
    }

    getNextId(databaseHashId: string, table: string, count: number = 1): Promise<(number | number[])> {
        return new Promise<(number | number[])> ( (resolve, reject) => {
            let ci = this.getConnectionInfoForDB(databaseHashId);
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

    getConnectionInfoForDB(databaseHashId: string) {
        return this.connections.find((c) => { return c.databaseHashId === databaseHashId;});
    }

    getFunctionNamed(name: string): TRegisteredFunction {
        return this.functions.find((f) => { return f.name.toUpperCase() === name.toUpperCase();});
    }

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


    updateWorkerDB(idx: number) {
        this.workers[idx].postMessage({c:"DB", d: this.allTables});
    }
    sendWorkerQuery(idx: number, query: SQLStatement, reject, resolve) {
        let queryId = generateV4UUID();
        this.pendingQueries.push({
            id: queryId,
            resolve: resolve,
            reject: reject
        });

        let msg = { c: "QR", d: { id: queryId, query: query.query, params: []}};
        for (let i = 0; i < query.context.stack.length; i++) {
            msg.d.params.push({key: query.context.stack[i].name, value: query.context.stack[i].value});
        }
        this.workers[idx].postMessage(msg);
    }

    receivedResult(id: string, result: SQLResult) {
        let idx = this.pendingQueries.findIndex((pq) => { return pq.id === id;});
        if (idx > -1) {
            if (result.error !== undefined) {
                this.pendingQueries[idx].reject(result.error);
            } else {
                this.pendingQueries[idx].resolve(result.resultTableName);
            }
        }
        this.pendingQueries.splice(idx, 1);
    }


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
                                this.receivedResult(e.d.id, e.d.result);
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
                                this.receivedResult(e.d.id, e.d.result);
                            }
                                break;
                            case "DB": {
                                this.allTables = e.d;
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

