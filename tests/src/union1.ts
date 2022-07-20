

import {SKSQL, dumpTable, TSQLResult, numericCmp, isNumeric,
    numericLoad, readFirst, cursorEOF, recordSize, rowHeaderSize, readValue,
    readNext} from "sksql";
import {checkNoTempTables, runTest} from "./runTest";

export function union1 (db: SKSQL, next: ()=> void) {
    console.log("TESTING UNION...");

    runTest(db, "SELECT 'Hello' FROM DUAL UNION ALL SELECT 'World' FROM DUAL", false, false, [["Hello"], ["World"]]);
    runTest(db, "SELECT 'Bien' FROM DUAL UNION ALL SELECT 'le' FROM DUAL UNION ALL SELECT 'Bonjour' FROM DUAL", false, false, [["Bien"], ["le"], ["Bonjour"]]);
    runTest(db, "SELECT 'Mismatch' FROM dual UNION ALL SELECT 10 FROM dual", true, true, undefined);
    runTest(db, "SELECT 'Mismatch' FROM dual UNION ALL SELECT 10.24 FROM dual", true, true, undefined);
    runTest(db, "SELECT 'Mismatch' FROM dual UNION ALL SELECT true FROM dual", true, true, undefined);

    runTest(db, "DROP TABLE t1;", false, false, undefined);
    runTest(db, "CREATE TABLE t1( a INT32, b VARCHAR(50), c BOOLEAN, d NUMERIC(8,2));", false, false, undefined);
    runTest(db, "INSERT INTO t1 VALUES(10, 'AAABBBCCC', TRUE, 1.5);", false, false, undefined);
    runTest(db, "INSERT INTO t1 VALUES(20, 'DDDEEEFFF', False, 0.23);", false, false, undefined);
    runTest(db, "INSERT INTO t1 VALUES(30, 'GGGHHHIII', False, 912.5);", false, false, undefined);
    runTest(db, "INSERT INTO t1 VALUES(40, 'JJJKKKLLL', False, 18.20);", false, false, undefined);
    runTest(db, "INSERT INTO t1 VALUES(50, 'MMMNNNOOO', True, 8.15);", false, false, undefined);

    runTest(db, "SELECT a, b, c, d FROM t1 WHERE a < 30 UNION ALL SELECT a, b, c, d FROM t1 WHERE d > 100.0", false, false, [
        [10, 'AAABBBCCC', true, numericLoad("1.5")],
        [20, 'DDDEEEFFF', false, numericLoad("0.23")],
        [30, 'GGGHHHIII', false, numericLoad("912.5")]
    ]);

    runTest(db, "SELECT a, b, c, d FROM t1 WHERE a < 30 ORDER BY d ASC UNION ALL SELECT a, b, c, d FROM t1 WHERE d > 100.0", false, false, [
        [20, 'DDDEEEFFF', false, numericLoad("0.23")],
        [10, 'AAABBBCCC', true, numericLoad("1.5")],
        [30, 'GGGHHHIII', false, numericLoad("912.5")]
    ]);

    runTest(db, "SELECT c, SUM(d) FROM t1 WHERE c = true GROUP BY c", false, false, [[true, numericLoad("9.65")]]);
    runTest(db, "SELECT c, sum(d) FROM t1 WHERE c = false GROUP BY C", false, false, [[false, numericLoad("930.93")]]);

    runTest(db, "SELECT c, SUM(d) FROM t1 WHERE c = true GROUP BY c UNION ALL SELECT c, sum(d) FROM t1 WHERE c = false GROUP BY C", false, false, [
        [true, numericLoad("9.65")],
        [false, numericLoad("930.93")]
    ]);

    runTest(db, "SELECT 'Hello' FROM DUAL UNION SELECT 'Hello' FROM DUAL UNION SELECT 'World' FROM DUAL", false, false, [
        ["Hello"],
        ["World"]
    ])

    runTest(db, "DROP TABLE t1", false, false, undefined);

    runTest(db, "CREATE TABLE t1 (a int, b VARCHAR(50))", false, false, undefined);
    runTest(db, "INSERT INTO t1 VALUES(10, 'John')", false, false, undefined);
    runTest(db, "INSERT INTO t1 VALUES(20, 'Adam')", false, false, undefined);
    runTest(db, "INSERT INTO t1 VALUES(30, 'Alex')", false, false, undefined);
    runTest(db, "INSERT INTO t1 VALUES(40, 'Sophie')", false, false, undefined);

    runTest(db, "SELECT a, b FROM t1 EXCEPT SELECT a, b FROM t1 WHERE a = 30", false, false, [
        [10, "John"],
        [20, "Adam"],
        [40, "Sophie"]
    ], undefined, {printDebug: false});
    runTest(db, "SELECT a, b FROM t1 UNION SELECT 60, 'Kern' FROM DUAL UNION SELECT 70, 'Billie' FROM DUAL UNION SELECT 20, 'Adam' FROM DUAL", false, false, [
        [10, "John"],
        [20, "Adam"],
        [30, "Alex"],
        [40, "Sophie"],
        [60, "Kern"],
        [70, "Billie"]
    ]);
    runTest(db, "SELECT a, b FROM t1 WHERE a < 30 INTERSECT SELECT a, b FROM t1 WHERE a >= 20", false, false, [
        [20, "Adam"]
    ], undefined, {printDebug: false});

    runTest(db, "DROP TABLE t1", false, false, undefined);

    checkNoTempTables(db);

    next();


}