import {ITable} from "../Table/ITable";
import {readTableDefinition} from "../Table/readTableDefinition";
import {SQLStatement} from "./SQLStatement";
import {SQLResult} from "./SQLResult";
import {generateV4UUID} from "./generateV4UUID";
import { ITableDefinition } from "../main";


let workerJavascript = "const { WorkerData, parentPort } = require('worker_threads')\n";
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

export class DBData {
    private static _instance:DBData;

    private workers: Worker[] = [];
    private pendingQueries: {id: string, resolve: (result: string) => void, reject: (reason: string) => void}[] = [];

    constructor() {
        this.allTables = [];
        DBData._instance = this;
        let dual = new SQLStatement("CREATE TABLE dual(DUMMY VARCHAR(1)); INSERT INTO dual (DUMMY) VALUES('X');");
        dual.run();

    }
    static get instance(): DBData {
        if (DBData._instance === undefined) {
            new DBData();
        }
        return DBData._instance;
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
            if (tb.name.localeCompare(tableName) === 0) {
                return at[i];
            }
        }
        return undefined;
    }
    getTableDataAndIndex(tableName: string): {index: number, table: ITable} {
        let at = this.allTables;
        for (let i = 0; i < at.length; i++ ) {
            let tb = readTableDefinition(at[i].data);
            if (tb.name.localeCompare(tableName) === 0) {
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

            } else {
                const {Worker} = require("worker_threads");
                let blob = blob_src;
                worker = new Worker(blob, {eval: true});
            }
            worker.on("message",  (e) => {
                console.log("Received: " + e);
                if (e !== undefined && e.c !== undefined) {
                    switch (e.c) {
                        case "QS":
                        {
                            this.receivedResult(e.d.id, e.d.result);
                        }
                        break;
                        case "DB":
                        {
                            this.allTables = e.d;
                        }
                        break;
                    }

                }
            });
            worker.on("error", (e) => {
                console.log("Error: ", e);
                //resolve(e.message);
            }),
            worker.on('exit', (code) => {
                if (code !== 0) {
                    //   reject(new Error(`stopped with  ${code} exit code`));
                }
            })
            //worker.postMessage("hello"); // Start the worker.
            let idx = this.workers.push(worker);
            this.updateWorkerDB(idx-1);

        }

    }
}


export function DBInit() {
    let _ = new DBData();

}