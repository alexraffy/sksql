
import {SKSQL, SQLStatement, TSQLResult, numericCmp, isNumeric,
    numericLoad, readFirst, cursorEOF, recordSize, rowHeaderSize, readValue,
    kDebugLevel} from "sksql";
import {checkNoTempTables, runTest} from "./runTest";



export function subquery1(db: SKSQL, next:()=>void) {
    console.log("TESTING SUBQUERIES...");

    runTest(db, "SELECT (SELECT 'Hello' FROM DUAL) FROM DUAL", false, false, [["Hello"]], [{"(SELECT 'Hello' FROM DUAL)": "Hello"}], {printDebug: false});
    runTest(db, "SELECT (SELECT true FROM DUAL) FROM DUAL", false, false, [[true]]);
    runTest(db, "SELECT (SELECT -150 FROM DUAL) FROM DUAL", false, false, [[-150]]);
    runTest(db, "SELECT (SELECT 1.10 FROM DUAL) FROM DUAL", false, false, [[numericLoad("1.10")]]);
    runTest(db, "SELECT GREATEST((select 1 FROM dual), (select 2 from dual)) FROM dual", false, false, [[2]]);
    runTest(db, "SELECT GREATEST((select 1.10 FROM dual), (select 2.30 from dual)) FROM dual", false, false, [[numericLoad("2.30")]]);


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

    runTest(db, "CREATE TABLE db(db_id int identity(1,1), name varchar(50));", false, false, undefined);
    runTest(db, "CREATE TABLE wk(wk_id int identity(1,1), db_id int, conn int);", false, false, undefined);

    runTest(db, "INSERT INTO db(name) VALUES('db1'); INSERT INTO db(name) VALUES('db2'); INSERT INTO db(name) VALUES('db3');", false, false, undefined);
    runTest(db, "INSERT INTO wk(db_id, conn) VALUES(1, 10); INSERT INTO wk(db_id, conn) VALUES(1, 5); INSERT INTO wk(db_id, conn) VALUES(2, 55);", false, false, undefined);

    runTest(db, "SELECT db_id, name, (SELECT SUM(conn) FROM wk WHERE wk.db_id = db.db_id) as conn FROM db", false, false,
        [
            [1, 'db1', 15],
            [2, 'db2', 55],
            [3, 'db3', undefined]
        ], undefined, {printDebug: false});

    runTest(db, "SELECT db_id, name, IsNull((SELECT SUM(conn) FROM wk WHERE wk.db_id = db.db_id), 0) as conn FROM db", false, false,
        [
            [1, 'db1', 15],
            [2, 'db2', 55],
            [3, 'db3', 0]
        ]);


    runTest(db, "DROP TABLE wk; DROP TABLE db;", false, false, undefined);


    checkNoTempTables(db);

    next();

}