


import {SQLStatement, dumpTable, SQLResult, SKSQL, numericLoad} from "sksql";
import {runTest} from "./runTest";


export function conflict(db: SKSQL) {
    let init = "CREATE TABLE t1(a, b, c, UNIQUE(a,b));\n" +
        "    CREATE TABLE t2(x);\n" +
        "    SELECT c FROM t1 ORDER BY c";




}