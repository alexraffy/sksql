
import {SKSQL, SQLStatement, SQLResult, numericCmp, isNumeric,
    numericLoad, readFirst, cursorEOF, recordSize, rowHeaderSize, readValue,
    readNext} from "sksql";
import {checkNoTempTables, runTest} from "./runTest";


export function groupby1(db: SKSQL, next:()=>void) {
    console.log("TESTING GROUP BY...");

    let sql = "CREATE TABLE Sales ( Country VARCHAR(50), Region VARCHAR(50), Sales numeric(6,0) ); \
    INSERT INTO sales VALUES ('Canada', 'Alberta', 100); \
    INSERT INTO sales VALUES ('Canada', 'British Columbia', 200); \
    INSERT INTO sales VALUES ('Canada', 'British Columbia', 300); \
    INSERT INTO sales VALUES ('United States', 'Montana', 900); \
    ";
    let st = new SQLStatement(db, sql);
    st.run();
    st.close();

    let sqlGroupBy1 = "SELECT Country, Region, SUM(sales) AS TotalSales " +
        "FROM Sales " +
        "GROUP BY Country, Region HAVING SUM(sales)>=100";
    runTest(db, sqlGroupBy1, false, false, [
        ["Canada", "Alberta", numericLoad("100")],
        ["Canada", "British Columbia", numericLoad("500")],
        ["United States", "Montana", numericLoad("900")]]);


    runTest(db, "SELECT Country FROM Sales GROUP BY Sales.country", false, false,[
        ["Canada"],
        ["United States"]
    ]);
    runTest(db, "SELECT sales.Country FROM Sales GROUP BY Sales.country", false, false,[
        ["Canada"],
        ["United States"]
    ]);
    runTest(db, "SELECT sales.Country FROM Sales s GROUP BY s.country", false, false,[
        ["Canada"],
        ["United States"]
    ]);
    runTest(db, "SELECT s.Country FROM Sales as s GROUP BY country", false, false,[
        ["Canada"],
        ["United States"]
    ]);
    runTest(db, "SELECT s.Country FROM Sales as s GROUP BY sales.country", false, false,[
        ["Canada"],
        ["United States"]
    ]);

    runTest(db, "CREATE TABLE tokens(database_id INT, token VARCHAR(36), validity DATETIME);", false, false, undefined);
    runTest(db, "INSERT INTO tokens(database_id, token, validity) VALUES(0, '456123789', DATEADD('mi', 1, GETDATE()))", false, false, undefined);
    runTest(db, "INSERT INTO tokens(database_id, token, validity) VALUES(1, '123456789', DATEADD('mi', 1, GETDATE()))", false, false, undefined);
    runTest(db, "INSERT INTO tokens(database_id, token, validity) VALUES(1, '987654321', DATEADD('mi', 1, GETDATE()))", false, false, undefined);
    runTest(db, "INSERT INTO tokens(database_id, token, validity) VALUES(1, '654789153', DATEADD('mi', -1, GETDATE()))", false, false, undefined);
    runTest(db, "SELECT database_id, STRING_AGG(token, ',') as tokens FROM tokens GROUP BY database_id", false, false, [
        [0, '456123789'],
        [1, '123456789,987654321,654789153']
    ]);
    runTest(db, "SELECT database_id, STRING_AGG(token, ',') as tokens FROM tokens WHERE database_id = 0 GROUP BY database_id", false, false, [
        [0, '456123789']
    ]);
    runTest(db, "SELECT database_id, STRING_AGG(token, ',') as tokens FROM tokens WHERE database_id = 1 GROUP BY database_id", false, false, [
        [1, '123456789,987654321,654789153']
    ]);
    runTest(db, "SELECT database_id, STRING_AGG(token, ',') as tokens FROM tokens WHERE database_id = 2 GROUP BY database_id", false, false, [
    ], undefined, {printDebug: false});
    runTest(db, "SELECT database_id, STRING_AGG(token, ',') as tokens FROM tokens WHERE database_id = 1 AND validity > GETDATE() GROUP BY database_id", false, false, [
        [1, '123456789,987654321']
    ]);

    checkNoTempTables(db);

    next();

}