import {ITable} from "../Table/ITable";
import {readTableDefinition} from "../Table/readTableDefinition";
import {SQLStatement} from "./SQLStatement";
import {SQLResult} from "./SQLResult";
import {generateV4UUID} from "./generateV4UUID";
import {ITableDefinition, TableColumnType} from "../main";
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

export class DBData implements TWebSocketDelegate {
    private static _instance:DBData;

    public delegate: TDBEventsDelegate = undefined;

    private workers: Worker[] = [];
    private pendingQueries: {id: string, resolve: (result: string) => void, reject: (reason: string) => void}[] = [];
    private functions: TRegisteredFunction[] = [];
    private remoteServer: string;
    private authInfo: TAuthSession;

    constructor(delegate: TDBEventsDelegate = undefined, remoteServer: string = "") {
        this.allTables = [];
        DBData._instance = this;
        let dual = new SQLStatement("CREATE TABLE dual(DUMMY VARCHAR(1)); INSERT INTO dual (DUMMY) VALUES('X');");
        dual.run();
        registerFunctions();
        this.remoteServer = remoteServer;
        this.delegate = delegate;
        this.attemptConnection();
    }
    static get instance(): DBData {
        if (DBData._instance === undefined) {
            new DBData();
        }
        return DBData._instance;
    }

    attemptConnection() {
        if (CWebSocket.instance === undefined) {
            let _ = new CWebSocket();
        }
        CWebSocket.instance.delegate = this;
        CWebSocket.instance.connect(this.remoteServer).then(
            (value) => {

            }
        ).catch( (e) => {

        });
    }

    on(msg: TSocketResponse) {
        if (msg.message === WSRAuthenticatePlease) {
            if (this.delegate !== undefined) {
                this.authInfo = this.delegate.authRequired();
                CWebSocket.instance.send(WSRAuthenticate, {
                    id: msg.id,
                    info: this.authInfo
                } as TWSRAuthenticateRequest)

            } else {
              throw new Error("SKSQL: DBData requires a TDBEventsDelegate to access a remote database.")
            }
        }
        if (msg.message === WSRAuthenticate) {
            let payload = msg.param as TWSRAuthenticateResponse;
            let connection_id = payload.con_id;
            // Request data
            CWebSocket.instance.send(WSRDataRequest, { id: this.authInfo.id } as TWSRDataRequest)
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

        if (this.delegate !== undefined) {
            this.delegate.on(msg.message, msg.param);
        }
    }

    connectionLost() {
        if (this.delegate !== undefined) {
            this.delegate.connectionLost();
        }
    }

    connected(): boolean {
        if (CWebSocket.instance === undefined) {
            return false;
        }
        return CWebSocket.instance.connected;
    }


    allTables: ITable[];

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

    getTable(tableName: string) {
        let at = this.allTables;
        for (let i = 0; i < at.length; i++ ) {
            let tb = readTableDefinition(at[i].data);
            if (tb.name.toUpperCase().localeCompare(tableName.toUpperCase()) === 0) {
                return at[i];
            }
        }
        return undefined;
    }
    getTableDataAndIndex(tableName: string): {index: number, table: ITable} {
        let at = this.allTables;
        for (let i = 0; i < at.length; i++ ) {
            let tb = readTableDefinition(at[i].data);
            if (tb.name.toUpperCase().localeCompare(tableName.toUpperCase()) === 0) {
                return {index: i, table: at[i]};
            }
        }
        return undefined;
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
        for (let i = 0; i < query.parameters.length; i++) {
            msg.d.params.push({key: query.parameters[i].name, value: query.parameters[i].value});
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

    declareFunction(type: kFunctionType, name: string, parameters: {name: string, type: TableColumnType}[], returnType: TableColumnType, fn: (...args) => any) {
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

    getFunctionNamed(name: string): TRegisteredFunction {
        return this.functions.find((f) => { return f.name.toUpperCase() === name.toUpperCase();});
    }
    private static _sharedArrayBufferSupported: boolean = undefined;
    static get supportsSharedArrayBuffers(): boolean {
        try {
            if (DBData._sharedArrayBufferSupported === undefined) {
                let _ = new SharedArrayBuffer(1);
                DBData._sharedArrayBufferSupported = true;
                return true;
            } else {
                return DBData._sharedArrayBufferSupported;
            }
        } catch (e) {
            DBData._sharedArrayBufferSupported = false;
            return false;
        }
    }


}


export function DBInit() {
    let _ = new DBData();

}