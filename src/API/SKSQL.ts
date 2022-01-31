import {ITable} from "../Table/ITable";
import {readTableDefinition} from "../Table/readTableDefinition";
import {SQLStatement} from "./SQLStatement";
import {SQLResult} from "./SQLResult";
import {generateV4UUID} from "./generateV4UUID";
import {compileNewRoutines, ITableDefinition, TableColumnType, TWSRDataResponse, WSROK} from "../main";
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

let workerJavascript = "";
workerJavascript = "const { WorkerData, parentPort } = require('worker_threads')\n";
workerJavascript += "\n";
workerJavascript += "function runQuery(id, str, params) {\n";
//workerJavascript += "   console.log(\"QUERY: \" + str);\n";
workerJavascript += "   let st = new sksql.SQLStatement(str);\n";
workerJavascript += "   if (params !== undefined && params.length > 0) {\n"
workerJavascript += "       for (let i = 0; i < params.length; i++) {\n";
workerJavascript += "           st.setParameter(params[i].key, params[i].value);\n";
workerJavascript += "       }\n";
workerJavascript += "   }\n";
workerJavascript += "   let result = st.run();\n";
//workerJavascript += "   console.dir(result);\n";
workerJavascript += "   if (result.error === undefined && result.resultTableName !== \"\") {\n";
workerJavascript += "       parentPort.postMessage({c: \"DB\", d: sksql.DBData.instance.allTables});\n";
workerJavascript += "   }\n";
workerJavascript += "   parentPort.postMessage({ c: \"QS\", d: {id: id, result: result} });\n";
workerJavascript += "}\n\n";
workerJavascript += "parentPort.on('message', (value) => {\n";
workerJavascript += "   if (value !== undefined && value.c !== undefined) {\n";
// workerJavascript += "       console.log(\"WW Received:\", value.c);\n";
workerJavascript += "       switch (value.c) {\n";
workerJavascript += "           case \"DB\":\n";
workerJavascript += "               sksql.DBData.instance.allTables = value.d;\n";
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
    private static _instance: SKSQL;


    allTables: ITable[];
    public connections: TConnectionData[] = [];

    private workers: Worker[] = [];
    private pendingQueries: {id: string, resolve: (result: string) => void, reject: (reason: string) => void}[] = [];
    functions: TRegisteredFunction[] = [];
    procedures: TQueryCreateProcedure[] = [];



    constructor() {
        this.allTables = [];
        SKSQL._instance = this;
        let dual = new SQLStatement("CREATE TABLE dual(DUMMY VARCHAR(1)); INSERT INTO dual (DUMMY) VALUES('X');", false);
        dual.run();
        let routines = new SQLStatement("CREATE TABLE master.routines(schema VARCHAR(255), name VARCHAR(255), type VARCHAR(10), definition VARCHAR(64536), modified DATETIME);", false);
        routines.run();
        registerFunctions();
    }

    static get instance(): SKSQL {
        if (SKSQL._instance === undefined) {
            new SKSQL();
        }
        return SKSQL._instance;
    }


    connectToDatabase(databaseHashId: string, delegate: TDBEventsDelegate) {

        let connectionEntry: TConnectionData = {
            databaseHashId: databaseHashId,
            socket: new CWebSocket(),
            delegate: delegate,
        }
        let socketDelegate: TWebSocketDelegate = {
            databaseHashId: databaseHashId,
            connectionError(databaseHashId: string, error: string) {
                let connectionInfo: TConnectionData = SKSQL.instance.getConnectionInfoForDB(this.databaseHashId);
                if (connectionInfo !== undefined) {
                    if (connectionInfo.delegate !== undefined && connectionInfo.delegate.connectionError !== undefined) {
                        connectionInfo.delegate.connectionError(databaseHashId, error);
                    }
                }
            },
            on(databaseHashId: string, msg: TSocketResponse) {
                let connectionInfo: TConnectionData = SKSQL.instance.getConnectionInfoForDB(this.databaseHashId);
                if (msg.message === WSRAuthenticatePlease) {
                    if (connectionInfo.delegate !== undefined) {
                        connectionInfo.auth = connectionInfo.delegate.authRequired(this.databaseHashId);

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
                        let statement = new SQLStatement(payload.r, false);
                        let rets = statement.run();
                    } catch (e) {
                        console.warn(e.message);
                    }
                }
                if (msg.message === WSROK) {
                    compileNewRoutines();

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
                                tableDef: buf,
                                blocks: []
                            }
                        }
                        let tblDef = readTableDefinition(t.data, true);
                        if (SKSQL.instance.getTable(tblDef.name) !== undefined) {
                            SKSQL.instance.dropTable(tblDef.name);
                        }
                        SKSQL.instance.allTables.push(t);

                    } else if (payload.type === "B") {
                        let t = SKSQL.instance.getTable(payload.tableName);
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
                            t.data.blocks.push(buf);
                        }
                    }
                }

                if (connectionInfo.delegate !== undefined) {
                    connectionInfo.delegate.on(this.databaseHashId, msg.message, msg.param);
                }
            },
            connectionLost(databaseHashId: string) {
                let t: TConnectionData = SKSQL.instance.getConnectionInfoForDB(this.databaseHashId);
                if (t.delegate !== undefined) {
                    t.delegate.connectionLost(this.databaseHashId);
                }
            }
        }
        connectionEntry.socket.delegate = socketDelegate;
        this.connections.push(connectionEntry);
        if (databaseHashId.startsWith("wss://") || databaseHashId.startsWith("ws://")) {
            connectionEntry.socket.connect(connectionEntry.databaseHashId).then( (v) => {
                if (v === false) {
                    if (connectionEntry.delegate !== undefined && connectionEntry.delegate.connectionLost) {
                        connectionEntry.delegate.connectionError(databaseHashId, "Connection was rejected.");
                    }
                }
            }).catch((e) => {
                if (connectionEntry.delegate !== undefined && connectionEntry.delegate.connectionLost) {
                    connectionEntry.delegate.connectionError(databaseHashId, "Connection error: " + e.message);
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


    declareFunction(type: kFunctionType, name: string, parameters: {name: string, type: TableColumnType}[], returnType: TableColumnType, fn: ((...args) => any) | TQueryCreateFunction) {
        let exists = this.functions.find((f) => { return f.name.toUpperCase() === name.toUpperCase();});
        if (exists) {
            exists.parameters = JSON.parse(JSON.stringify(parameters));
            exists.returnType = returnType;
            exists.fn = fn;
        } else {
            this.functions.push(
                {
                    type: type,
                    name: name,
                    parameters: JSON.parse(JSON.stringify(parameters)),
                    returnType: returnType,
                    fn: fn
                }
            );
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
            let tb = readTableDefinition(t.data);
            return (tb.name.toUpperCase() === tableName.toUpperCase());
        });
        if (idx > -1) {
            this.allTables.splice(idx, 1);
        }
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

    receivedResult(id: string, result: SQLResult[]) {
        let idx = this.pendingQueries.findIndex((pq) => { return pq.id === id;});
        if (idx > -1) {
            if (result[0].error !== undefined) {
                this.pendingQueries[idx].reject(result[0].error);
            } else {
                this.pendingQueries[idx].resolve(result[0].resultTableName);
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
                                this.allTables = e.d;
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

