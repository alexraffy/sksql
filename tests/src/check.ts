


import {SQLStatement, dumpTable, SQLResult, SKSQL, numericLoad, serializeTableDefinition} from "sksql";
import {runTest} from "./runTest";


export function check(db: SKSQL, next:()=>void) {
    console.log("TESTING COLUMNS CONSTRAINTS...");

    runTest(db, "DROP TABLE t1; CREATE TABLE t1( a INT NOT NULL IDENTITY(1,1), b INT NULL);", false, false, undefined);
    runTest(db, "INSERT INTO t1(a) VALUES(NULL);", true, true, undefined);
    runTest(db, "INSERT INTO t1(b) VALUES(NULL); SELECT * FROM t1;", false, false, [[1, undefined]]);
    runTest(db, "DROP TABLE t1; CREATE TABLE t1( a INT NULL IDENTITY(1,1), b INT NULL);", false, false, undefined);
    runTest(db, "INSERT INTO t1(a) VALUES(NULL); SELECT * from t1;", false, false, undefined, [[undefined, undefined]]);
    runTest(db, "DROP TABLE t1; CREATE TABLE t1( a INT IDENTITY(1,1) NOT NULL, b INT NULL);", false, false, undefined);
    runTest(db, "INSERT INTO t1(a) VALUES(NULL);", true, true, undefined);
    runTest(db, "DROP TABLE t1; CREATE TABLE t1( a INT IDENTITY(1,1) NULL, b INT NULL);", false, false, undefined);
    runTest(db, "INSERT INTO t1(a) VALUES(NULL); SELECT * FROM t1;", false, false, [[undefined, undefined]]);

    let sql = "DROP TABLE t1; CREATE TABLE t1(\n" +
        "      x INTEGER CHECK( x<5 ),\n" +
        "      y NUMERIC(12,2) CHECK( y>x )\n" +
        "    );"
    runTest(db, sql, false, false, undefined);

    let tableDefinition = serializeTableDefinition(db, "t1");

    runTest(db, "INSERT INTO t1 VALUES(3,4);\n" +
        "    SELECT * FROM t1;", false, false, [[3, numericLoad("4.0")]]);
    runTest(db, "INSERT INTO t1 VALUES(6,7);", true, true, undefined);
    runTest(db, "SELECT * FROM t1", false, false, [[3, numericLoad("4")]]);
    runTest(db, "INSERT INTO t1 VALUES(4,3)", true, true, undefined);
    runTest(db, "SELECT * FROM t1", false, false, [[3, numericLoad("4")]]);
    runTest(db, "INSERT INTO t1 VALUES(NULL,6)", false, false, undefined);
    runTest(db, "SELECT * FROM t1", false, false, [[3, numericLoad("4")], [undefined, numericLoad("6.0")]]);
    runTest(db, "INSERT INTO t1 VALUES(2,NULL)", false, false, undefined);
    runTest(db, "SELECT * FROM t1", false, false, [[3, numericLoad("4")], [undefined, numericLoad("6.0")], [2, undefined]]);
    runTest(db, "DELETE FROM t1 WHERE x IS NULL OR x!=3;\n" +
        "    UPDATE t1 SET x=2 WHERE x=3;\n" +
        "    SELECT * FROM t1", false, false, [[2, numericLoad("4.0")]]);
    runTest(db, "UPDATE t1 SET x=7 WHERE x=2", true, true, undefined);
    runTest(db, "SELECT * FROM t1", false, false, [[2, numericLoad("4.0")]]);
    runTest(db, "UPDATE t1 SET x=5 WHERE x=2", true, true, undefined);
    runTest(db, "SELECT * FROM t1", false, false, [[2, numericLoad("4.0")]]);
    runTest(db, "UPDATE t1 SET x=4, y=11 WHERE x=2", false, false, undefined);
    runTest(db, "SELECT * FROM t1", false, false, [[4, numericLoad("11.0")]]);

    next();

}