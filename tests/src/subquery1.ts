
import {SKSQL, SQLStatement, SQLResult, numericCmp, isNumeric,
    numericLoad, readFirst, cursorEOF, recordSize, rowHeaderSize, readValue,
    kDebugLevel} from "sksql";
import {checkNoTempTables, runTest} from "./runTest";



export function subquery1(db: SKSQL, next:()=>void) {
    console.log("TESTING SUBQUERIES...");

    runTest(db, "SELECT (SELECT 'Hello' FROM DUAL) FROM DUAL", false, false, [["Hello"]], [{"(SELECT 'Hello' FROM DUAL)": "Hello"}], {printDebug: false});
    runTest(db, "SELECT (SELECT true FROM DUAL) FROM DUAL", false, false, [[true]]);
    runTest(db, "SELECT (SELECT -150 FROM DUAL) FROM DUAL", false, false, [[-150]]);
    runTest(db, "SELECT (SELECT 1.10 FROM DUAL) FROM DUAL", false, false, [[numericLoad("1.10")]]);



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

    runTest(db, "SELECT (SELECT y FROM t2 WHERE t2.x = t1.a) FROM t1 WHERE a = 5;", false, false, [[25]]);


    checkNoTempTables(db);

    next();

}