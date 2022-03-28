
import {SKSQL, dumpTable, SQLResult, numericCmp, isNumeric,
    numericLoad, readFirst, cursorEOF, recordSize, rowHeaderSize, readValue,
    readNext} from "sksql";
import {runTest} from "./runTest";



export function in1(db: SKSQL, next: ()=>void) {
    console.log("TESTING IN/BETWEEN CLAUSES...");
    let setup = "DROP TABLE t1;\nCREATE TABLE t1(a int, b int);\n" +
        "INSERT INTO t1 VALUES(1,1);\n" +
        "INSERT INTO t1 VALUES(2,4);\n" +
        "INSERT INTO t1 VALUES(3,8);\n" +
        "INSERT INTO t1 VALUES(4,16);\n" +
        "INSERT INTO t1 VALUES(5,32);\n" +
        "INSERT INTO t1 VALUES(6,64);\n" +
        "INSERT INTO t1 VALUES(7,128);\n" +
        "INSERT INTO t1 VALUES(8,256);\n" +
        "INSERT INTO t1 VALUES(9,512);\n" +
        "INSERT INTO t1 VALUES(10,1024);"
    runTest(db, setup, false, false, undefined);

    runTest(db, "SELECT a FROM t1 WHERE b IN (8,12,16,24,32) ORDER BY a", false, false, [[3], [4], [5]]);
    runTest(db, "SELECT a FROM t1 WHERE b NOT IN (8,12,16,24,32) ORDER BY a", false, false, [[1], [2], [6], [7], [8], [9], [10]]);
    runTest(db, "SELECT a FROM t1 WHERE b IN (8,12,16,24,32) OR b=512 ORDER BY a", false, false, [[3], [4], [5], [9]]);
    runTest(db, "SELECT a FROM t1 WHERE b NOT IN (8,12,16,24,32) OR b=512 ORDER BY a", false, false, [[1], [2], [6], [7], [8], [9], [10]]);
    runTest(db, "SELECT a FROM t1 WHERE b IN (b+8,64)", false, false, [[6]]);
    runTest(db, "SELECT a FROM t1 WHERE b IN (greatest(5,10,b),20)", false, false, [[4], [5], [6], [7], [8], [9], [10]]);
    runTest(db, "SELECT a FROM t1 WHERE b IN (8*2,64/2) ORDER BY b", false, false, [[4], [5]]);
    runTest(db, "SELECT a FROM t1 WHERE b IN (greatest(5,10),20)", false, false, []);
    runTest(db, "SELECT a FROM t1 WHERE c IN (10,20)", true, true, undefined);
    runTest(db, "SELECT a FROM t1 WHERE b IN (SELECT b FROM t1 WHERE a<5) ORDER BY a", false, false, [[1], [2], [3], [4]]);
    runTest(db, "SELECT a FROM t1 WHERE b IN (SELECT b FROM t1 WHERE a<5) OR b==512 ORDER BY a", false, false, [[1], [2], [3], [4], [9]]);

    runTest(db, "SELECT a FROM t1 WHERE b BETWEEN 10 AND 50 ORDER BY a", false, false, [[4], [5]]);
    runTest(db, "SELECT a FROM t1 WHERE b NOT BETWEEN 10 AND 50 ORDER BY a", false, false, [[1], [2], [3], [6], [7], [8], [9], [10]]);
    runTest(db, "SELECT a FROM t1 WHERE b BETWEEN a AND a*5 ORDER BY a", false, false, [[1], [2], [3], [4]]);
    runTest(db, "SELECT a FROM t1 WHERE b NOT BETWEEN a AND a*5 ORDER BY a", false, false, [[5], [6], [7], [8], [9], [10]]);
    runTest(db, "SELECT a FROM t1 WHERE b BETWEEN a AND a*5 OR b=512 ORDER BY a", false, false, [[1], [2], [3], [4], [9]]);

    next();

}