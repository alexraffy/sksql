import {SKSQL, SQLStatement, kResultType, dumpTable, SQLResult} from "sksql";



export function test_groupby(db: SKSQL) {

    let sql = "CREATE TABLE Sales ( Country VARCHAR(50), Region VARCHAR(50), Sales numeric(6,0) ); \
    INSERT INTO sales VALUES ('Canada', 'Alberta', 100); \
    INSERT INTO sales VALUES ('Canada', 'British Columbia', 200); \
    INSERT INTO sales VALUES ('Canada', 'British Columbia', 300); \
    INSERT INTO sales VALUES ('United States', 'Montana', 900); \
    ";

    let st = new SQLStatement(db, sql);
    st.run();
    st.close();

    console.log(dumpTable(db.getTable("Sales")));

    let sqlGroupBy1 = "SELECT Country, Region, SUM(sales) AS TotalSales " +
        "FROM Sales " +
        "GROUP BY Country, Region HAVING SUM(sales)>=100";
    let st2 = new SQLStatement(db, sqlGroupBy1);
    let ret = st2.run(kResultType.JSON);
    console.log(ret);
    st2.close();



}