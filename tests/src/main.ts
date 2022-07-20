import {test_numeric} from "./numeric";
import {test_parser} from "./parser";
import {test_db_university} from "./db_university";
import {test_worker} from "./worker";

import fetch from "node-fetch";
// @ts-ignore
global["fetch"] = fetch;

import {WebSocket} from 'ws';
//@ts-ignore
global["WebSocket"] = WebSocket;

import {SKSQL} from "sksql";
import * as fs from "fs";
import {test_date} from "./test_date";
import {insert1} from "./insert1";
import {test_functions} from "./test_functions";
import {update1} from "./update1";
import {test_compress} from "./test_compress";
import {select1} from "./select1";
import {subquery1} from "./subquery1";
import {groupby1} from "./groupby1";
import {in1} from "./in1";
import {where} from "./where";
import {check} from "./check";
import {coalesce} from "./coalesce";
import {delete1} from "./delete1";
import {tsql1} from "./tsql1";
import {case1} from "./case";
import {strings} from "./strings";
import {blocks1} from "./blocks1";
import {float1} from "./float1";
import {int1} from "./int1";
import {stats1} from "./stats";
import {performance} from "perf_hooks";
import {remote1} from "./remote1";
import {alias1} from "./alias1";
import {distinct1} from "./distinct1";
import {join1} from "./join1";
import {union1} from "./union1";
import {evaluate1} from "./evaluate1";
import {perf1} from "./perf1";
import {test_sqlresult} from "./sqlresult";

let start = performance.now();

console.log("SKSQL TEST SUITE");
console.log("Loading sksql.min.js: ");
let sksqlData = fs.readFileSync("../dist/sksql.min.js").toString();
console.log(sksqlData.length + " bytes.");
console.log("");


let db = new SKSQL();
db.initWorkerPool(4, sksqlData);
test_parser(db);

const tests: ((db: SKSQL, next:()=>void) => void)[] = [evaluate1,
    blocks1, test_compress, int1, float1, test_numeric, strings, test_date, select1, where, union1, alias1, in1, case1, distinct1, join1, groupby1, check, coalesce,
    subquery1, insert1, update1, delete1, tsql1, test_functions, test_sqlresult, test_db_university, test_worker, stats1, perf1, remote1
]

let idx = -1;
const next = () => {
    idx++;
    if (idx === tests.length) {
        let end = performance.now();
        let millis = end - start;
        let minutes = Math.floor(millis / 60000);
        let seconds = ((millis % 60000) / 1000).toFixed(0);

        console.log("ALL DONE IN " + minutes + " MINUTES " + seconds + " SECONDS.");
        process.exit(0);
    }
    tests[idx](db, next);
}

next();

