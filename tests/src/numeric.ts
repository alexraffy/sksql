import {numericLoad, numericAdd, numericDisplay, SQLStatement, kResultType, numericCmp, dumpTable, SKSQL, SQLResult} from "sksql";
import * as assert from "assert";


export function test_numeric(db: SKSQL) {
    let num1 = numericLoad("150.15");
    let num2 = numericLoad("0.2");
    let num3 = numericAdd(num1, num2);
    assert(numericDisplay(num3) === "150.35", "Adding two numeric is broken.");

    let st1 = new SQLStatement(db, "SELECT 0.1 + 0.2 as ret FROM dual")
    let ret = st1.run(kResultType.JSON);
    let check = numericLoad("0.3");
    assert(numericCmp(ret[0]["ret"], check) === 0, "Adding two numeric");

    let st2 = new SQLStatement(db, "CREATE TABLE numSum(val NUMERIC(8,2))");
    st2.run();
    let ins = new SQLStatement(db, "INSERT INTO numSum(val) VALUES(@val)");
    for (let i = 10; i > 0; i--) {
        ins.setParameter("@val", i);
        ins.run();
    }

    let st3 = new SQLStatement(db, "SELECT val FROM numSum ORDER BY val ASC");
    let st3Ret = st3.run() as SQLResult;
    console.log(dumpTable(db.getTable(st3Ret.resultTableName)));

    let st4 = new SQLStatement(db, "SELECT TOP(3) val FROM numSum");
    let st4Ret = st4.run() as SQLResult;
    console.log(dumpTable(db.getTable(st4Ret.resultTableName)));


}

