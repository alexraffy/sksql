
import {SKSQL, SQLStatement, TSQLResult, readFirst, kBlockHeaderField,
    readNext, addRow, cursorEOF, ITableData, ITable, ITableDefinition, TableColumn,rowHeaderSize, writeValue,
    readTableDefinition, TExecutionContext, createNewContext} from "sksql";
import {checkNoTempTables, runTest} from "./runTest";
import {performance} from "perf_hooks";



function insertRawTest(db: SKSQL, blockSize: number, loop: number, entries: number) {
    let context: TExecutionContext = createNewContext("", "", undefined);
    let insertTests1: number[] = [];
    for (let i = 0; i < loop; i++) {
        runTest(db, "DROP TABLE t1; CREATE TABLE t1(a int);", false, false, undefined);
        let t1 = db.getTable("t1");
        let t1Def = readTableDefinition(t1.data, false);
        let aCol = t1Def.columns[0];

        let start = performance.now();
        for (let x = 0; x < entries; x++) {
            let row = addRow(t1.data, blockSize, context);
            writeValue(t1, t1Def, aCol, row, x, rowHeaderSize);
        }
        let end = performance.now();
        let millis = end - start;
        insertTests1.push(millis);
    }
    let avg = 0;
    let high = -1;
    let low = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < insertTests1.length; i++) {
        avg += insertTests1[i];
        if (insertTests1[i] < low) {
            low = insertTests1[i];
        }
        if (insertTests1[i] > high) {
            high = insertTests1[i];
        }
    }
    avg = (1.0 * avg) / insertTests1.length;
    console.log(`${entries} RAW INSERTS, BLOCK: ${blockSize}, SAMPLE: ${loop}, AVG: ${avg.toFixed(2)}MS, HIGH: ${high.toFixed(2)}MS, LOW: ${low.toFixed(2)}MS`);
}

function insertTest(db: SKSQL, blockSize: number, loop: number, entries: number) {
    let insertTests1: number[] = [];
    runTest(db, "DROP TABLE t1; CREATE TABLE t1(a int);", false, false, undefined);
    let t1 = db.getTable("t1");
    let t1Def = readTableDefinition(t1.data, false);
    let aCol = t1Def.columns[0];

    for (let i = 0; i < loop; i++) {

        let start = performance.now();
        let st = new SQLStatement(db, "INSERT INTO t1 VALUES(@a);");
            st.setParameter("@a", i);
            st.run();
            st.close();

        let end = performance.now();
        let millis = end - start;
        insertTests1.push(millis);
    }
    let avg = 0;
    let high = -1;
    let low = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < insertTests1.length; i++) {
        avg += insertTests1[i];
        if (insertTests1[i] < low) {
            low = insertTests1[i];
        }
        if (insertTests1[i] > high) {
            high = insertTests1[i];
        }
    }
    avg = (1.0 * avg) / insertTests1.length;
    console.log(`STATEMENT INSERTS, BLOCK: ${blockSize}, SAMPLE: ${loop}, AVG: ${avg.toFixed(2)}MS, HIGH: ${high.toFixed(2)}MS, LOW: ${low.toFixed(2)}MS`);
}

function insertPreparedTest(db: SKSQL, blockSize: number, loop: number, entries: number) {
    let insertTests1: number[] = [];
    runTest(db, "DROP TABLE t1; CREATE TABLE t1(a int);", false, false, undefined);
    let t1 = db.getTable("t1");
    let t1Def = readTableDefinition(t1.data, false);
    let aCol = t1Def.columns[0];
    let st = new SQLStatement(db, "INSERT INTO t1 VALUES(@a);");

    for (let i = 0; i < loop; i++) {
        let start = performance.now();
        st.setParameter("@a", i);
        st.run();
        let end = performance.now();
        let millis = end - start;
        insertTests1.push(millis);
    }
    st.close();
    let avg = 0;
    let high = -1;
    let low = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < insertTests1.length; i++) {
        avg += insertTests1[i];
        if (insertTests1[i] < low) {
            low = insertTests1[i];
        }
        if (insertTests1[i] > high) {
            high = insertTests1[i];
        }
    }
    avg = (1.0 * avg) / insertTests1.length;
    console.log(`PREPARED STATEMENT INSERTS, BLOCK: ${blockSize}, SAMPLE: ${loop}, AVG: ${avg.toFixed(2)}MS, HIGH: ${high.toFixed(2)}MS, LOW: ${low.toFixed(2)}MS`);
}

function insertTSQLLoopTest(db: SKSQL, blockSize: number, loop: number, entries: number) {
    let insertTests1: number[] = [];
    runTest(db, "DROP TABLE t1; CREATE TABLE t1(a int);", false, false, undefined);
    let t1 = db.getTable("t1");
    let t1Def = readTableDefinition(t1.data, false);
    let aCol = t1Def.columns[0];

    for (let i = 0; i < loop; i++) {

        let start = performance.now();
        let st = new SQLStatement(db, "DECLARE @loop INT = 0; WHILE @loop < " + entries + " BEGIN SET @loop = @loop + 1; INSERT INTO t1 VALUES(@loop); END;");
        st.run();
        st.close();
        let end = performance.now();
        let millis = end - start;
        insertTests1.push(millis);
    }

    let avg = 0;
    let high = -1;
    let low = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < insertTests1.length; i++) {
        avg += insertTests1[i];
        if (insertTests1[i] < low) {
            low = insertTests1[i];
        }
        if (insertTests1[i] > high) {
            high = insertTests1[i];
        }
    }
    avg = (1.0 * avg) / insertTests1.length;
    console.log(`T-SQL LOOP ${entries} INSERTS, BLOCK: ${blockSize}, SAMPLE: ${loop}, AVG: ${avg.toFixed(2)}MS, HIGH: ${high.toFixed(2)}MS, LOW: ${low.toFixed(2)}MS`);
}

