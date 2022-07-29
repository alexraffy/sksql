import {SQLStatement, readTableAsJSON, SKSQL, TSQLResult, kResultType} from "sksql";
import * as assert from "assert";
import {checkNoTempTables} from "./runTest";


export function update1(db: SKSQL, next:()=>void) {
    console.log("TESTING UPDATE STATEMENTS...");

    {
        let sql = "CREATE TABLE test_update1(id INT32, value INT32);";
        let s = new SQLStatement(db, sql);
        let ret = s.runSync();
        assert(ret.error === undefined, "FAIL: " + sql);
        s.close();
    }
    {
        let sql = "INSERT INTO test_update1(id, value) VALUES(1, 1);"
        let s = new SQLStatement(db, sql);
        let ret = s.runSync();
        assert(ret.error === undefined, "FAIL: " + sql);
        s.close();
    }
    {
        let sql = "UPDATE SET value = 2 FROM test_update1;"
        let s = new SQLStatement(db, sql);
        let ret = s.runSync();
        assert(ret.error === undefined, "FAIL: " + sql);
        s.close();
    }
    {
        let sql = "SELECT value FROM test_update1 WHERE id = 1;";
        let s = new SQLStatement(db, sql);
        let ret = s.runSync();
        assert(ret.error === undefined, "FAIL: " + sql);
        let rj = ret.getRows();
        assert(rj.length > 0 && rj[0]["value"] === 2, "FAIL: " + sql);
        s.close();
    }
    {
        let sql = "DECLARE @loop INT32 = 2; WHILE @loop < 1000 BEGIN INSERT INTO test_update1(id, value) VALUES(@loop, @loop); SET @loop = @loop + 1; END";
        let s = new SQLStatement(db, sql);
        let ret = s.runSync();
        assert(ret.error === undefined, "FAIL: " + sql);
        let rj = readTableAsJSON(db, "test_update1");
        assert(rj.length > 0 && rj[998]["value"] === 999, "FAIL: "  + sql);
        s.close();
    }
    {
        let sql = "UPDATE SET value = id + 10000 FROM test_update1;";
        let s = new SQLStatement(db, sql);
        let ret = s.runSync();
        assert(ret.error === undefined, "FAIL: " + sql);
        s.close();
    }
    {
        let sql = "SELECT value FROM test_update1 WHERE id = 1;";
        let s = new SQLStatement(db, sql);
        let ret = s.runSync();
        assert(ret.error === undefined, "FAIL: " + sql);
        let rj = ret.getRows();
        assert(rj.length === 1 && rj[0]["value"] === 10001, "FAIL: " + sql);
        s.close();
    }
    {
        let sql = "DROP TABLE test_update1";
        let s = new SQLStatement(db, sql);
        let ret = s.runSync();
        s.close();
    }

    checkNoTempTables(db);

    next();
}