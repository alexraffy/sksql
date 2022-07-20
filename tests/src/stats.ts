

import {SKSQL, SQLStatement, TSQLResult, numericCmp, isNumeric,
    numericLoad, readFirst, cursorEOF, vacuumTable, genStatsForTable, readValue,
    dumpTable} from "sksql";
import {checkNoTempTables, runTest} from "./runTest";


export function stats1(db: SKSQL, next:()=>void) {
    console.log("TESTING STATISTICS...")
    runTest(db, "DROP TABLE table1; CREATE TABLE table1(f1 int, f2 int);", false, false, undefined);
    runTest(db, "DECLARE @i INT = 1;\n" +
        "WHILE @i <= 200\n" +
        "BEGIN\n" +
        "   INSERT INTO table1 VALUES(@i,@i*@i);\n" +
        "   SET @i = @i + 1;\n" +
        "END\n", false, false, undefined);
    runTest(db, "SELECT count(*) FROM table1", false, false, [[200]]);
    genStatsForTable(db, "table1");

    runTest(db, "SELECT active_rows, dead_rows, header_size, total_size, largest_block_size FROM sys_table_statistics WHERE table = UPPER('table1')", false, false, [
        [200, 0, 65536, 655360, 655360]
    ], undefined, {printDebug: false});

    runTest(db, "DELETE FROM table1 WHERE f1 % 2 = 0", false, false, undefined);
    genStatsForTable(db, "table1");

    runTest(db, "SELECT active_rows, dead_rows, header_size, total_size, largest_block_size FROM sys_table_statistics WHERE table = UPPER('table1')", false, false, [
        [100, 100, 65536, 655360, 655360]
    ], undefined, {printDebug: false});
    vacuumTable(db, "table1", (tableName, cb: () => {

    }) => {

    });

    genStatsForTable(db, "table1");
    runTest(db, "SELECT active_rows, dead_rows, header_size, total_size, largest_block_size FROM sys_table_statistics WHERE table = UPPER('table1')", false, false, [
        [100, 0, 65536, 655360, 655360]
    ], undefined, {printDebug: false});


    runTest(db, "DROP TABLE table1;", false, false, undefined);
    genStatsForTable(db, "table1");
    runTest(db, "SELECT active_rows, dead_rows, header_size, total_size, largest_block_size FROM sys_table_statistics WHERE table = UPPER('table1')", false, false, undefined
    , undefined, {printDebug: false});


    checkNoTempTables(db);

    next();

}