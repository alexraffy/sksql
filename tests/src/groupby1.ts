
import {SKSQL, SQLStatement, SQLResult, numericCmp, isNumeric,
    numericLoad, readFirst, cursorEOF, recordSize, rowHeaderSize, readValue,
    readNext} from "sksql";
import {runTest} from "./runTest";


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


    next();

}