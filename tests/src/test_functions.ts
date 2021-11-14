import {SQLStatement, readTableAsJSON, kResultType} from "sksql";
import assert = require("assert");


export function test_functions()  {

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

   //sql = "SELECT DAY(GETDATE()) FROM DUAL";

    let st1 = new SQLStatement(sql);
    let res1 = st1.run();
    assert(res1[0].error === undefined, "SQL ERROR " + res1[0].error)
    let ret = readTableAsJSON(res1[0].resultTableName);
    assert(res1.length > 0 && ret[0]["padleft"] === "001", "Error USING FUNCTION PADLEFT");



}