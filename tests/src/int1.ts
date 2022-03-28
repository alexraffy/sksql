

import {SQLStatement, dumpTable, SQLResult, SKSQL, readTableDefinition} from "sksql";
import {runTest} from "./runTest";


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


    next();
}