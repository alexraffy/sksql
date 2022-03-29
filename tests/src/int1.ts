

import {SQLStatement, dumpTable, SQLResult, SKSQL, numericLoad} from "sksql";
import {runTest} from "./runTest";
import {nearlyEqual} from "./float1";



export function int1(db: SKSQL, next:()=>void) {
    console.log("TESTING INTEGERS...");

    runTest(db, "SELECT 1 FROM dual", false, false, [[1]]);
    runTest(db, "SELECT 1 * 5 FROM dual", false, false, [[5]]);
    runTest(db, "SELECT 1 / 1  FROM dual", false, false, [[1]]);
    runTest(db, "SELECT 1 / 0  FROM dual", true, true, undefined);
    runTest(db, "SELECT 1 / 3 FROM dual", false, false, [[0]]);
    runTest(db, "SELECT 1 + 3 FROM dual", false, false, [[4]]);
    runTest(db, "SELECT 1 + 3 * 2 FROM dual", false, false, [[7]]);
    runTest(db, "SELECT 4 + 2 / 2 - 3 * 2 FROM dual", false, false, [[-1]]);
    runTest(db, "SELECT -125 as ret FROM dual", false, false, [[-125]]);
    runTest(db, "SELECT 3 + -3 FROM dual", false, false, [[0]]);
    runTest(db, "SELECT (2 *4) + 4 / ( 1 + 1) FROM dual", false, false, [[10]]);
    runTest(db, "SELECT ((2*4) + 4) / ( 1 + 1) FROM dual", false, false, [[6]]);

    runTest(db, "SELECT ABS(-150) FROM dual", false, false, [[150]]);
    runTest(db, "SELECT ROUND(150, 0) FROM dual", false, false, [[150]]);
    runTest(db, "SELECT POWER(150, 1) FROM dual", false, false, [[150]]);
    runTest(db, "SELECT CAST(10.1 AS INTEGER) FROM dual", false, false, [[10]]);
    runTest(db, "SELECT CAST(10 AS FLOAT) FROM dual", false, false, [[(a) => { return nearlyEqual(a, 10); }]]);
    runTest(db, "SELECT CAST(10 AS NUMERIC(12,2)) FROM dual", false, false, [[numericLoad("10.00")]]);

    next();
}