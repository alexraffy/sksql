import {SQLStatement, dumpTable, TSQLResult, SKSQL, numericLoad} from "sksql";
import {checkNoTempTables, runTest} from "./runTest";
import * as assert from "assert";


function test_command_W(db: SKSQL, command: string, clean: string, commandName: string) {

    let st1 = new SQLStatement(db, command, false);
    let rt1 = st1.runSync();
    st1.close();
    assert(rt1.error === undefined, commandName + " WITH ACCESS RIGHT UNDEFINED SHOULD NOT FAIL.");
    let st2 = new SQLStatement(db, clean, false);
    st2.runSync();
    st2.close();
    let st3 = new SQLStatement(db, command, false, "R")
    let rt3 = st3.runSync();
    st3.close();
    assert(rt3.error !== undefined, commandName + " WITH ACCESS RIGHT R SHOULD FAIL.");

    let st4 = new SQLStatement(db, command, false, "W")
    let rt4 = st4.runSync();
    st4.close();
    assert(rt4.error === undefined, commandName + " WITH ACCESS RIGHT W SHOULD NOT FAIL.");
    let _ = new SQLStatement(db, clean, false);
    _.runSync();
    _.close();
    let st5 = new SQLStatement(db, command, false, "RW")
    let rt5 = st5.runSync();
    st5.close();
    assert(rt5.error === undefined, commandName + " WITH ACCESS RIGHT RW SHOULD NOT FAIL.");
    let _2 = new SQLStatement(db, clean, false);
    _2.runSync();
    _2.close();
    let st6 = new SQLStatement(db, command, false, "N")
    let rt6 = st6.runSync();
    assert(rt6.error !== undefined, commandName + " WITH ACCESS RIGHT N SHOULD FAIL.");
    st6.close();

}


function test_command_R(db: SKSQL, command: string, clean: string, commandName: string) {

    let st1 = new SQLStatement(db, command, false);
    let rt1 = st1.runSync();
    st1.close();
    assert(rt1.error === undefined, commandName + " WITH ACCESS RIGHT UNDEFINED SHOULD NOT FAIL.");
    let st2 = new SQLStatement(db, clean, false);
    st2.runSync();
    st2.close();
    let st3 = new SQLStatement(db, command, false, "R")
    let rt3 = st3.runSync();
    st3.close();
    assert(rt3.error === undefined, commandName + " WITH ACCESS RIGHT R SHOULD NOT FAIL.");

    let st4 = new SQLStatement(db, command, false, "W")
    let rt4 = st4.runSync();
    st4.close();
    assert(rt4.error !== undefined, commandName + " WITH ACCESS RIGHT W SHOULD FAIL.");
    let _ = new SQLStatement(db, clean, false);
    _.runSync();
    _.close();
    let st5 = new SQLStatement(db, command, false, "RW")
    let rt5 = st5.runSync();
    st5.close();
    assert(rt5.error === undefined, commandName + " WITH ACCESS RIGHT RW SHOULD NOT FAIL.");
    let _2 = new SQLStatement(db, clean, false);
    _2.runSync();
    _2.close();
    let st6 = new SQLStatement(db, command, false, "N")
    let rt6 = st6.runSync();
    st6.close();
    assert(rt6.error !== undefined, commandName + " WITH ACCESS RIGHT N SHOULD FAIL.");


}




export function access(db: SKSQL, next: ()=> void) {
    console.log("TESTING ACCESS RIGHTS...");

    test_command_W(db, "CREATE FUNCTION fn_test1() RETURNS VARCHAR(255) AS BEGIN RETURN 'Hello'; END;",
        "DROP FUNCTION fn_test1;", "CREATE FUNCTION");
    test_command_W(db, "CREATE PROCEDURE usp_test1 AS BEGIN SELECT 'Hello' FROM DUAL; END;",
            "DROP PROCEDURE usp_test1;", "CREATE PROCEDURE");
    test_command_W(db, "DROP FUNCTION fn_test1;",
        "CREATE FUNCTION fn_test1() RETURNS VARCHAR(255) AS BEGIN RETURN 'Hello'; END;", "DROP FUNCTION");
    test_command_W(db, "DROP PROCEDURE usp_test1;",
        "CREATE PROCEDURE usp_test1 AS BEGIN SELECT 'Hello' FROM DUAL; END;", "DROP PROCEDURE");

    runTest(db, "DROP TABLE test1;", false, false, undefined);
    test_command_W(db, "CREATE TABLE test1 ( a uint32 );",
        "DROP TABLE test1;", "CREATE TABLE");

    let stTable = new SQLStatement(db, "CREATE TABLE test1( a uint32);");
    stTable.runSync();
    stTable.close();
    test_command_W(db, "INSERT INTO test1(a) VALUES (1);", "DELETE FROM test1;", "INSERT");
    let stInsert = new SQLStatement(db, "INSERT INTO test(a) VALUES (10);");
    test_command_W(db, "UPDATE test1 SET a = 100 WHERE a = 10;", "UPDATE test1 SET a = 100;", "UPDATE");
    test_command_W(db, "DELETE FROM test1", "INSERT INTO test(a) VALUES (10);", "DELETE");
    test_command_W(db, "DROP TABLE test1", "CREATE TABLE test1( a uint32);", "DELETE");

    test_command_R(db, "SELECT * FROM DUAL", "SELECT 1 FROM Dual", "SELECT");

    let insertselect = "INSERT INTO test1(a) SELECT 1 FROM dual";
    let s1 = new SQLStatement(db, insertselect, false, "R");
    let r1 = s1.runSync();
    s1.close();
    assert(r1.error !== undefined, "INSERT INTO ... SELECT SHOULD FAIL WITH ACCESS RIGHT R");
    let s2 = new SQLStatement(db, insertselect, false, "RW");
    let r2 = s2.runSync();
    s2.close();
    assert(r2.error === undefined, "INSERT INTO ... SELECT SHOULD NOT FAIL WITH ACCESS RIGHT RW");
    let s3 = new SQLStatement(db, insertselect, false, "W");
    let r3 = s3.runSync();
    s3.close();
    assert(r3.error !== undefined, "INSERT INTO ... SELECT SHOULD FAIL WITH ACCESS RIGHT W");
    let s4 = new SQLStatement(db, insertselect, false, "N");
    let r4 = s4.runSync();
    s4.close();
    assert(r4.error !== undefined, "INSERT INTO ... SELECT SHOULD FAIL WITH ACCESS RIGHT N");

    let usp = "CREATE PROCEDURE usp_test_1 AS BEGIN INSERT INTO test1(a) VALUES (120); END;";
    let createProc = new SQLStatement(db, usp);
    createProc.runSync();
    createProc.close();
    test_command_W(db, "EXEC usp_test_1;", "SELECT 1 FROM DUAL", "EXEC WITH INSERT");

    let usp2 = "CREATE PROCEDURE usp_test_2 AS BEGIN SELECT 'Hello' FROM DUAL; END;";
    let createProc2 = new SQLStatement(db, usp2);
    createProc2.runSync();
    createProc2.close();
    test_command_R(db, "EXEC usp_test_2;", "SELECT 1 FROM DUAL", "EXEC WITH SELECT");



    checkNoTempTables(db);

    next();
}