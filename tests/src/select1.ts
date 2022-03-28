import {SKSQL, SQLStatement, SQLResult, numericCmp, isNumeric,
    numericLoad, readFirst, cursorEOF, recordSize, rowHeaderSize, readValue,
    readNext} from "sksql";
import {runTest} from "./runTest";







export function select1(db: SKSQL, next: () => void) {
    console.log("TESTING SELECT STATEMENTS...");
    runTest(db, "SELECT * FROM test1", true, true, undefined);
    runTest(db, "CREATE TABLE test1(f1 int, f2 int)", false, false, undefined);
    runTest(db, "SELECT * FROM test1, test2", true, true, undefined);
    runTest(db, "SELECT * FROM test2, test1", true, true, undefined);
    runTest(db, "INSERT INTO test1(f1,f2) VALUES(11,22)", false, false, undefined);
    runTest(db, "SELECT f1 FROM test1", false, false, [[11]]);
    runTest(db, "SELECT f2 FROM test1", false, false, [[22]]);
    runTest(db, "SELECT f2,f1 FROM test1", false, false, [[22, 11]]);
    runTest(db, "SELECT f1,f2 FROM test1", false, false, [[11, 22]]);
    runTest(db, "SELECT test1.f1, test1.f2 FROM test1", false, false, [[11, 22]]);
    runTest(db, "SELECT test1.f1 FROM test1 ORDER BY test1.f1", false, false, [[11]]);
    runTest(db, "SELECT * FROM test1", false, false, [[11, 22]]);
    runTest(db, "SELECT *, * FROM test1", false, false, [[11, 22, 11, 22]]);
    runTest(db, "SELECT *, least(f1,f2), greatest(f1,f2) FROM test1", false, false, [[11, 22, 11, 22]]);


    runTest(db, "SELECT 'one', *, 'two', * FROM test1", false, false, [['one', 11, 22, 'two', 11, 22]]);
    runTest(db, "CREATE TABLE test2(r1 numeric(12,2), r2 numeric(12,2))", false, false, undefined);
    runTest(db, "INSERT INTO test2(r1,r2) VALUES(1.1,2.2)", false, false, undefined);
    runTest(db, "SELECT * FROM test1, test2", false, false, [[11, 22, numericLoad("1.1"), numericLoad("2.2")]]);
    runTest(db, "SELECT *, 'hi' FROM test1, test2", false, false, [[11, 22, numericLoad("1.1"), numericLoad("2.2"), 'hi']]);
    runTest(db, "SELECT 'one', *, 'two', * FROM test1, test2", false, false,
        [['one', 11, 22, numericLoad("1.1"), numericLoad("2.2"), 'two',
            11, 22, numericLoad("1.1"), numericLoad("2.2")]]);
    runTest(db, "SELECT test1.f1, test2.r1 FROM test1, test2", false, false, [[11, numericLoad("1.1")]]);
    runTest(db, "SELECT test1.f1, test2.r1 FROM test2, test1", false, false, [[11, numericLoad("1.1")]]);
    runTest(db, "SELECT * FROM test2, test1", false, false, [[numericLoad("1.1"), numericLoad("2.2"), 11, 22]]);
    runTest(db, "SELECT * FROM test1 AS a, test1 AS b", false, false, [[11, 22, 11, 22]]);

    // AGGREGATES
    let reset = "DELETE FROM test1;\n" +
        "    INSERT INTO test1 VALUES(11,22);\n" +
        "    INSERT INTO test1 VALUES(33,44);";
    runTest(db, reset, false, false, undefined);
    runTest(db, "SELECT count(f1,f2) FROM test1", true, true, undefined);
    runTest(db, "SELECT count(f1) FROM test1", false, false, [[2]]);
    runTest(db, "SELECT Count() FROM test1", true, true, undefined);
    runTest(db, "SELECT COUNT(*) FROM test1", false, false, [[2]]);
    runTest(db, "SELECT COUNT(*)+1 FROM test1", false, false, [[3]]);

    let t3 = "CREATE TABLE t3(a INT, b INT);\n" +
        "INSERT INTO t3 VALUES(11, 22);\n" +
        "INSERT INTO t3 VALUES(33, 44);\n" +
        "INSERT INTO t3 VALUES(NULL, 55);\n" +
        "INSERT INTO t3 VALUES(66, NULL);";
    runTest(db, t3, false, false, undefined);
    runTest(db, "SELECT count(*),count(a),count(b) FROM t3", false, false, [[4, 3, 3]]);
    runTest(db, "SELECT count(*),count(a),count(b) FROM t3 WHERE b=55", false, false, [[1, 0, 1]]);
    runTest(db, "SELECT Min(f1) FROM test1", false, false, [[11]]);
    runTest(db, "SELECT Max(a) FROM t3", false, false, [[66]]);
    runTest(db, "SELECT MAX(a)+1 FROM t3", false, false, [[67]]);
    runTest(db, "SELECT SUM(a) FROM t3", false, false, [[110]]);
    runTest(db, "SELECT AVG(a) FROM t3", false, false, [[36]]);
    runTest(db, "SELECT MAX(t3.a) FROM t3", false, false, [[66]]);
    // MISSING FUNCTION
    runTest(db, "SELECT XYZZY(f1) FROM test1", true, true, undefined);
    // WRONG AGGREGATE
    runTest(db, "SELECT SUM(min(f1)) FROM test1", true, true, undefined);
    runTest(db, "SELECT min(f1) AS m FROM test1 GROUP BY f1 HAVING max(m+5)<10", true, true, undefined);
    // WHERE CLAUSE
    runTest(db, "SELECT f1 FROM test1 WHERE f1<11", false, false, []);
    runTest(db, "SELECT f1 FROM test1 WHERE f1<=11", false, false, [[11]]);
    runTest(db, "SELECT f1 FROM test1 WHERE f1=11", false, false, [[11]]);
    runTest(db, "SELECT f1 FROM test1 WHERE f1>=11", false, false, [[11],[33]]);
    runTest(db, "SELECT f1 FROM test1 WHERE f1>11", false, false, [[33]]);
    runTest(db, "SELECT f1 FROM test1 WHERE f1!=11", false, false, [[33]]);
    runTest(db, "SELECT f1 FROM test1 WHERE count(f1)!=11", true, true, undefined);
    runTest(db, "SELECT f1 FROM test1 ORDER BY f1", false, false, [[11],[33]])
    runTest(db, "SELECT f1 FROM test1 ORDER BY f1 DESC", false, false, [[33], [11]]);
    runTest(db, "SELECT f1 FROM test1 ORDER BY '8.4'", false, false, [[11], [33]]);
    runTest(db, "SELECT max(f1) FROM test1 ORDER BY f2", false, false, [[33]]);

    let test2 = "CREATE TABLE test2(t1 VARCHAR(3), t2 VARCHAR(3))\n" +
        "INSERT INTO test2 VALUES('abc','xyz')";
    runTest(db, test2, true, true, undefined);

    runTest(db, "SELECT f1 FROM test1 ORDER BY f2", false, false, [[11], [33]]);
    runTest(db, "SELECT f1 FROM test1 ORDER BY f2 DESC", false, false, [[33], [11]]);
    runTest(db, "SELECT DISTINCT * FROM test1 WHERE f1=11", false, false, [[11, 22]]);
    runTest(db, "SELECT f1 as xyzzy FROM test1 ORDER BY f2", false, false, undefined, { "xyzzy": 11});
    runTest(db, "SELECT f1+F2 as xyzzy FROM test1 ORDER BY f2", false, false, [[33], [77]], {"xyzzy": 33});
    runTest(db, "SELECT f1+F2 FROM test1 ORDER BY f2", false, false, [[33], [77]], {"f1+F2": 33});


    next();

}