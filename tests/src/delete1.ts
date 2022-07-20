


import {SQLStatement, dumpTable, TSQLResult, SKSQL, numericLoad} from "sksql";
import {checkNoTempTables, runTest} from "./runTest";


export function delete1(db: SKSQL, next:()=>void) {
    console.log("TESTING DELETE STATEMENTS...");

    runTest(db, "DROP TABLE test1", false, false, undefined);
    runTest(db, "DELETE FROM test1", true, true, undefined);

    let sql = "CREATE TABLE table1(f1 int, f2 int);\n" +
        "  INSERT INTO table1 VALUES(1,2);\n" +
        "  INSERT INTO table1 VALUES(2,4);\n" +
        "  INSERT INTO table1 VALUES(3,8);\n" +
        "  INSERT INTO table1 VALUES(4,16);\n" +
        "  SELECT * FROM table1 ORDER BY f1;";
    runTest(db, sql, false, false, [[1, 2], [2, 4], [3, 8], [4, 16]]);
    runTest(db, "DELETE FROM table1 WHERE f1=3", false, false, undefined);
    runTest(db, "SELECT * FROM table1 ORDER BY f1", false, false, [[1, 2], [2, 4], [4, 16]]);
    runTest(db, "DELETE FROM table1 WHERE f1=3", false, false, undefined);
    runTest(db, "SELECT * FROM table1 ORDER BY f1", false, false, [[1, 2], [2, 4], [4, 16]]);
    runTest(db, "DELETE FROM table1 WHERE f1=2", false, false, undefined);
    runTest(db, "SELECT * FROM table1 ORDER BY f1", false, false, [[1, 2], [4, 16]]);

    runTest(db, "DROP TABLE table2; CREATE TABLE table2(f1 int, f2 int)", false, false, undefined);
    runTest(db, "DELETE FROM table2 WHERE f3=5", true, true, undefined);
    runTest(db, "DELETE FROM table2 WHERE xyzzy(f1+4)", true, true, undefined);
    runTest(db, "DELETE FROM table1", false, false, undefined);
    runTest(db, "SELECT count(*) FROM table1", false, false, [[0]]);

    runTest(db, "DECLARE @i INT = 1;\n" +
        "WHILE @i <= 200\n" +
        "BEGIN\n" +
        "   INSERT INTO table1 VALUES(@i,@i*@i);\n" +
        "   SET @i = @i + 1;\n" +
        "END\n", false, false, undefined);
    //console.log(dumpTable(db.getTable("table1")));
    runTest(db, "SELECT count(*) FROM table1", false, false, [[200]]);
    runTest(db, "DELETE FROM table1", false, false, undefined);
    runTest(db, "SELECT COUNT(1) FROM table1", false, false, [[0]]);
    runTest(db, "DECLARE @i INT = 1;\n" +
        "WHILE @i <= 200\n" +
        "BEGIN\n" +
        "   INSERT INTO table1 VALUES(@i,@i*@i);\n" +
        "   SET @i = @i + 1;\n" +
        "END\n" +
        "SELECT count(*) FROM table1", false, false, [[200]]);
    runTest(db, "DECLARE @i INT = 1;\n" +
        "WHILE @i <= 200\n" +
        "BEGIN\n" +
        "   DELETE FROM table1 WHERE f1 = @i;\n" +
        "   SET @i = @i + 4;\n" +
        "END\n" +
        "SELECT count(*) FROM table1", false, false, [[150]]);
    runTest(db, "DELETE FROM table1 WHERE f1>50", false, false, undefined);
    runTest(db, "SELECT count(*) FROM table1 WHERE f1>50", false, false, [[0]]);
    runTest(db, "SELECT count(*) FROM table1", false, false, [[37]]);
    runTest(db, "DECLARE @i INT = 1;\n" +
        "WHILE @i <= 70\n" +
        "BEGIN\n" +
        "   DELETE FROM table1 WHERE f1 = @i;\n" +
        "   SET @i = @i + 3;\n" +
        "END\n" +
        "SELECT f1 FROM table1 ORDER BY f1", false, false, [
        [2], [3], [6], [8], [11], [12], [14], [15], [18], [20], [23], [24], [26], [27], [30], [32], [35], [36], [38], [39], [42], [44], [47], [48], [50]]);
    runTest(db, "DECLARE @i INT = 1;\n" +
        "WHILE @i < 40\n" +
        "BEGIN\n" +
        "   DELETE FROM table1 WHERE f1 = @i;\n" +
        "   SET @i = @i + 1;\n" +
        "END\n" +
        "SELECT f1 FROM table1 ORDER BY f1", false, false, [
        [42], [44], [47], [48], [50]]);
    runTest(db, "DELETE FROM table1 WHERE f1!=48\n" +
        "SELECT f1 FROM table1 ORDER BY f1", false, false, [[48]]);
    runTest(db, "DROP TABLE t3; CREATE TABLE t3(a INT);\n" +
        "    INSERT INTO t3 VALUES(1);\n" +
        "    INSERT INTO t3 SELECT a+1 FROM t3;\n" +
        "    INSERT INTO t3 SELECT a+2 FROM t3;\n" +
        "    SELECT * FROM t3;", false, false, [[1], [2], [3], [4]]);

    checkNoTempTables(db);

    next();

}