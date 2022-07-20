



import {SQLStatement, dumpTable, TSQLResult, SKSQL, readTableDefinition} from "sksql";
import {checkNoTempTables, runTest} from "./runTest";

// REF: https://stackoverflow.com/questions/4915462/how-should-i-do-floating-point-comparison
export function nearlyEqual(a: number, b: number): boolean {
    const epsilon = 0.0000001;
    let absA = Math.abs(a);
    let absB = Math.abs(b);
    let diff = Math.abs(a - b);

    if (a == b) { // shortcut, handles infinities
        return true;
    } else if (a == 0 || b == 0 || diff < Number.MIN_VALUE) {
        // a or b is zero or both are extremely close to it
        // relative error is less meaningful here
        return diff < (epsilon * Number.MIN_VALUE);
    } else { // use relative error
        return diff / (absA + absB) < epsilon;
    }
}


export function float1(db: SKSQL, next:()=>void) {
    console.log("TESTING FLOAT...");

    runTest(db, "DROP TABLE t1; CREATE TABLE t1(a FLOAT); INSERT INTO t1 VALUES(1.3);", false, false, undefined);
    let t1 = db.getTable("T1");
    let def = readTableDefinition(t1.data, true);

    //console.log(dumpTable(db.getTable("T1")));
    runTest(db, "SELECT a FROM t1", false, false, [[(a) => { return nearlyEqual(a, 1.3); }]], undefined, {printDebug: false});
    runTest(db, "SELECT a + 1.0 FROM t1", false, false, [[(a) => { return nearlyEqual(a, 2.3);}]], undefined, {printDebug: false});
    runTest(db, "SELECT a - 1.0 FROM t1", false, false,[[(a) => { return nearlyEqual(a, 0.3);}]], undefined, {printDebug: false} );
    runTest(db, "SELECT a - 2.3 FROM t1", false, false,[[(a) => { return nearlyEqual(a, -1);}]], undefined, {printDebug: false});
    runTest(db, "SELECT a * 1.5 FROM t1", false, false, [[(a) => { return nearlyEqual(a, 1.95);}]], undefined, {printDebug: false});
    runTest(db, "SELECT a / 1.3 FROM t1", false, false, [[(a) => { return nearlyEqual(a, 1.00);}]], undefined, {printDebug: false});
    runTest(db, "SELECT a + 1.0 * 2.0 FROM t1", false, false, [[(a) => { return nearlyEqual(a, 3.3);}]], undefined, {printDebug: false});

    runTest(db, "DECLARE @v FLOAT = 1.32; SELECT @v from dual;", false, false, [[(a) => { return nearlyEqual(a,1.32); }]], undefined, {printDebug: false});
    runTest(db, "DECLARE @v FLOAT = 1.2332; SELECT ROUND(@v, 2) FROM DUAL", false, false, [[(a) => { return nearlyEqual(a, 1.23); }]], undefined, {printDebug: false});
    runTest(db, "SELECT ABS(CAST(-1.23 AS FLOAT)) FROM dual", false, false, [[(a) => { return nearlyEqual(a, 1.23);}]], undefined, {printDebug: false});
    checkNoTempTables(db);
    next();
}