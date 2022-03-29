import {SQLStatement, readTableAsJSON, kResultType, numericLoad, SKSQL, SQLResult} from "sksql";
import assert = require("assert");
import {runTest} from "./runTest";





export function test_functions(db: SKSQL, next: ()=>void )  {

    console.log("TESTING FUNCTIONS...");

    let sql = "SELECT \
    DATEFROMPARTS(2021, 11, 01) as datefromparts, \
    DAY(GETDATE()) as day, \
    GETDATE() as getdate, \
    GETUTCDATE() as getutcdate, \
    ISDATE('2021-11-01') as isdate, \
    MONTH(GETDATE()) as month, \
    YEAR(GETDATE()) as year, \
    \
    ABS(-20.3) as abs, \
    POWER(2, 2) as pow, \
    RAND() as random, \
    ROUND(2.1234, 2) as round, \
    \
    CONCAT('Hello', 'World') as concat, \
    CONCAT_WS(' ', 'Hello', 'World') as concat_ws, \
    LEFT('HELLO', 2) as left, \
    LEN('TESTLENGTH') as length, \
    LOWER('HELLO WORLD') as lower, \
    LTRIM('  TESTTRIM   ') as ltrim, \
    PADLEFT('1', '0', 3) as padleft, \
    PADRIGHT('Label', ' ', 10) + ':' as padright, \
    PATINDEX('LABEL', '%AB%') as patindex, \
    REPLACE('GOOD MORNING', 'MORNING', 'AFTERNOON') as replace, \
    REPLICATE('0', 10) as replicate, \
    REVERSE('0123456789') as reverse, \
    RIGHT('HELLO', 2) as right, \
    RTRIM('   TESTTRIM   ') as rtrim, \
    SPACE(10) as space, \
    STR(12.1234) as str, \
    SUBSTRING('HELLO WORLD', 5, 5) as substring, \
    TRIM('   TESTTRIM   ') as testtrim, \
    UPPER('hello world') as upper \
    FROM \
    DUAL";

    let st1 = new SQLStatement(db, sql);
    let res1 = st1.run() as SQLResult;
    assert(res1.error === undefined, "SQL ERROR " + res1.error)
    let ret = readTableAsJSON(db, res1.resultTableName);
    assert(ret[0]["padleft"] === "001", "Error USING FUNCTION PADLEFT");


    {
        let sCreateFunction = "\
        CREATE FUNCTION testfunction(@param boolean) RETURNS VARCHAR(12) AS \
        BEGIN\
        DECLARE @myVar VARCHAR(12) = 'Hello ';\
            IF @param = true\
            BEGIN\
                SET @myVar = 'Good morning';\
            END\
            else\
            BEGIN\
                SET @myVar = 'Good afternoon';\
            END\
            RETURN @myVar;\
        END\
        ";

        let st = new SQLStatement(db, sCreateFunction);
        let res = st.run() as SQLResult;

        runTest(db, "SELECT testfunction(false) as greetings FROM dual", false, false, [["Good afternoon"]]);


    }

    runTest(db, "SELECT POWER(44, 0) FROM dual", false, false, [[1]]);
    runTest(db, "SELECT POWER(44.0, 0) FROM dual", false, false, [[numericLoad("1")]]);
    runTest(db, "DECLARE @b INT32 = 44; SELECT POWER(@b, 0) FROM dual", false, false, [[1]]);
    runTest(db, "DECLARE @b FLOAT = 44.0; SELECT POWER(@b, 0) FROM dual", false, false, [[1]]);
    runTest(db, "DECLARE @b NUMERIC(18,2) = 44.0; SELECT POWER(@b, 0) FROM dual", false, false, [[numericLoad("1")]]);

    runTest(db, "SELECT ROUND(1.2332, 2) FROM dual", false, false, [[numericLoad("1.23")]]);
    runTest(db, "SELECT ROUND(1.2332, 0) FROM dual", false, false, [[numericLoad("1")]]);

    runTest(db, "SELECT ROUND(12312, 0) FROM dual", false, false, [[12312]]);



    next();

}