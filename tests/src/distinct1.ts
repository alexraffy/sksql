


import {SQLStatement, dumpTable, SQLResult, SKSQL, numericLoad} from "sksql";
import {runTest} from "./runTest";


export function distinct1(db: SKSQL, next:()=>void) {
    console.log("TESTING DISTINCT...");

    runTest(db, "DROP TABLE t1;", false, false, undefined);
    runTest(db, "CREATE TABLE t1(a int, b int, c int);", false, false, undefined);
    runTest(db, "INSERT INTO t1(a,b,c) VALUES(10, 20, 30);", false, false, undefined);
    runTest(db, "INSERT INTO t1(a,b,c) VALUES(10, 40, 50);", false, false, undefined);
    runTest(db, "INSERT INTO t1(a,b,c) VALUES(60, 70, 80);", false, false, undefined);
    runTest(db, "INSERT INTO t1(a,b,c) VALUES(60, 70, 90);", false, false, undefined);
    runTest(db, "SELECT DISTINCT a FROM t1", false, false, [[10], [60]], undefined, {printDebug: false});
    runTest(db, "SELECT DISTINCT a, b FROM t1", false, false, [[10, 20], [10, 40], [60, 70]], undefined, {printDebug: false});
    runTest(db, "DROP TABLE t1;", false, false, undefined);
    runTest(db, "CREATE TABLE t1(city VARCHAR(50), country VARCHAR(50), pop int);", false, false, undefined);
    runTest(db, "INSERT INTO t1 VALUES('Paris', 'France', 65);", false, false, undefined);
    runTest(db, "INSERT INTO t1 VALUES('Lyon', 'France', 10);", false, false, undefined);
    runTest(db, "INSERT INTO t1 VALUES('Paris', 'USA', 1);", false, false, undefined);
    runTest(db, "SELECT DISTINCT city FROM t1", false, false, [["Paris"], ["Lyon"]]);
    runTest(db, "SELECT DISTINCT city, country FROM t1", false, false, [["Paris", "France"], ["Lyon", "France"], ["Paris", "USA"]]);



    next();

}