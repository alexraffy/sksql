import * as assert from "assert";
import {atLeast1, instanceOfParseResult,
    instanceOfTAlias,
    instanceOfTColumn,
    instanceOfTLiteral,
    instanceOfTNumber,
    instanceOfTQueryColumn,
    instanceOfTQueryExpression,
    instanceOfTQueryFunctionCall,
    instanceOfTString,
    kQueryExpressionOp,
    parse, predicateTLiteral, predicateTNumber, predicateTQueryColumn,
    predicateTQueryComparisonExpression,
    predicateTQueryCreateTable,
    predicateTQueryDelete,
    predicateTQueryExpression,
    predicateTQueryFunctionCall,
    predicateTQueryInsert,
    predicateTQuerySelect,
    predicateTQueryUpdate,
    str, Stream, TNumber, TParserCallback, TQueryFunctionCall, whitespaceOrNewLine} from "sksql";


export function test_parser() {

    let callback: TParserCallback = (name, value) => {

    }

    const testWhitespaceOrNewLine = parse(callback, function *(callback) {
        yield atLeast1(whitespaceOrNewLine);
        yield str("TEST");
    }, new Stream(" \n \r\nTEST", 0));
    assert(instanceOfParseResult(testWhitespaceOrNewLine), "whitespaceOrNewLine Failed");


    const testColumn1 = parse(callback, predicateTQueryColumn, new Stream("columnA", 0));
    assert(instanceOfParseResult(testColumn1) &&
        instanceOfTQueryColumn(testColumn1.value) &&
        instanceOfTAlias(testColumn1.value.alias) &&
        instanceOfTColumn(testColumn1.value.expression),
        "predicateTQueryColumn[1] Failed");

    const testColumn2 = parse(callback, predicateTQueryColumn, new Stream("columnA AS A", 0));
    assert(instanceOfParseResult(testColumn2) &&
        instanceOfTQueryColumn(testColumn2.value) &&
        instanceOfTAlias(testColumn2.value.alias) &&
        instanceOfTLiteral(testColumn2.value.alias.alias) &&
        testColumn2.value.alias.alias.value === "A",
        "predicateTQueryColumn[2] Failed"
    );

    const testColumn3 = parse(callback, predicateTQueryColumn, new Stream("columnA + 1", 0));
    assert(instanceOfParseResult(testColumn3) &&
        instanceOfTQueryColumn(testColumn3.value) &&
        instanceOfTQueryExpression(testColumn3.value.expression) &&
        instanceOfTColumn(testColumn3.value.expression.value.left) &&
        instanceOfTNumber(testColumn3.value.expression.value.right) &&
        testColumn3.value.expression.value.op === kQueryExpressionOp.add,
        "predicateTQueryColumn[3] Failed"
    );

    const testColumn4 = parse(callback, predicateTQueryColumn, new Stream("columnA + 1 AS A", 0));
    assert(instanceOfParseResult(testColumn4) &&
        instanceOfTQueryColumn(testColumn4.value) &&
        instanceOfTQueryExpression(testColumn4.value.expression) &&
        instanceOfTColumn(testColumn4.value.expression.value.left) &&
        instanceOfTNumber(testColumn4.value.expression.value.right) &&
        testColumn4.value.expression.value.op === kQueryExpressionOp.add &&
        instanceOfTAlias(testColumn4.value.alias) &&
        instanceOfTLiteral(testColumn4.value.alias.alias) &&
        testColumn4.value.alias.alias.value === "A",
        "predicateOfTQueryColumn[4] Failed"
    );


    const testColumn5 = parse(callback, predicateTQueryColumn, new Stream("columnA + fun(1)", 0));
    assert(instanceOfParseResult(testColumn5) &&
        instanceOfTQueryColumn(testColumn5.value) &&
        instanceOfTQueryExpression(testColumn5.value.expression) &&
        instanceOfTColumn(testColumn5.value.expression.value.left) &&
        instanceOfTQueryFunctionCall(testColumn5.value.expression.value.right) &&
        (testColumn5.value.expression.value.right as TQueryFunctionCall).value.name === "fun" &&
        (testColumn5.value.expression.value.right as TQueryFunctionCall).value.parameters.length === 1 &&
        instanceOfTNumber((testColumn5.value.expression.value.right as TQueryFunctionCall).value.parameters[0]) &&
        ((testColumn5.value.expression.value.right as TQueryFunctionCall).value.parameters[0] as TNumber).value === "1"
        ,
        "predicateOfTQueryColumn[5] Failed"
    )



    const testColumn6 = parse(callback, predicateTQueryColumn, new Stream("columnA AS 'A'", 0));
    assert(instanceOfParseResult(testColumn6) &&
        instanceOfTQueryColumn(testColumn6.value) &&
        instanceOfTColumn(testColumn6.value.expression) &&
        instanceOfTAlias(testColumn6.value.alias) &&
        instanceOfTString(testColumn6.value.alias.alias) &&
        testColumn6.value.alias.alias.value === "'A'",
        "predicateOfTQueryColumn[6] Failed"
    )

    const testColumn7 = parse(callback, predicateTQueryColumn, new Stream("10 + columnA * 10 AS 'A'", 0));
    assert(instanceOfParseResult(testColumn7) &&
        instanceOfTQueryColumn(testColumn7.value) &&
        instanceOfTQueryExpression(testColumn7.value.expression) &&
        instanceOfTAlias(testColumn7.value.alias) &&
        instanceOfTString(testColumn7.value.alias.alias) &&
        testColumn7.value.alias.alias.value === "'A'" &&
        instanceOfTNumber(testColumn7.value.expression.value.left) &&
        testColumn7.value.expression.value.op === kQueryExpressionOp.add &&
        instanceOfTQueryExpression(testColumn7.value.expression.value.right) &&
        instanceOfTColumn(testColumn7.value.expression.value.right.value.left) &&
        testColumn7.value.expression.value.right.value.op === kQueryExpressionOp.mul &&
        instanceOfTNumber(testColumn7.value.expression.value.right.value.right)
        , "predicateTQueryColumn[7] Failed"
    );

    const testTestClause1 = parse(callback, predicateTQueryComparisonExpression, new Stream("A = 3", 0));
    const testTestClause2 = parse(callback, predicateTQueryComparisonExpression, new Stream("A = @B", 0));
    const testTestClause3 = parse(callback, predicateTQueryComparisonExpression, new Stream("A = fun(3)", 0));
    const testTestClause4 = parse(callback, predicateTQueryComparisonExpression, new Stream("A <> 3", 0));
    const testTestClause5 = parse(callback, predicateTQueryComparisonExpression, new Stream("A LIKE @var", 0));
    const testTestClause6 = parse(callback, predicateTQueryComparisonExpression, new Stream("A LIKE '%string%'", 0));
    const testTestClause7 = parse(callback, predicateTQueryComparisonExpression, new Stream("A= 1 AND B = 89", 0));
    const testTestClause8 = parse(callback, predicateTQueryComparisonExpression, new Stream("A LIKE '%string%' AND A NOT LIKE 'string%'", 0));

    const create1 = parse(callback, predicateTQueryCreateTable, new Stream("CREATE  TABLE" +
        " [dbo].[students]( student_id uint64 IDENTITY(1,1), firstname VARCHAR(255), lastname VARCHAR(255))", 0));

    const insert1 = parse(callback, predicateTQueryInsert, new Stream("INSERT INTO [students](firstname, lastname) VALUES('Albert', 'Einstein')", 0));
    const insert2 = parse(callback, predicateTQueryInsert, new Stream("INSERT INTO [students](firstname, lastname) SELECT firstname, lastname FROM tempTable", 0));

    const update1 = parse(callback, predicateTQueryUpdate, new Stream("UPDATE students SET firstname = 'The Great Albert' WHERE lastname = 'Einstein'", 0));

    const sql1 = parse(callback, predicateTQuerySelect, new Stream("SELECT student_id FROM [students]", 0));
    const sql2 = parse(callback, predicateTQuerySelect, new Stream("SELECT columnA AS clientName, true AS Status, 3 AS numOrder, DATEADD(DAY, date, 1) AS expiration FROM orders WHERE clientName like '%raffy%'", 0));

    const delete1 = parse(callback, predicateTQueryDelete, new Stream("DELETE TOP(1) FROM students WHERE lastname = 'Einstein'", 0));

    const result = parse(callback, predicateTQueryFunctionCall, new Stream("max('OK', COLUMNA, 2 + 5*st(x))", 0))
    const result2 = parse(callback, predicateTNumber, new Stream("140", 0));
    const result3 = parse(callback, predicateTLiteral, new Stream("TESTING1234", 0));
    const result4 = parse(callback, predicateTQueryExpression, new Stream("x + s(a + 1*mul(t))", 0));


}