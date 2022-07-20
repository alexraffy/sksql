

import {SQLStatement, dumpTable, TSQLResult, SKSQL, numericLoad} from "sksql";
import {checkNoTempTables, runTest} from "./runTest";

export function case1(db: SKSQL, next: ()=> void) {
    console.log("TESTING CASE WHEN...");

    let reset = "DROP TABLE t1; CREATE TABLE t1(a INTEGER, b INT, c INT, d INT, e INT, f INT);\n" +
        "    INSERT INTO t1 VALUES(1,11,12,13,14,15);\n" +
        "    INSERT INTO t1 VALUES(2,21,22,23,24,25);";
    runTest(db, reset, false, false, undefined);

    runTest(db, "SELECT CASE WHEN a==1 THEN b ELSE c END, b, c FROM t1", false, false, [
        [11, 11, 12],
        [22, 21, 22]
    ]);
    runTest(db, "SELECT CASE a WHEN 1 THEN b WHEN 2 THEN c ELSE d END, b, c, d FROM t1", false, false, [
        [11, 11, 12, 13],
        [22, 21, 22, 23]
    ]);
    runTest(db, "SELECT CASE b WHEN 11 THEN -b WHEN 21 THEN -c ELSE -d END, b, c, d FROM t1", false, false, [
        [-11, 11, 12, 13],
        [-22, 21, 22, 23]
    ]);
    runTest(db, "SELECT CASE b+1 WHEN c THEN d WHEN e THEN f ELSE 999 END, b, c, d FROM t1", false, false, [
        [13, 11, 12, 13],
        [23, 21, 22, 23]
    ]);
    runTest(db, "SELECT CASE a WHEN 1 THEN 'ok' ELSE 'nope' END FROM t1", false, false, [
        ['ok'],
        ['nope']
    ]);
    runTest(db, "SELECT CASE a WHEN 1 THEN 'ok' ELSE NULL END FROM t1", false, false, [
        ['ok'],
        [undefined]
    ]);
    runTest(db, "SELECT CASE a WHEN 1 THEN NULL ELSE 'nope' END FROM t1", false, false, [
        [undefined],
        ['nope']
    ]);
    runTest(db, "SELECT a FROM t1 ORDER BY CASE WHEN a = 1 THEN 1 ELSE 0 END ASC", false, false, [
        [2],
        [1]
    ]);
    runTest(db, "SELECT a FROM t1 ORDER BY CASE WHEN a = 1 THEN 1 ELSE 0 END DESC", false, false, [
        [1],
        [2]
    ]);
    runTest(db, "SELECT a, b FROM t1 ORDER BY CASE WHEN a = 1 THEN b+11 ELSE b END DESC", false, false, [
        [1, 11],
        [2, 21]
    ], undefined, {printDebug: false});

    checkNoTempTables(db);
    next();

}