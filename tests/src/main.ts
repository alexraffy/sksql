import {test_numeric} from "./numeric";
import {test_parser} from "./parser";
import {test_db_university} from "./db_university";
import {test_worker} from "./worker";
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

console.log("SKSQL TEST SUITE");
console.log("Loading sksql.min.js: ");
let sksqlData = fs.readFileSync("../dist/sksql.min.js").toString();
console.log(sksqlData.length + " bytes.");
console.log("");

test_parser();
let db = new SKSQL();
db.initWorkerPool(4, sksqlData);

const tests: ((db: SKSQL, next:()=>void) => void)[] = [
    blocks1, test_compress, int1, float1, test_numeric, strings, test_date, select1, where, in1, case1, groupby1, check, coalesce,
    subquery1, insert1, update1, delete1, tsql1, test_functions, test_db_university, test_worker
]

let idx = -1;
const next = () => {
    idx++;
    if (idx === tests.length) {
        console.log("ALL DONE.");
        process.exit(0);
    }
    tests[idx](db, next);
}

next();

