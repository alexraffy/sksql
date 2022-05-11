


import {SQLStatement, dumpTable, SQLResult, SKSQL, numericLoad} from "sksql";
import {runTest} from "./runTest";

export function alias1(db: SKSQL, next:()=>void) {
    console.log("TESTING ALIAS...");

    runTest(db, "SELECT 'Hello' as greetings FROM dual", false, false, [['Hello']], [{greetings: "Hello"}]);
    runTest(db, "SELECT 'Hello' greetings FROM dual", true, true, undefined, undefined);
    runTest(db, "SELECT 'Hello' FROM dual d", false, false, [['Hello']]);
    runTest(db, "SELECT 'Hello' FROM dual as d", false, false, [["Hello"]]);
    runTest(db, "DROP TABLE t1; DROP TABLE t2;", false, false, undefined);
    runTest(db, "CREATE TABLE t1(a int, b int); CREATE TABLE t2(a int, b int);", false, false, undefined);
    runTest(db, "INSERT INTO t1 VALUES(10, 20); INSERT INTO t2 VALUES(10, 30); INSERT INTO t1 VALUES(40, 10);", false, false, undefined);
    runTest(db, "SELECT * FROM t1", false, false, [[10, 20], [40, 10]]);
    runTest(db, "SELECT * FROM t2", false, false, [[10, 30]]);
    runTest(db, "SELECT * FROM t1 as table1", false, false, [[10, 20], [40, 10]]);
    runTest(db, "SELECT table1.a, table1.b from t1 table1", false, false, [[10, 20], [40, 10]]);
    runTest(db, "SELECT t1.b as t1b, t2.b as t2b FROM t1 JOIN t2 ON t2.a = t1.a;", false, false, [[20, 30]], undefined, {printDebug: false});
    runTest(db, "SELECT table1.b, table2.b FROM t1 as table1 JOIN t2 table2 ON table2.a = table1.a", false, false, [[20, 30]], undefined, {printDebug: false});
    runTest(db, "SELECT a, b FROM (SELECT * FROM t1)", false, false, [[10, 20], [40, 10]]);
    runTest(db, "SELECT a, b FROM (SELECT * FROM t1) f", false, false, [[10, 20], [40, 10]]);
    runTest(db, "SELECT f.a, f.b FROM (SELECT * FROM t1) f", false, false, [[10, 20], [40, 10]]);
    runTest(db, "SELECT f.b, g.b FROM (SELECT * FROM t1) f JOIN (SELECT * FROM t2) g ON g.a = f.a", false, false, [[20, 30]]);


    next();
}