function scanTest(db: SKSQL, blockSize: number, sample: number, entries: number) {
    let context = createNewContext("", "", undefined);
    runTest(db, "DROP TABLE t1; CREATE TABLE t1(a int);", false, false, undefined);
    let t1 = db.getTable("t1");
    let t1Def = readTableDefinition(t1.data, false);
    let aCol = t1Def.columns[0];
    for (let x = 0; x < entries; x++) {
        let row = addRow(t1.data, blockSize, context);
        writeValue(t1, t1Def, aCol, row, x, rowHeaderSize);
    }

    let scanTests1: number[] = [];
    for (let i = 0; i < sample; i++) {
        let start = performance.now();
        let cursor = readFirst(t1, t1Def);
        while (!cursorEOF(cursor)) {
            let b = t1.data.blocks[cursor.blockIndex];
            let dv = new DataView(b, cursor.offset, cursor.rowLength + rowHeaderSize);
            let flag = dv.getUint8(kBlockHeaderField.DataRowFlag);
            const isDeleted = ((flag & kBlockHeaderField.DataRowFlag_BitDeleted) === kBlockHeaderField.DataRowFlag_BitDeleted) ? 1 : 0;
            if (isDeleted) {
                cursor = readNext(t1, t1Def, cursor);
                continue;
            }
            cursor = readNext(t1, t1Def, cursor);
        }
        let end = performance.now();
        let millis = end - start;
        scanTests1.push(millis);
    }
    let avg = 0;
    let high = -1;
    let low = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < scanTests1.length; i++) {
        avg += scanTests1[i];
        if (scanTests1[i] < low) {
            low = scanTests1[i];
        }
        if (scanTests1[i] > high) {
            high = scanTests1[i];
        }
    }
    avg = (1.0 * avg) / scanTests1.length;
    console.log(`RAW SCAN ${entries} ROWS, BLOCK: ${blockSize}, SAMPLE: ${sample}, AVG: ${avg.toFixed(2)}MS, HIGH: ${high.toFixed(2)}MS, LOW: ${low.toFixed(2)}MS`);
}

function selectTest(db: SKSQL, blockSize: number, sample: number, entries: number) {
    let context = createNewContext("", "", undefined);
    runTest(db, "DROP TABLE t1; CREATE TABLE t1(a int);", false, false, undefined);
    let t1 = db.getTable("t1");
    let t1Def = readTableDefinition(t1.data, false);
    let aCol = t1Def.columns[0];
    for (let x = 0; x < entries; x++) {
        let row = addRow(t1.data, blockSize, context);
        writeValue(t1, t1Def, aCol, row, x, rowHeaderSize);
    }

    let scanTests1: number[] = [];
    for (let i = 0; i < sample; i++) {
        let start = performance.now();
        let st = new SQLStatement(db, "SELECT * FROM t1;");
        st.run();
        st.close();
        let end = performance.now();
        let millis = end - start;
        scanTests1.push(millis);
    }
    let avg = 0;
    let high = -1;
    let low = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < scanTests1.length; i++) {
        avg += scanTests1[i];
        if (scanTests1[i] < low) {
            low = scanTests1[i];
        }
        if (scanTests1[i] > high) {
            high = scanTests1[i];
        }
    }
    avg = (1.0 * avg) / scanTests1.length;
    console.log(`SELECT ${entries} ROWS, BLOCK: ${blockSize}, SAMPLE: ${sample}, AVG: ${avg.toFixed(2)}MS, HIGH: ${high.toFixed(2)}MS, LOW: ${low.toFixed(2)}MS`);
}


export function perf1(db: SKSQL, next:()=>void) {
    console.log("TESTING PERFS...");
    let loop = 10;
    const blockSize = 4096;

    scanTest(db, blockSize, 100, 5000);
    scanTest(db, blockSize, 100, 10000);
    scanTest(db, blockSize, 100, 100000);

    selectTest(db, blockSize, 100, 5000);
    selectTest(db, blockSize, 100, 10000);
    selectTest(db, blockSize, 100, 100000);

    insertRawTest(db, blockSize, loop, 5000);
    insertRawTest(db, blockSize, loop, 10000);
    insertRawTest(db, blockSize, loop, 100000);

    insertTest(db, blockSize, 100, 0);

    insertPreparedTest(db, blockSize, 100, 0);

    insertTSQLLoopTest(db, blockSize, 10, 5000);
    insertTSQLLoopTest(db, blockSize, 10, 10000);
    insertTSQLLoopTest(db, blockSize, 10, 100000);

    checkNoTempTables(db);
    next();

}