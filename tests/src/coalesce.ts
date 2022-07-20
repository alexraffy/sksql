


import {SQLStatement, dumpTable, TSQLResult, SKSQL, numericLoad} from "sksql";
import {checkNoTempTables, runTest} from "./runTest";


export function coalesce(db: SKSQL, next:()=>void) {
    console.log("TESTING COALESCE/ISNULL...");

    let init = "DROP TABLE t1; CREATE TABLE t1(a INTEGER , b INTEGER, c INTEGER, d INTEGER);\n" +
        "    INSERT INTO t1 VALUES(1, null, null, null);\n" +
        "    INSERT INTO t1 VALUES(2, 2, 99, 99);\n" +
        "    INSERT INTO t1 VALUES(3, null, 3, 99);\n" +
        "    INSERT INTO t1 VALUES(4, null, null, 4);\n" +
        "    INSERT INTO t1 VALUES(5, null, null, null);\n" +
        "    INSERT INTO t1 VALUES(6, 22, 99, 99);\n" +
        "    INSERT INTO t1 VALUES(7, null, 33, 99);\n" +
        "    INSERT INTO t1 VALUES(8, null, null, 44);\n" +
        "\n" +
        "    SELECT coalesce(b,c,d) FROM t1 ORDER BY a;"
    runTest(db, init, false, false, [[undefined], [2], [3], [4], [undefined], [22], [33], [44]] )
    runTest(db, "SELECT coalesce(d+c+b,d+c,d) FROM t1 ORDER BY a", false, false, [[undefined], [200], [102], [4], [undefined], [220], [132], [44]]);
    runTest(db, "SELECT isnull(d+c+b,isnull(d+c,d)) FROM t1 ORDER BY a", false, false, [[undefined], [200], [102], [4], [undefined], [220], [132], [44]]);
    runTest(db, "SELECT isnull(isnull(d+c+b,d+c),d) FROM t1 ORDER BY a", false, false, [[undefined], [200], [102], [4], [undefined], [220], [132], [44]]);
    runTest(db, "SELECT isnull(isnull(b,c),d) FROM t1 ORDER BY a", false, false, [[undefined], [2], [3], [4], [undefined], [22], [33], [44]]);
    runTest(db, "SELECT isnull(b,isnull(c,d)) FROM t1 ORDER BY a", false, false, [[undefined], [2], [3], [4], [undefined], [22], [33], [44]]);

    checkNoTempTables(db);

    next();

}