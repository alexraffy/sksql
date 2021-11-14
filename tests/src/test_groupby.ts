import {SQLStatement, kResultType} from "sksql";



export function test_groupby() {

    let sql = "CREATE TABLE Sales ( Country VARCHAR(50), Region VARCHAR(50), Sales numeric(6,0) ); \
    INSERT INTO sales VALUES ('Canada', 'Alberta', 100); \
    INSERT INTO sales VALUES ('Canada', 'British Columbia', 200); \
    INSERT INTO sales VALUES ('Canada', 'British Columbia', 300); \
    INSERT INTO sales VALUES ('United States', 'Montana', 900); \
    ";

    let st = new SQLStatement(sql);
    st.run();
    st.close();

    let sqlGroupBy1 = "SELECT Country, Region, SUM(sales) AS TotalSales " +
        "FROM Sales " +
        "GROUP BY Country, Region HAVING SUM(sales)>500";
    let st2 = new SQLStatement(sqlGroupBy1);
    let ret = st2.run(kResultType.JSON);
    console.log(ret);
    st2.close();



}