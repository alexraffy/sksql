import {SQLStatement, readTableAsJSON, kResultType, dumpTable, SKSQL} from "sksql";
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


    {
        console.log("TESTING CREATE FUNCTION 1");
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

        let st = new SQLStatement(sCreateFunction);
        let res = st.run();
        console.log(res);

        let st2 = new SQLStatement("SELECT testfunction(false) as greetings FROM dual");
        let ret2 = st2.run();
        console.log(dumpTable(SKSQL.instance.getTable(ret2[0].resultTableName)));

    }
    {
        let sql = "CREATE FUNCTION hash\
        (\
            @input int,\
            @alphabet varchar(255)\
        )\
        RETURNS varchar(255)\
        AS\
        BEGIN\
        DECLARE\
            @hash varchar(255) = '',\
            @alphabetLength int = LEN(@alphabet),\
            @pos int;\
\
        WHILE 1 = 1 BEGIN\
        SET @pos = @input % @alphabetLength;\
        SET @hash = SUBSTRING(@alphabet, @pos + 1, 1) + @hash;\
        SET @input = CAST((@input / @alphabetLength) as int);\
        IF @input <= 0\
        BREAK;\
        END\
\
        RETURN @hash;\
        END";
        let st = new SQLStatement(sql);
        let res = st.run();
        console.log(res);

        let st2 = new SQLStatement("SELECT hash(100, 'NxBvP0nK7QgWmejLzwdA6apRV25lkOqo8MX1ZrbyGDE3') as hash_id FROM dual");
        let ret2 = st2.run();
        console.log(dumpTable(SKSQL.instance.getTable(ret2[0].resultTableName)));


    }
    {
        let sql = "CREATE FUNCTION consistentShuffle(\
        \
        @alphabet varchar(255),\
    @salt varchar(255)\
    )\
        RETURNS varchar(255)\
        AS\
        BEGIN\
\
 \
        IF @salt IS NULL OR LEN(LTRIM(RTRIM(@salt))) = 0 BEGIN\
        RETURN @alphabet;\
        END\
\
        DECLARE\
    @ls int = LEN(@salt),\
    @i int = LEN(@alphabet) - 1,\
    @v int = 0,\
    @p int = 0,\
    @n int = 0,\
    @j int = 0,\
    @temp varchar(1);\
\
        WHILE @i > 0 BEGIN\
\
        SET @v = @v % @ls;\
        SET @n = UNICODE(SUBSTRING(@salt, @v + 1, 1));\
        SET @p = @p + @n;\
        SET @j = (@n + @v + @p) % @i;\
        SET @temp = SUBSTRING(@alphabet, @j + 1, 1);\
        SET @alphabet =\
        SUBSTRING(@alphabet, 1, @j) +\
        SUBSTRING(@alphabet, @i + 1, 1) +\
        SUBSTRING(@alphabet, @j + 2, 255);\
        SET @alphabet =\
        SUBSTRING(@alphabet, 1, @i) +\
        @temp +\
        SUBSTRING(@alphabet, @i + 2, 255);\
        SET @i = @i - 1;\
        SET @v = @v + 1;\
\
        END\
\
        RETURN @alphabet;\
\
        END";
        let st = new SQLStatement(sql);
        let res = st.run();
        console.log(res);

        let test = new SQLStatement("SELECT consistentShuffle('NxBvP0nK7QgWmejLzwdA6apRV25lkOqo8MX1ZrbyGDE3', 'CE6E160F053C41518582EA36CE9383D5') FROM dual");
        console.log(test.run(kResultType.JSON));



    }
    {
        let sql = "CREATE FUNCTION encode2B\n" +
            "(\n" +
            "\t@number1 int32,\n" +
            "\t@number2 int32\n" +
            ")\n" +
            "RETURNS varchar(255)\n" +
            "AS\n" +
            "BEGIN\n" +
            "\tDECLARE\n" +
            "\t\t@salt varchar(255) = 'CE6E160F053C41518582EA36CE9383D5',\n" +
            "\t\t@alphabet varchar(255) = 'NxBvP0nK7QgWmejLzwdA6apRV25lkOqo8MX1ZrbyGDE3',\n" +
            "\t\t@seps varchar(255) = 'CuHciSFTtIfUhs',\n" +
            "\t\t@guards varchar(255) = '49JY',\n" +
            "\t\t@minHashLength int32 = 12;\n" +
            "\n" +
            "\t\n" +
            "\tDECLARE\n" +
            "\t\t@numbersHashInt int32,\n" +
            "\t\t@lottery varchar(1),\n" +
            "\t\t@buffer varchar(255),\n" +
            "\t\t@last varchar(255),\n" +
            "\t\t@ret varchar(255),\n" +
            "\t\t@sepsIndex int32;\n" +
            "\n" +
            "\tSET @numbersHashInt = (@number1 % 100) + (@number2 % 101);\n" +
            "\n" +
            "\tSET @lottery = SUBSTRING(@alphabet, (@numbersHashInt % LEN(@alphabet)) + 1, 1);\n" +
            "\tSET @ret = @lottery;\n" +
            "\n" +
            "\tSET @buffer = @lottery + @salt + @alphabet;\n" +
            "\tSET @alphabet = consistentShuffle(@alphabet, SUBSTRING(@buffer, 1, LEN(@alphabet)));\n" +
            "\tSET @last = hash(@number1, @alphabet);\n" +
            "\tSET @ret = @ret + @last;\n" +
            "\n" +
            "\tSET @sepsIndex = @number1 % UNICODE(SUBSTRING(@last, 1, 1));\n" +
            "\tSET @sepsIndex = @sepsIndex % LEN(@seps);\n" +
            "\tSET @ret = @ret + SUBSTRING(@seps, @sepsIndex + 1, 1);\n" +
            "\n" +
            "\tSET @buffer = @lottery + @salt + @alphabet;\n" +
            "\tSET @alphabet = consistentShuffle(@alphabet, SUBSTRING(@buffer, 1, LEN(@alphabet)));\n" +
            "\tSET @last = hash(@number2, @alphabet);\n" +
            "\tSET @ret = @ret + @last;\n" +
            "\n" +
            "\t\n" +
            "\tIF LEN(@ret) < @minHashLength BEGIN\n" +
            "\t\tDECLARE\n" +
            "\t\t\t@guardIndex int32,\n" +
            "\t\t\t@guard varchar(1),\n" +
            "\t\t\t@halfLength int32,\n" +
            "\t\t\t@excess int32;\n" +
            "\t\t\n" +
            "\t\tSET @guardIndex = (@numbersHashInt + UNICODE(SUBSTRING(@ret, 1, 1))) % LEN(@guards);\n" +
            "\t\tSET @guard = SUBSTRING(@guards, @guardIndex + 1, 1);\n" +
            "\t\tSET @ret = @guard + @ret;\n" +
            "\t\tIF LEN(@ret) < @minHashLength BEGIN\n" +
            "\t\t\tSET @guardIndex = (@numbersHashInt + UNICODE(SUBSTRING(@ret, 3, 1))) % LEN(@guards);\n" +
            "\t\t\tSET @guard = SUBSTRING(@guards, @guardIndex + 1, 1);\n" +
            "\t\t\tSET @ret = @ret + @guard;\n" +
            "\t\tEND\n" +
            "\t\t\n" +
            "\t\tWHILE LEN(@ret) < @minHashLength BEGIN\n" +
            "\t\t\tSET @halfLength = IsNull(@halfLength, CAST((LEN(@alphabet) / 2) as int));\n" +
            "\t\t\tSET @alphabet = consistentShuffle(@alphabet, @alphabet);\n" +
            "\t\t\tSET @ret = SUBSTRING(@alphabet, @halfLength + 1, 255) + @ret + \n" +
            "\t\t\t\t\tSUBSTRING(@alphabet, 1, @halfLength);\n" +
            "\t\t\tSET @excess = LEN(@ret) - @minHashLength;\n" +
            "\t\t\tIF @excess > 0 \n" +
            "\t\t\t\tSET @ret = SUBSTRING(@ret, CAST((@excess / 2) as int) + 1, @minHashLength);\n" +
            "\t\tEND\n" +
            "\tEND\n" +
            "\tRETURN @ret;\n" +
            "END\n";

        let st = new SQLStatement(sql, false);
        let ret = st.run();
        console.log(ret);

        let test = new SQLStatement("SELECT encode2b(1, 1024) FROM dual");
        console.log(test.run(kResultType.JSON));

    }

}