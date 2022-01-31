import {SQLStatement, readTableAsJSON} from "sksql";
import * as assert from "assert";


export function update1() {
    {
        let sql = "CREATE TABLE test_update1(id INT32, value INT32);";
        let s = new SQLStatement(sql);
        let ret = s.run();
        assert(ret.length === 1 && ret[0].error === undefined, "FAIL: " + sql);
    }
    {
        let sql = "INSERT INTO test_update1(id, value) VALUES(1, 1);"
        let s = new SQLStatement(sql);
        let ret = s.run();
        assert(ret.length === 1 && ret[0].error === undefined, "FAIL: " + sql);
    }
    {
        let sql = "UPDATE SET value = 2 FROM test_update1;"
        let s = new SQLStatement(sql);
        let ret = s.run();
        assert(ret.length === 1 && ret[0].error === undefined, "FAIL: " + sql);
    }
    {
        let sql = "SELECT value FROM test_update1 WHERE id = 1;";
        let s = new SQLStatement(sql);
        let ret = s.run();
        assert(ret.length === 1 && ret[0].error === undefined, "FAIL: " + sql);
        let rj = readTableAsJSON(ret[0].resultTableName);
        assert(rj.length === 1 && rj[0]["value"] === 2, "FAIL: " + sql);
    }
    {
        let sql = "DECLARE @loop INT32 = 2; WHILE @loop < 1000 BEGIN INSERT INTO test_update1(id, value) VALUES(@loop, @loop); SET @loop = @loop + 1; END";
        let s = new SQLStatement(sql);
        let ret = s.run();
        assert(ret.length > 0 && ret[0].error === undefined, "FAIL: " + sql);
        let rj = readTableAsJSON("test_update1");
        assert(rj.length > 0 && rj[998]["value"] === 999, "FAIL: "  + sql);
    }
    {
        let sql = "UPDATE SET value = id + 10000 FROM test_update1;";
        let s = new SQLStatement(sql);
        let ret = s.run();
        assert(ret.length === 1 && ret[0].error === undefined, "FAIL: " + sql);
    }
    {
        let sql = "SELECT value FROM test_update1 WHERE id = 1;";
        let s = new SQLStatement(sql);
        let ret = s.run();
        assert(ret.length === 1 && ret[0].error === undefined, "FAIL: " + sql);
        let rj = readTableAsJSON(ret[0].resultTableName);
        assert(rj.length === 1 && rj[0]["value"] === 10001, "FAIL: " + sql);
    }
    {
        let sql = "DROP TABLE test_update1";
        let s = new SQLStatement(sql);
        let ret = s.run();
        
    }

}