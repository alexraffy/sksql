import {numericLoad, numericAdd, numericDisplay, SQLStatement, kResultType, numericCmp, numericDiv, SKSQL, numericMul} from "sksql";
import * as assert from "assert";
import {runTest} from "./runTest";
import {nearlyEqual} from "./float1";



export function test_numeric(db: SKSQL, next: ()=> void) {
    console.log("TESTING NUMERIC...");

    let num1 = numericLoad("0.1", 8, 2);
    assert(num1 !== undefined && num1.m === 10 && num1.e === -2 && num1.sign === 0 && num1.approx === 0, "numericLoad error");
    assert(numericDisplay(num1) === "0.10", "numericDisplay error");

    let num2 = numericLoad("1.206", 8, 2);
    assert(num2 !== undefined && num2.m === 121 && num2.e === -2 && num2.sign === 0 && num2.approx === 0, "numericLoad error");
    assert(numericDisplay(num2) === "1.21", "numericDisplay error");


    let num3 = numericAdd(num1, num2);
    assert(num3 !== undefined && num3.m === 131 && num3.e === -2 && num3.sign === 0 && num3.approx === 0, "numericAdd error");
    assert(numericDisplay(num3) === "1.31", "numericDisplay error");

    let num4 = numericLoad("1");
    let num5 = numericMul(num1, num4);
    assert(num5 !== undefined && num5.m === 1 && num5.e === -1 && num5.sign === 0 && num5.approx === 0, "numericMul error");

    let num3x2 = numericMul(numericLoad("3"), numericLoad("2"));
    assert(num3x2 !== undefined && num3x2.m === 6 && num3x2.e === 0 && num3x2.sign === 0 && num3x2.approx === 0, "numericMul error");

    num1 = numericLoad("1.0");
    num2 = numericLoad("3.0");
    num3 = numericMul(num1, num2);
    assert(numericDisplay(num3) === "3", "Multiplying two numeric is broken.");

    let numDiv = numericDiv(numericLoad("3"), numericLoad("3"));
    assert(numDiv !== undefined && numDiv.m === 1 && numDiv.e === 0, "numericDiv error");


    let st1 = new SQLStatement(db, "SELECT 0.1 + 0.2 as ret FROM dual")
    let ret = st1.run(kResultType.JSON);
    let check = numericLoad("0.3");
    assert(numericCmp(ret[0]["ret"], check) === 0, "Adding two numeric");

    runTest(db, "SELECT 1.0 * 5 FROM dual", false, false, [[numericLoad("5")]], undefined, {printDebug: false});
    runTest(db, "SELECT 2.0 * 5 FROM dual", false, false, [[numericLoad("10")]], undefined, {printDebug: false});
    runTest(db, "SELECT 33.0 * 4 + 10 FROM dual", false, false, [[numericLoad("142")]], undefined, {printDebug: false});
    runTest(db, "SELECT 10.0 + 8.0 * 4 FROM dual", false, false, [[numericLoad("42")]]);
    runTest(db, "SELECT 2.0 * 0.5 FROM dual", false, false, [[numericLoad("1")]]);
    runTest(db, "SELECT 100 + 100 * 0.2 FROM dual", false, false, [[numericLoad("120")]], undefined, {printDebug: false});

    runTest(db, "SELECT 3 * 0.3 FROM dual", false, false, [[numericLoad("0.9")]]);
    runTest(db, "SELECT 3.0 / 3.0 FROM dual", false, false, [[numericLoad("1")]], undefined, {printDebug: false});
    runTest(db, "SELECT 1.0 / 3.0 FROM dual", false, false, [[numericLoad("0.333333333333333")]], undefined, {printDebug: false});
    runTest(db, "SELECT 1.25 * 2 FROM dual", false, false, [[numericLoad("2.50")]]);
    runTest(db, "SELECT 90 / 3.5 FROM dual", false, false, [[numericLoad("25.7142857142857")]], undefined, {printDebug: false});

    runTest(db, "SELECT 1.0 + 125.25 FROM dual", false, false, [[numericLoad("126.25")]], undefined, {printDebug: false});
    runTest(db, "SELECT 1.2134 + 1.3 FROM dual", false, false, [[numericLoad("2.5134")]], undefined, {printDebug: false});
    runTest(db, "SELECT 1.0 - 2.23 FROM dual", false, false, [[numericLoad("-1.23")]]);
    runTest(db, "SELECT 1.23 - 2.23 FROM dual", false, false, [[numericLoad("-1.0")]]);

    runTest(db, "SELECT 1.232 * 2.568 FROM dual", false, false, [[numericLoad("3.163776")]], undefined, {printDebug: false});

    runTest(db, "SELECT 1.0 * 2.0  / 3 + 50 FROM dual", false, false, [[numericLoad("50.6666666666666")]], undefined, {printDebug: false});

    runTest(db, "SELECT 900719925474099.0 FROM dual", false, false, [[numericLoad("900719925474099")]], undefined, {printDebug: false});
    runTest(db, "SELECT -900719925474099.0 FROM dual", false, false, [[numericLoad("-900719925474099")]], undefined, {printDebug: false});
    runTest(db, "SELECT 90071992547.4099 FROM dual", false, false, [[numericLoad("90071992547.4099")]], undefined, {printDebug: false});


    let st2 = new SQLStatement(db, "CREATE TABLE numSum(val NUMERIC(8,2))");
    st2.run();
    let ins = new SQLStatement(db, "INSERT INTO numSum(val) VALUES(@val)");
    for (let i = 10; i > 0; i--) {
        ins.setParameter("@val", i);
        ins.run();
    }

    runTest(db, "SELECT val FROM numSum ORDER BY val ASC", false, false, [
        [numericLoad("1")], [numericLoad("2")], [numericLoad("3")], [numericLoad("4")],
        [numericLoad("5")], [numericLoad("6")], [numericLoad("7")], [numericLoad("8")],
        [numericLoad("9")], [numericLoad("10")]]);

    runTest(db, "SELECT TOP(3) val FROM numSum", false, false, [
        [numericLoad("10")], [numericLoad("9")], [numericLoad("8")]]);

    runTest(db, "SELECT ABS(-150.00) FROM dual", false, false, [[numericLoad("150")]], undefined, {printDebug: false});
    runTest(db, "SELECT ROUND(150.49, 1) FROM dual", false, false, [[numericLoad("150.5")]]);
    runTest(db, "SELECT POWER(150.0, 1) FROM dual", false, false, [[numericLoad("150")]], undefined, {printDebug: false});
    runTest(db, "SELECT CAST(10.1 AS INTEGER) FROM dual", false, false, [[10]]);
    runTest(db, "SELECT CAST(10.299 AS NUMERIC(12,2)) FROM dual", false, false, [[numericLoad("10.30")]]);

    next();

}

