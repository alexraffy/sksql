import * as assert from "assert";
import {
    atLeast1,
    checkSequence,
    instanceOfParseResult,
    instanceOfTAlias,
    instanceOfTColumn,
    instanceOfTLiteral,
    instanceOfTNumber,
    instanceOfTQueryColumn,
    instanceOfTQueryExpression,
    instanceOfTQueryFunctionCall,
    instanceOfTString,
    kQueryExpressionOp,
    oneOf,
    parse,
    predicateTLiteral,
    predicateTNumber,
    predicateTQueryColumn,
    predicateTQueryCreateTable,
    predicateTQueryDelete,
    predicateTQueryExpression,
    predicateTQueryFunctionCall,
    predicateTQueryInsert,
    predicateTQuerySelect,
    predicateTQueryUpdate,
    returnPred,
    str,
    Stream,
    TNumber,
    TParserCallback,
    TQueryFunctionCall,
    whitespaceOrNewLine,
    instanceOfTVariable,
    instanceOfTTable,
    instanceOfTQueryCreateTable,
    instanceOfTQuerySelect,
    TableColumnType,
    instanceOfTQueryInsert,
    instanceOfTQueryUpdate,
    instanceOfTQueryDelete,
    instanceOfTQueryTable,
    TQueryExpression, SKSQL
} from "sksql";
import {checkNoTempTables} from "./runTest";





