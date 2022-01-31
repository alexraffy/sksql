import {numericLoad, numericAdd, numericDisplay, SQLStatement, kResultType, numericCmp, dumpTable, SKSQL} from "sksql";
import * as assert from "assert";

export function test_numeric() {
    let num1 = numericLoad("150.15");
    let num2 = numericLoad("0.2");
    let num3 = numericAdd(num1, num2);
    assert(numericDisplay(num3) === "150.35", "Adding two numeric is broken.");

    let st1 = new SQLStatement("SELECT 0.1 + 0.2 as ret FROM dual")
    let ret = st1.run(kResultType.JSON);
    let check = numericLoad("0.3");
    assert(numericCmp(ret[0]["ret"], check) === 0, "Adding two numeric");

    let st2 = new SQLStatement("CREATE TABLE numSum(val NUMERIC(8,2))");
    st2.run();
    let ins = new SQLStatement("INSERT INTO numSum(val) VALUES(@val)");
    for (let i = 10; i > 0; i--) {
        ins.setParameter("@val", i);
        ins.run();
    }

    let st3 = new SQLStatement("SELECT val FROM numSum ORDER BY val ASC");
    let st3Ret = st3.run();
    console.log(dumpTable(SKSQL.instance.getTable(st3Ret[0].resultTableName)));

    let st4 = new SQLStatement("SELECT TOP(3) val FROM numSum");
    let st4Ret = st4.run();
    console.log(dumpTable(SKSQL.instance.getTable(st4Ret[0].resultTableName)));


}

