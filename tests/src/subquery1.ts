
import {SKSQL, SQLStatement, SQLResult, numericCmp, isNumeric,
    numericLoad, readFirst, cursorEOF, recordSize, rowHeaderSize, readValue,
    readNext} from "sksql";
import {runTest} from "./runTest";



export function subquery1(db: SKSQL, next:()=>void) {
    console.log("TESTING SUBQUERIES...");

    let init = "DROP TABLE t1; DROP TABLE t2; CREATE TABLE t1(a int,b int);" +
    "INSERT INTO t1 VALUES(1,2);" +
    "INSERT INTO t1 VALUES(3,4);" +
    "INSERT INTO t1 VALUES(5,6);" +
    "INSERT INTO t1 VALUES(7,8);" +
    "CREATE TABLE t2(x int,y int);" +
    "INSERT INTO t2 VALUES(1,1);" +
    "INSERT INTO t2 VALUES(3,9);" +
    "INSERT INTO t2 VALUES(5,25);" +
    "INSERT INTO t2 VALUES(7,49);";
    runTest(db, init, false, false, undefined);

    runTest(db, "SELECT a, (SELECT y FROM t2 WHERE x=a) FROM t1 WHERE b<8", false, false,
        [
            [1, 1],
            [3, 9],
            [5, 25]
        ]);

    next();

}