export function test_parser(db: SKSQL) {

    console.log("TESTING PARSER...");

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

    const testTestClause1 = parse(callback, predicateTQueryExpression, new Stream("A = 3", 0));
    assert(instanceOfParseResult(testTestClause1) &&
        instanceOfTQueryExpression(testTestClause1.value) &&
        instanceOfTColumn(testTestClause1.value.value.left) &&
        testTestClause1.value.value.op === kQueryExpressionOp.eq &&
        instanceOfTNumber(testTestClause1.value.value.right)
        , "testTestClause1 Failed"
    );
    const testTestClause2 = parse(callback, predicateTQueryExpression, new Stream("A = @B", 0));
    assert(instanceOfParseResult(testTestClause2) &&
        instanceOfTQueryExpression(testTestClause2.value) &&
        instanceOfTColumn(testTestClause2.value.value.left) &&
        testTestClause2.value.value.op === kQueryExpressionOp.eq &&
        instanceOfTVariable(testTestClause2.value.value.right)
        , "testTestClause2 Failed"
    );

    const testTestClause3 = parse(callback, predicateTQueryExpression, new Stream("A = fun(3)", 0));
    assert(instanceOfParseResult(testTestClause3) &&
        instanceOfTQueryExpression(testTestClause3.value) &&
        instanceOfTColumn(testTestClause3.value.value.left) &&
        testTestClause3.value.value.op === kQueryExpressionOp.eq &&
        instanceOfTQueryFunctionCall(testTestClause3.value.value.right)
        , "testTestClause3 Failed"
    );

    const testTestClause4 = parse(callback, predicateTQueryExpression, new Stream("A <> 3", 0));
    assert(instanceOfParseResult(testTestClause4) &&
        instanceOfTQueryExpression(testTestClause4.value) &&
        instanceOfTColumn(testTestClause4.value.value.left) &&
        testTestClause4.value.value.op === kQueryExpressionOp.dif &&
        instanceOfTNumber(testTestClause4.value.value.right)
        , "testTestClause4 Failed"
    );

    const testTestClause5 = parse(callback, predicateTQueryExpression, new Stream("A LIKE @var", 0));
    assert(instanceOfParseResult(testTestClause5) &&
        instanceOfTQueryExpression(testTestClause5.value) &&
        instanceOfTColumn(testTestClause5.value.value.left) &&
        testTestClause5.value.value.op === kQueryExpressionOp.like &&
        instanceOfTVariable(testTestClause5.value.value.right)
        , "testTestClause5 Failed"
    );

    const testTestClause6 = parse(callback, predicateTQueryExpression, new Stream("A LIKE '%string%'", 0));
    assert(instanceOfParseResult(testTestClause6) &&
        instanceOfTQueryExpression(testTestClause6.value) &&
        instanceOfTColumn(testTestClause6.value.value.left) &&
        testTestClause6.value.value.op === kQueryExpressionOp.like &&
        instanceOfTString(testTestClause6.value.value.right)
        , "testTestClause6 Failed"
    );

    const testTestClause7 = parse(callback, predicateTQueryExpression, new Stream("A= 1 AND B = 89", 0));
    assert(instanceOfParseResult(testTestClause7) &&
        instanceOfTQueryExpression(testTestClause7.value) &&
        instanceOfTQueryExpression(testTestClause7.value.value.left) &&
        instanceOfTColumn((testTestClause7.value.value.left as TQueryExpression).value.left) &&
        testTestClause7.value.value.op === kQueryExpressionOp.boolAnd &&
        instanceOfTNumber((testTestClause7.value.value.left as TQueryExpression).value.right) &&
        instanceOfTQueryExpression(testTestClause7.value.value.right) &&
        instanceOfTColumn((testTestClause7.value.value.right as TQueryExpression).value.left) &&
        testTestClause7.value.value.right.value.op === kQueryExpressionOp.eq &&
        instanceOfTNumber((testTestClause7.value.value.right as TQueryExpression).value.right)
        , "testTestClause7 Failed"
    );
    const testTestClause8 = parse(callback, predicateTQueryExpression, new Stream("A LIKE '%string%' AND A NOT LIKE 'string%'", 0));
    assert(instanceOfParseResult(testTestClause8) &&
        instanceOfTQueryExpression(testTestClause8.value) &&
        instanceOfTQueryExpression(testTestClause8.value.value.left) &&
        instanceOfTColumn((testTestClause8.value.value.left as TQueryExpression).value.left) &&
        instanceOfTQueryExpression(testTestClause8.value.value.right) &&
        testTestClause8.value.value.op === kQueryExpressionOp.boolAnd &&
        instanceOfTString((testTestClause8.value.value.left as TQueryExpression).value.right) &&
        instanceOfTQueryExpression(testTestClause8.value.value.right) &&
        instanceOfTColumn((testTestClause8.value.value.right as TQueryExpression).value.left) &&
        (testTestClause8.value.value.left as TQueryExpression).value.op === kQueryExpressionOp.like &&
        (testTestClause8.value.value.right as TQueryExpression).value.op === kQueryExpressionOp.notLike &&
        instanceOfTString((testTestClause8.value.value.right as TQueryExpression).value.right)
        , "testTestClause8 Failed"
    );

    const create1 = parse(callback, predicateTQueryCreateTable, new Stream("CREATE  TABLE" +
        " [dbo].[students]( student_id uint64 IDENTITY(1,1), firstname VARCHAR(255), lastname VARCHAR(255))", 0));
    assert(
        instanceOfParseResult(create1) &&
        instanceOfTQueryCreateTable(create1.value) &&
        instanceOfTTable(create1.value.name) &&
        create1.value.name.table === "students" &&
        create1.value.columns.length === 3 &&
        create1.value.columns[0].type.type === "UINT64" &&
        create1.value.columns[1].type.type === "VARCHAR" &&
        instanceOfTNumber(create1.value.columns[1].type.size) &&
        create1.value.columns[1].type.size.value === "255"
        ,
        "create1 Failed"
    )

    const insert1 = parse(callback, predicateTQueryInsert, new Stream("INSERT INTO [students](firstname, lastname) VALUES('Albert', 'Einstein')", 0));
    assert(
        instanceOfParseResult(insert1) &&
        instanceOfTQueryInsert(insert1.value) &&
        instanceOfTTable(insert1.value.table) &&
        insert1.value.table.table === "students" &&
        insert1.value.columns.length === 2 &&
        insert1.value.hasValues === true &&
        insert1.value.selectStatement === undefined &&
        insert1.value.values.length === 1
        ,
        "insert1 Failed"
    );

    const insert2 = parse(callback, predicateTQueryInsert, new Stream("INSERT INTO [students](firstname, lastname) SELECT firstname, lastname FROM tempTable", 0));
    assert(
        instanceOfParseResult(insert2) &&
        instanceOfTQueryInsert(insert2.value) &&
        instanceOfTTable(insert2.value.table) &&
        insert2.value.table.table === "students" &&
        insert2.value.columns.length === 2 &&
        insert2.value.hasValues === false &&
        instanceOfTQuerySelect(insert2.value.selectStatement) &&
        insert2.value.values.length === 0
        ,
        "insert2 Failed"
    );

    const update1 = parse(callback, predicateTQueryUpdate, new Stream("UPDATE students SET firstname = 'The Great Albert' WHERE lastname = 'Einstein'", 0));
    assert(
        instanceOfParseResult(update1) &&
        instanceOfTQueryUpdate(update1.value) &&
        instanceOfTTable(update1.value.table) &&
        update1.value.sets.length === 1 &&
        update1.value.tables.length === 0 &&
        instanceOfTQueryExpression(update1.value.where)
        ,
        "update1 Failed"
    );


    const sql1 = parse(callback, predicateTQuerySelect, new Stream("SELECT student_id FROM [students]", 0));
    assert(
        instanceOfParseResult(sql1) &&
        instanceOfTQuerySelect(sql1.value) &&
        sql1.value.tables.length === 1 &&
        instanceOfTQueryTable(sql1.value.tables[0]) &&
        sql1.value.columns.length === 1 &&
        instanceOfTQueryColumn(sql1.value.columns[0]) &&
        instanceOfTColumn(sql1.value.columns[0].expression)
        ,
        "sql1 Failed"
    );
    const sql2 = parse(callback, predicateTQuerySelect, new Stream("SELECT columnA AS clientName, true AS Status, 3 AS numOrder, DATEADD(DAY, date, 1) AS expiration FROM orders WHERE clientName like '%raffy%'", 0));
    assert(
        instanceOfParseResult(sql2) &&
        instanceOfTQuerySelect(sql2.value) &&
        sql2.value.tables.length === 1 &&
        instanceOfTQueryTable(sql2.value.tables[0]) &&
        sql2.value.columns.length === 4 &&
        instanceOfTQueryColumn(sql2.value.columns[0]) &&
        instanceOfTColumn(sql2.value.columns[0].expression) &&
        instanceOfTQueryExpression(sql2.value.where)
        ,
        "sql2 Failed"
    );
    const delete1 = parse(callback, predicateTQueryDelete, new Stream("DELETE TOP(1) FROM students WHERE lastname = 'Einstein'", 0));
    assert(
        instanceOfParseResult(delete1) &&
        instanceOfTQueryDelete(delete1.value) &&
        delete1.value.tables.length === 1 &&
        instanceOfTQueryTable(delete1.value.tables[0]) &&
        instanceOfTQueryExpression(delete1.value.where) &&
        delete1.value.top !== undefined
        ,
        "delete1 Failed"
    );

    const result = parse(callback, predicateTQueryFunctionCall, new Stream("max('OK', COLUMNA, 2 + 5*st(x))", 0));
    assert(instanceOfParseResult(result) && instanceOfTQueryFunctionCall(result.value), "result Failed");
    const result2 = parse(callback, predicateTNumber, new Stream("140", 0));
    assert(instanceOfParseResult(result2) && instanceOfTNumber(result2.value), "result2 Failed");
    const result3 = parse(callback, predicateTLiteral, new Stream("TESTING1234", 0));
    assert(instanceOfParseResult(result3) && instanceOfTLiteral(result3.value), "result3 Failed");
    const result4 = parse(callback, predicateTQueryExpression, new Stream("x + s(a + 1*mul(t))", 0));
    assert(instanceOfParseResult(result4) && instanceOfTQueryExpression(result4.value), "result4 Failed");

    const seq = parse(callback, function *() {
        let ret = yield checkSequence([str("CREATE"), whitespaceOrNewLine, str("TABLE")])
        yield returnPred(ret);
    }, new Stream("CREATE TABLE A", 0));
    assert(instanceOfParseResult(seq) && (typeof (seq.value as any) === "object") &&
        seq.value.length === 3 && seq.value[0] === "CREATE" && seq.value[2] === "TABLE", "seq Failed");

    const seq2 = parse(callback, function *() {
        let ret = yield oneOf([
            checkSequence([str("DROP"), whitespaceOrNewLine, str("TABLE")]),
            checkSequence([str("CREATE"), whitespaceOrNewLine, str("TABLE")])], "");
        yield returnPred(ret);
    }, new Stream("CREATE TABLE A", 0));
    assert(instanceOfParseResult(seq2) && (typeof (seq2.value as any) === "object") &&
        seq2.value.length === 3 && seq2.value[0] === "CREATE" && seq2.value[2] === "TABLE", "seq2 Failed");

    const parenthesis1 = parse(callback, function *() {
        let ret = yield predicateTQueryExpression;
        yield returnPred(ret);
    }, new Stream("(w)", 0));
    assert(instanceOfParseResult(parenthesis1) && instanceOfTColumn(parenthesis1.value), "parenthesis1 Failed");

    const parenthesis2 = parse(callback, function *() {
        let ret = yield predicateTQueryExpression;
        yield returnPred(ret);
    }, new Stream("(w + 1)", 0));
    assert(instanceOfParseResult(parenthesis2) &&
        instanceOfTQueryExpression(parenthesis2.value), "parenthesis2 Failed");

    const parenthesis3 = parse(callback, function *() {
        let ret = yield predicateTQueryExpression;
        yield returnPred(ret);
    }, new Stream("((w) + 1)", 0));
    assert(instanceOfParseResult(parenthesis3) &&
        instanceOfTQueryExpression(parenthesis3.value), "parenthesis3 Failed");

    const parenthesis4 = parse(callback, function *() {
        let ret = yield predicateTQueryExpression;
        yield returnPred(ret);
    }, new Stream("((w) + (1))", 0));
    assert(instanceOfParseResult(parenthesis4) &&
        instanceOfTQueryExpression(parenthesis4.value), "parenthesis4 Failed");

    const parenthesis5 = parse(callback, function *() {
        let ret = yield predicateTQueryExpression;
        yield returnPred(ret);
    }, new Stream("(w) + 1", 0));
    assert(instanceOfParseResult(parenthesis5) &&
        instanceOfTQueryExpression(parenthesis5.value), "parenthesis5 Failed");

    const parenthesis6 = parse(callback, function *() {
        let ret = yield predicateTQueryExpression;
        yield returnPred(ret);
    }, new Stream("w + (1)", 0));
    assert(instanceOfParseResult(parenthesis6) &&
        instanceOfTQueryExpression(parenthesis6.value), "parenthesis6 Failed");

    const parenthesis7 = parse(callback, function *() {
        let ret = yield predicateTQueryExpression;
        yield returnPred(ret);
    }, new Stream("(w + 1) + 5", 0));
    assert(instanceOfParseResult(parenthesis7) &&
        instanceOfTQueryExpression(parenthesis7.value), "parenthesis7 Failed");

    const parenthesis8 = parse(callback, function *() {
        let ret = yield predicateTQueryExpression;
        yield returnPred(ret);
    }, new Stream("((w) + (1)) + 5", 0));
    assert(instanceOfParseResult(parenthesis8) &&
        instanceOfTQueryExpression(parenthesis8.value), "parenthesis8 Failed");

    const parenthesis9 = parse(callback, function *() {
        let ret = yield predicateTQueryExpression;
        yield returnPred(ret);
    }, new Stream("((w) + (1)) + (5)", 0));
    assert(instanceOfParseResult(parenthesis9) &&
        instanceOfTQueryExpression(parenthesis9.value), "parenthesis9 Failed");

    const parenthesis10 = parse(callback, function *() {
        let ret = yield predicateTQueryExpression;
        yield returnPred(ret);
    }, new Stream("((w) + (1)) + ( 5 + 4)", 0));
    assert(instanceOfParseResult(parenthesis10) &&
        instanceOfTQueryExpression(parenthesis10.value), "parenthesis10 Failed");

    const parenthesis11 = parse(callback, function *() {
        let ret = yield predicateTQueryExpression;
        yield returnPred(ret);
    }, new Stream("((w) + (1)) * ((5 - fun(3)) +5)", 0));
    assert(instanceOfParseResult(parenthesis11) &&
        instanceOfTQueryExpression(parenthesis11.value), "parenthesis11 Failed");

    const boolParenthesis1 = parse(callback, function *() {
        let ret = yield predicateTQueryExpression;
        yield returnPred(ret);
    }, new Stream("a = 1 AND b = 1", 0))
    assert(instanceOfParseResult(boolParenthesis1) &&
        instanceOfTQueryExpression(boolParenthesis1.value) &&
        instanceOfTQueryExpression(boolParenthesis1.value.value.left) &&
        instanceOfTQueryExpression(boolParenthesis1.value.value.right) &&
        boolParenthesis1.value.value.op === kQueryExpressionOp.boolAnd &&
        instanceOfTColumn((boolParenthesis1.value.value.left as TQueryExpression).value.left) &&
        instanceOfTNumber((boolParenthesis1.value.value.left as TQueryExpression).value.right) &&
        (boolParenthesis1.value.value.left as TQueryExpression).value.op === kQueryExpressionOp.eq &&
        instanceOfTColumn((boolParenthesis1.value.value.right as TQueryExpression).value.left) &&
        instanceOfTNumber((boolParenthesis1.value.value.right as TQueryExpression).value.right) &&
        (boolParenthesis1.value.value.right as TQueryExpression).value.op === kQueryExpressionOp.eq
        , "boolParenthesis1 Failed"
    );

    const boolParenthesis2 = parse(callback, function *() {
        let ret = yield predicateTQueryExpression;
        yield returnPred(ret);
    }, new Stream("a = 1 OR b = 1", 0));
    assert(instanceOfParseResult(boolParenthesis2) &&
        instanceOfTQueryExpression(boolParenthesis2.value) &&
        instanceOfTQueryExpression(boolParenthesis2.value.value.left) &&
        instanceOfTQueryExpression(boolParenthesis2.value.value.right) &&
        boolParenthesis2.value.value.op === kQueryExpressionOp.boolOR
        , "boolParenthesis2 Failed"
    );


    const boolParenthesis3 = parse(callback, function *() {
        let ret = yield predicateTQueryExpression;
        yield returnPred(ret);
    }, new Stream("a = 1 AND NOT b = 1", 0));
    assert(instanceOfParseResult(boolParenthesis3) &&
        instanceOfTQueryExpression(boolParenthesis3.value) &&
        instanceOfTQueryExpression(boolParenthesis3.value.value.left) &&
        instanceOfTQueryExpression(boolParenthesis3.value.value.right) &&
        boolParenthesis3.value.value.op === kQueryExpressionOp.boolAndNot
        , "boolParenthesis3 Failed"
    );

    const boolParenthesis4 = parse(callback, function *() {
        let ret = yield predicateTQueryExpression;
        yield returnPred(ret);
    }, new Stream("a = 1 AND b = 1 AND c <> 0", 0));
    assert(instanceOfParseResult(boolParenthesis4) &&
        instanceOfTQueryExpression(boolParenthesis4.value) &&
        instanceOfTQueryExpression(boolParenthesis4.value.value.left) &&
        instanceOfTQueryExpression(boolParenthesis4.value.value.right)
        , "boolParenthesis4 Failed"
    );

    const boolParenthesis5 = parse(callback, function *() {
        let ret = yield predicateTQueryExpression;
        yield returnPred(ret);
    }, new Stream("(a = 1) AND b = 1", 0));
    assert(instanceOfParseResult(boolParenthesis5) &&
        instanceOfTQueryExpression(boolParenthesis5.value) &&
        instanceOfTQueryExpression(boolParenthesis5.value.value.left) &&
        instanceOfTQueryExpression(boolParenthesis5.value.value.right)
        , "boolParenthesis5 Failed"
    );


    const boolParenthesis6 = parse(callback, function *() {
        let ret = yield predicateTQueryExpression;
        yield returnPred(ret);
    }, new Stream("((a) = 1) AND b = 1", 0));
    assert(instanceOfParseResult(boolParenthesis6) &&
        instanceOfTQueryExpression(boolParenthesis6.value) &&
        instanceOfTQueryExpression(boolParenthesis6.value.value.left) &&
        instanceOfTQueryExpression(boolParenthesis6.value.value.right)
        , "boolParenthesis6 Failed"
    );

    const boolParenthesis7 = parse(callback, function *() {
        let ret = yield predicateTQueryExpression;
        yield returnPred(ret);
    }, new Stream("(a = 1 AND b = 1)", 0));
    assert(instanceOfParseResult(boolParenthesis7) &&
        instanceOfTQueryExpression(boolParenthesis7.value) &&
        instanceOfTQueryExpression(boolParenthesis7.value.value.left) &&
        instanceOfTQueryExpression(boolParenthesis7.value.value.right)
        , "boolParenthesis7 Failed"
    );

    const boolParenthesis8 = parse(callback, function *() {
        let ret = yield predicateTQueryExpression;
        yield returnPred(ret);
    }, new Stream("((a = 1) AND (b = 1))", 0));
    assert(instanceOfParseResult(boolParenthesis8) &&
        instanceOfTQueryExpression(boolParenthesis8.value) &&
        instanceOfTQueryExpression(boolParenthesis8.value.value.left) &&
        instanceOfTQueryExpression(boolParenthesis8.value.value.right)
        , "boolParenthesis8 Failed"
    );

    const boolParenthesis9 = parse(callback, function *() {
        let ret = yield predicateTQueryExpression;
        yield returnPred(ret);
    }, new Stream("a = 1 AND (b) = 1", 0));
    assert(instanceOfParseResult(boolParenthesis9) &&
        instanceOfTQueryExpression(boolParenthesis9.value) &&
        instanceOfTQueryExpression(boolParenthesis9.value.value.left) &&
        instanceOfTQueryExpression(boolParenthesis9.value.value.right) &&
        boolParenthesis9.value.value.op === kQueryExpressionOp.boolAnd
        , "boolParenthesis9 Failed"
    );

    const boolParenthesis10 = parse(callback, function *() {
        let ret = yield predicateTQueryExpression;
        yield returnPred(ret);
    }, new Stream("a = 1 AND (b = 1)", 0));
    assert(instanceOfParseResult(boolParenthesis10) &&
        instanceOfTQueryExpression(boolParenthesis10.value) &&
        instanceOfTQueryExpression(boolParenthesis10.value.value.left) &&
        instanceOfTQueryExpression(boolParenthesis10.value.value.right)
        , "boolParenthesis10 Failed"
    );

    const boolParenthesis11 = parse(callback, function *() {
        let ret = yield predicateTQueryExpression;
        yield returnPred(ret);
    }, new Stream("a = 1 AND (b = 1 AND c <> 0)", 0));
    assert(instanceOfParseResult(boolParenthesis11) &&
        instanceOfTQueryExpression(boolParenthesis11.value) &&
        instanceOfTQueryExpression(boolParenthesis11.value.value.left) &&
        instanceOfTQueryExpression(boolParenthesis11.value.value.right)

        , "boolParenthesis11 Failed"
    );

    const boolParenthesis12 = parse(callback, function *() {
        let ret = yield predicateTQueryExpression;
        yield returnPred(ret);
    }, new Stream("(a = 1 AND b = 1) OR c <> 0", 0));


    checkNoTempTables(db);
}