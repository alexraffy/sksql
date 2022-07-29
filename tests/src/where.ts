


import {SQLStatement, dumpTable, TSQLResult, SKSQL, numericLoad} from "sksql";
import {checkNoTempTables, runTest} from "./runTest";


export function where(db: SKSQL, next: ()=>void) {

    console.log("TESTING WHERE CLAUSES...");

    runTest(db, "DROP TABLE t3; CREATE TABLE t3(a INT, b INT, c INT)", false, false, undefined);
    runTest(db, "INSERT INTO t3 VALUES(1, 2, 3)", false, false, undefined);
    runTest(db, "INSERT INTO t3 VALUES(4, 5, 6)", false, false, undefined);
    runTest(db, "INSERT INTO t3 VALUES(7, 5, 9)", false, false, undefined);

    runTest(db, "SELECT * FROM t3 WHERE a = 1 AND b = 2", false, false, [[1, 2, 3]]);
    runTest(db, "SELECT * FROM t3 WHERE a = 1 AND b = 2 AND c = 3", false, false, [[1, 2, 3]]);




    let sql = "DROP TABLE t1; DROP TABLE t2;" +
        "CREATE TABLE t1(w int, x int, y int);"+
        "CREATE TABLE t2(p int, q int, r int, s int);";
    runTest(db, sql, false, false, undefined);

    let st = new SQLStatement(db, "INSERT INTO t1 VALUES(@w, @x, @y)");

    for (let i = 1; i <= 100; i++) {
        let w = i;
        let x = Math.log(i) / Math.log(2);
        let y = i * i + 2 * i + 1;
        st.setParameter("@w", w);
        st.setParameter("@x", x);
        st.setParameter("@y", y);
        let ret = st.runSync();
        if (ret.error !== undefined && ret.error !== "") {
            throw new Error(ret.error);
        }
    }
    st.close();

    //console.log(dumpTable(db.getTable("t1")));
    runTest(db, "INSERT INTO t2 SELECT 101-w, x, 10201+1-y, y FROM t1", false, false, undefined);
    //console.log(dumpTable(db.getTable("t2")));




    runTest(db, "SELECT x, y, w FROM t1 WHERE w=10", false, false, [[3, 121, 10]]);
    runTest(db, "SELECT x, y, w FROM t1 WHERE w IS 10", true, true, undefined);
    runTest(db, "SELECT x, y, w AS abc FROM t1 WHERE abc=10", true, true, undefined);
    runTest(db, "SELECT x, y, w FROM t1 WHERE w=11", false, false, [[3, 144, 11]]);
    runTest(db, "SELECT x, y, w AS abc FROM t1 WHERE 11=w", false, false, [[3, 144, 11]]);
    runTest(db, "SELECT x, y, w AS abc FROM t1 WHERE 11=abc", true, true, undefined);
    runTest(db, "SELECT x, y, w AS abc FROM t1 WHERE 11 IS abc", true, true, undefined);
    runTest(db, "SELECT w, x, y FROM t1 WHERE 11=w AND x>2", false, false, [[11, 3, 144]]);
    runTest(db, "SELECT w, x, y FROM t1 WHERE 11 IS w AND x>2", true, true, undefined);
    runTest(db, "SELECT w AS a, x AS b, y FROM t1 WHERE 11=a AND b>2", true, true, undefined);
    runTest(db, "SELECT x, y FROM t1 WHERE y<200 AND x>2 AND w=11", false, false, [[3, 144]]);
    runTest(db, "SELECT x, y FROM t1 WHERE w=11 AND y<200 AND x>2", false, false, [[3, 144]]);
    runTest(db, "SELECT x, y FROM t1 WHERE w>10 AND y=144 AND x=3", false, false, [[3, 144]]);
    runTest(db, "SELECT x, y FROM t1 WHERE y=144 AND w>10 AND x=3", false, false, [[3, 144]]);
    runTest(db, "SELECT x, y FROM t1 WHERE x=3 AND w>=10 AND y=121", false, false, [[3, 121]]);
    runTest(db, "SELECT x, y FROM t1 WHERE x=3 AND y=100 AND w<10", false, false, [[3, 100]]);
    runTest(db, "SELECT x, y FROM t1 WHERE x IS 3 AND y IS 100 AND w<10", true, true, undefined);

    runTest(db, "SELECT w FROM t1 WHERE x=3 AND y<100", false, false, [[8]]);
    runTest(db, "SELECT w FROM t1 WHERE x IS 3 AND y<100", true, true, undefined);
    runTest(db, "SELECT w FROM t1 WHERE x=3 AND 100>y", false, false, [[8]]);
    runTest(db, "SELECT w FROM t1 WHERE 3=x AND y<100", false, false, [[8]]);
    runTest(db, "SELECT w FROM t1 WHERE 3 IS x AND y<100", true, true, undefined);
    runTest(db, "SELECT w FROM t1 WHERE 3=x AND 100>y", false, false, [[8]]);
    runTest(db, "SELECT w FROM t1 WHERE x=3 AND y<=100", false, false, [[8], [9]]);
    runTest(db, "SELECT w FROM t1 WHERE x=3 AND 100>=y", false, false, [[8], [9]]);
    runTest(db, "SELECT w FROM t1 WHERE x=3 AND y>225", false, false, [[15]]);
    runTest(db, "SELECT w FROM t1 WHERE x IS 3 AND y>225", true, true, undefined);
    runTest(db, "SELECT w FROM t1 WHERE x=3 AND 225<y", false, false, [[15]]);
    runTest(db, "SELECT w FROM t1 WHERE x=3 AND y>=225", false, false, [[14], [15]]);
    runTest(db, "SELECT w FROM t1 WHERE x=3 AND 225<=y", false, false, [[14], [15]]);
    runTest(db, "SELECT w FROM t1 WHERE x=3 AND y>121 AND y<196", false, false, [[11], [12]]);
    runTest(db, "SELECT w FROM t1 WHERE x IS 3 AND y>121 AND y<196", true, true, undefined);
    runTest(db, "SELECT w FROM t1 WHERE x=3 AND y>=121 AND y<=196", false, false, [[10], [11], [12], [13]]);
    runTest(db, "SELECT w FROM t1 WHERE x=3 AND 121<y AND 196>y", false, false, [[11], [12]]);
    runTest(db, "SELECT w FROM t1 WHERE x=3 AND 121<=y AND 196>=y", false, false, [[10], [11], [12], [13]]);

    runTest(db, "SELECT w FROM t1 WHERE x=3 AND y BETWEEN 121 AND 196", false, false, [[10], [11], [12], [13]]);
    runTest(db, "SELECT w FROM t1 WHERE x=3 AND y+1=122", false, false, [[10]]);
    runTest(db, "SELECT w FROM t1 WHERE x+1=4 AND y+1=122", false, false, [[10]]);
    runTest(db, "SELECT w FROM t1 WHERE y=121", false, false, [[10]]);
    runTest(db, "SELECT w FROM t1 WHERE w>97", false, false, [[98], [99], [100]]);
    runTest(db, "SELECT w FROM t1 WHERE w>=97", false, false, [[97], [98], [99], [100]]);
    runTest(db, "SELECT w FROM t1 WHERE w=97", false, false, [[97]]);
    runTest(db, "SELECT w FROM t1 WHERE w<=97 AND w=97", false, false, [[97]]);
    runTest(db, "SELECT w FROM t1 WHERE w<98 AND w=97", false, false, [[97]]);
    runTest(db, "SELECT w FROM t1 WHERE w>=97 AND w=97", false, false, [[97]]);
    runTest(db, "SELECT w FROM t1 WHERE w>96 AND w=97", false, false, [[97]]);
    runTest(db, "SELECT w FROM t1 WHERE w=97 AND w=97", false, false, [[97]]);
    runTest(db, "SELECT w FROM t1 WHERE w+1=98", false, false, [[97]]);
    runTest(db, "SELECT w FROM t1 WHERE w<3", false, false, [[1], [2]]);
    runTest(db, "SELECT w FROM t1 WHERE w<=3", false, false, [[1], [2], [3]]);
    runTest(db, "SELECT w FROM t1 WHERE w+1<=4 ORDER BY w", false, false, [[1], [2], [3]]);
    runTest(db, "SELECT (w) FROM t1 WHERE (w)>(97)", false, false, [[98], [99], [100]]);
    runTest(db, "SELECT (w) FROM t1 WHERE (w)>=(97)", false, false, [[97], [98], [99], [100]]);
    runTest(db, "SELECT (w) FROM t1 WHERE (w)=(97)", false, false, [[97]]);
    runTest(db, "SELECT (w) FROM t1 WHERE ((w)+(1))=(98)", false, false, [[97]]);

    runTest(db, "SELECT x, y, w FROM t1 WHERE w=34 OR w=35", false, false, [[5, 1225, 34], [5, 1296,35]]);


    runTest(db, "SELECT w, p FROM t2, t1\n" +
        "    WHERE x=q AND y=s AND r=8977", false, false, [[34, 67]]);


    checkNoTempTables(db);

    next();

}