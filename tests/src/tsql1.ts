

import {SKSQL, dumpTable, TSQLResult, numericCmp, isNumeric,
    numericLoad, readFirst, cursorEOF, recordSize, rowHeaderSize, readValue,
    readNext} from "sksql";
import {checkNoTempTables, runTest} from "./runTest";


export function tsql1(db: SKSQL, next: ()=>void) {
    console.log("TESTING T-SQL STATEMENTS...");

    runTest(db, "DECLARE @var int; SELECT @var FROM dual;", false, false, [[undefined]]);
    runTest(db, "DECLARE @var int = 1; SELECT @var FROM dual;", false, false, [[1]]);
    runTest(db, "DECLARE @var int = -1; SELECT @var FROM dual;", false, false, [[-1]]);
    runTest(db, "DECLARE @var boolean = true; SELECT @var FROM dual;", false, false, [[true]]);
    runTest(db, "DECLARE @var boolean = false; SELECT @var FROM dual;", false, false, [[false]]);
    runTest(db, "DECLARE @var varchar(50); SELECT @var FROM dual;", false, false, [[undefined]]);
    runTest(db, "DECLARE @var varchar(50) = 'Hello'; SELECT @var FROM dual;", false, false, [["Hello"]]);
    runTest(db, "DECLARE @var numeric(12,2); SELECT @var FROM dual;", false, false, [[undefined]]);
    runTest(db, "DECLARE @var numeric(12,2) = 150.12; SELECT @var FROM dual;", false, false, [[numericLoad("150.12")]]);
    runTest(db, "DECLARE @var numeric(12,2) = -150.12; SELECT @var FROM dual;", false, false, [[numericLoad("-150.12")]]);
    runTest(db, "DECLARE @var int = 1; IF @var = 1 SELECT true FROM dual;", false, false, [[true]]);
    runTest(db, "DECLARE @var int = 1; IF @var = 0 BEGIN SELECT false FROM dual; END ELSE BEGIN SELECT true FROM dual END;", false, false, [[true]]);
    runTest(db, "DECLARE @var int = 1; WHILE @var < 100 BEGIN SET @var = @var + 1; END SELECT @var FROM dual;", false, false, [[100]]);
    runTest(db, "DECLARE @var varchar(50) = 'Hello', @var2 VARCHAR(50) = 'World'; SELECT @var + ' ' + @var2 FROM dual;", false, false, [["Hello World"]]);
    runTest(db, "DECLARE @var varchar(50) = 'Hello', @var2 VARCHAR(50) = @var + ' ' + 'World'; SELECT @var2 FROM dual;", false, false, [["Hello World"]]);
    runTest(db, "DECLARE @var varchar(50) = 'Hello', @var2 VARCHAR(50) = 'World'; SELECT CONCAT(@var, ' ', @var2) FROM dual;", false, false, [["Hello World"]]);
    runTest(db, "DECLARE @var varchar(50) = 'Hello', @var2 VARCHAR(50) = 'World'; SELECT CONCAT_WS(' ', @var, @var2) FROM dual;", false, false, [["Hello World"]]);
    runTest(db, "DECLARE @var boolean = false, @loop int = 0; WHILE (@var<>TRUE) BEGIN SET @loop = @loop + 1; IF @loop % 5 = 0 SET @var = TRUE; END; SELECT @var, @loop FROM dual;",
        undefined, undefined, [[true, 5]]);
    runTest(db, "CREATE FUNCTION aabbcc() RETURNS BOOLEAN AS BEGIN RETURN TRUE; END;", false, false, undefined);
    runTest(db, "SELECT aabbcc() FROM dual", false, false, [[true]]);
    runTest(db, "DROP FUNCTION aabbcc;", false, false, undefined);
    runTest(db, "SELECT aabbcc() FROM dual", true, true, undefined);
    runTest(db, "CREATE FUNCTION aabbcc(@input int) RETURNS INT AS BEGIN RETURN @input; END;", false, false, undefined);
    runTest(db, "SELECT aabbcc(1) FROM dual", false, false, [[1]]);
    runTest(db, "SELECT aabbcc('string') FROM dual", true, true, undefined);
    runTest(db, "DROP FUNCTION aabbcc;", false, false, undefined);

    runTest(db, "CREATE TABLE TTT(a int, b int, c int); insert into ttt values(1, 2, 3);", false, false, undefined);
    runTest(db, "declare @a int, @b int, @c int; SELECT TOP(1) @a = a, @b = b, @c = c from ttt; select @a, @b, @c from dual;", false, false, [
        [1, 2, 3]
    ]);
    runTest(db, "DROP TABLE TTT;", false, false, undefined);

    runTest(db, "CREATE PROCEDURE usp_testParam @a UINT32 AS BEGIN SELECT @a FROM dual; END;", false, false, undefined);
    runTest(db, "Execute usp_testParam @a = 1;", false, false, [[1]]);
    runTest(db, "DROP PROCEDURE usp_runTest;", false, false, undefined);
    runTest(db, "CREATE PROCEDURE usp_testParam @a UINT32 as begin SET @a = @a + 1; END;", false, false, undefined);
    runTest(db, "DECLARE @var UINT32 = 1; Exec usp_testParam @a = @var; SELECT @var FROM dual;", false, false, [[1]]);
    runTest(db, "DECLARE @var UINT32 = 1; Exec usp_testParam @a = @var OUTPUT; SELECT @var FROM dual;", false, false, [[1]], undefined, {printDebug: false});
    runTest(db, "CREATE PROCEDURE usp_testParam @a UINT32 OUTPUT as begin SET @a = @a + 1; END;", false, false, undefined);
    runTest(db, "DECLARE @var UINT32 = 1; Exec usp_testParam @a = @var; SELECT @var FROM dual;", false, false, [[1]]);
    runTest(db, "DECLARE @var UINT32 = 1; Exec usp_testParam @a = @var OUTPUT; SELECT @var FROM dual;", false, false, [[2]]);


    checkNoTempTables(db);

    next();

}