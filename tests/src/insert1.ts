
import {SQLStatement, dumpTable, kResultType, SKSQL, numericLoad} from "sksql";
import {checkNoTempTables, runTest} from "./runTest";



export function insert1(db: SKSQL, next:()=>void) {
    console.log("TESTING INSERT STATEMENTS...");

    runTest(db, "DROP TABLE test1", false, false, undefined);

    runTest(db, "INSERT INTO test1 VALUES(1,2,3)", true, true, undefined);
    runTest(db, "CREATE TABLE test1(one int, two int, three int)", false, false, undefined);
    runTest(db, "INSERT INTO test1 VALUES(1,2)", true, true, undefined);
    runTest(db, "INSERT INTO test1 VALUES(1,2,3,4)", true, true, undefined);
    runTest(db, "INSERT INTO test1(one,two) VALUES(1,2,3,4)", true, true, undefined);
    runTest(db, "INSERT INTO test1(one,two) VALUES(1)", true, true, undefined);
    runTest(db, "INSERT INTO test1(one,four) VALUES(1,2)", true, true, undefined);
    runTest(db, "INSERT INTO test1 VALUES(1,2,3)", false, false, undefined);
    runTest(db, "SELECT * FROM test1", false, false, [[1,2,3]]);
    runTest(db, "INSERT INTO test1 VALUES(4,5,6)", false, false, undefined);
    runTest(db, "SELECT * FROM test1 ORDER BY one", false, false, [[1,2,3],[4,5,6]]);
    runTest(db, "INSERT INTO test1 VALUES(7,8,9)", false, false, undefined);
    runTest(db, "SELECT * FROM test1 ORDER BY one", false, false, [[1, 2, 3], [4, 5, 6], [7, 8, 9]])
    runTest(db, "DELETE FROM test1", false, false, undefined);
    runTest(db, "INSERT INTO test1(one,two) VALUES(1,2)", false, false, undefined);
    runTest(db, "SELECT * FROM test1 ORDER BY one", false, false, [[1, 2, undefined]]);
    runTest(db, "INSERT INTO test1(two,three) VALUES(5,6)", false, false, undefined);
    //console.log(dumpTable(db.getTable("test1")));
    runTest(db, "SELECT * FROM test1 ORDER BY one", false, false, [[undefined, 5, 6], [1, 2, undefined]]);
    runTest(db, "INSERT INTO test1(three,one) VALUES(7,8)", false, false, undefined);
    runTest(db, "SELECT * FROM test1 ORDER BY one", false, false, [[undefined, 5, 6], [1, 2, undefined], [8, undefined, 7]]);

    // default
    let test2 = "DROP TABLE test2; CREATE TABLE test2(\n" +
        "      f1 int default -111, \n" +
        "      f2 numeric(12,2) default 4.32,\n" +
        "      f3 int default 222,\n" +
        "      f4 int default 7.89\n" +
        "    )";
    runTest(db, test2, false, false, undefined);
    runTest(db, "SELECT * from test2", false, false, []);
    runTest(db, "INSERT INTO test2(f1,f3) VALUES(10,-10)", false, false, undefined);
    runTest(db, "SELECT * FROM test2", false, false, [[10, numericLoad("4.32"), -10, 8]], undefined, {printDebug: false});
    runTest(db, "INSERT INTO test2(f2,f4) VALUES(1.23,-3.45)", false, false, undefined);
    runTest(db, "SELECT * FROM test2 WHERE f1=-111", false, false, [[-111, numericLoad("1.23"), 222, -3]]);
    runTest(db, "INSERT INTO test2(f1,f2,f4) VALUES(77, 1.23,3.45)", false, false, undefined);
    runTest(db, "SELECT * FROM test2 WHERE f1=77", false, false, [[77, numericLoad("1.23"), 222, 3]]);

    let reset2 = "DROP TABLE test2;\n" +
        "    CREATE TABLE test2(\n" +
        "      f1 int default 111, \n" +
        "      f2 numeric(12, 2) default -4.32,\n" +
        "      f3 varchar(255) default 'hi',\n" +
        "      f4 varchar(255) default 'abc-123',\n" +
        "      f5 varchar(10)\n" +
        "    )";
    runTest(db, reset2, false, false, undefined);
    runTest(db, "SELECT * FROM test2", false, false, []);
    runTest(db, "INSERT INTO test2(f2,f4) VALUES(-2.22,'hi!')", false, false, undefined);
    runTest(db, "SELECT * FROM test2", false, false, [[111, numericLoad("-2.22"), "hi", "hi!", undefined]]);
    runTest(db, "INSERT INTO test2(f1,f5) VALUES(1,'xyzzy')", false, false, undefined);
    runTest(db, "SELECT * FROM test2 ORDER BY f1", false, false, [
        [1, numericLoad("-4.32"), "hi", "abc-123", "xyzzy"],
        [111, numericLoad("-2.22"), "hi", "hi!", undefined]]);
    runTest(db, "INSERT INTO test2(f2,f4) VALUES(-3.33,'hum')", false, false, undefined);
    runTest(db, "SELECT * FROM test2 WHERE f1=111 AND f2=-3.33", false, false, [[111, numericLoad("-3.33"), "hi", "hum", undefined]], undefined, {printDebug: false});
    runTest(db, "INSERT INTO test2(f1,f2,f5) VALUES(22,-4.44,'wham')", false, false, undefined);
    runTest(db, "SELECT * FROM test2 WHERE f1=111 AND f2=-3.33", false, false, [[111, numericLoad("-3.33"), "hi", "hum", undefined]]);
    runTest(db, "SELECT * FROM test2 WHERE f1=22 AND f2=-4.44", false, false, [[22, numericLoad("-4.44"), "hi", "abc-123", "wham"]]);

    // expression in insert
    let sqlExpression = "DROP TABLE t3; CREATE TABLE t3(a int,b int,c int);\n" +
        "    INSERT INTO t3 VALUES(1+2+3,4,5);\n" +
        "    SELECT * FROM t3;"
    runTest(db, sqlExpression, false, false, [[6, 4, 5]]);
    runTest(db, "INSERT INTO t3 VALUES((SELECT max(a) FROM t3)+1,5,6)", false, false, undefined);
    runTest(db, "SELECT * FROM t3 ORDER BY a", false, false, [[6, 4, 5], [7, 5, 6]]);
    runTest(db, "INSERT INTO t3 VALUES((SELECT max(a) FROM t3)+1,t3.a,6)", true, true, undefined);
    runTest(db, "INSERT INTO t3 VALUES((SELECT b FROM t3 WHERE a=0),6,7)", false, false, undefined);
    runTest(db, "SELECT * FROM t3 ORDER BY a", false, false, [[undefined, 6, 7], [6, 4, 5], [7, 5, 6]]);
    runTest(db, "SELECT b,c FROM t3 WHERE a IS NULL", false, false, [[6, 7]]);
    runTest(db, "INSERT INTO t3 VALUES(notafunc(2,3),2,3)", true, true, undefined);
    runTest(db, "INSERT INTO t3 VALUES(least(1,2,3),greatest(1,2,3),99)", false, false, undefined);
    runTest(db, "SELECT * FROM t3 WHERE c=99", false, false, [[1, 3, 99]]);

    // with select
    runTest(db, "CREATE TABLE t4(x int32);\n" +
        "      INSERT INTO t4 VALUES(1);\n" +
        "      SELECT * FROM t4", false, false, [[1]]);
    runTest(db, "INSERT INTO t4 SELECT x+1 FROM t4;\n" +
        "      SELECT * FROM t4;", false, false, [[1], [2]]);


    // multiple values
    runTest(db, "CREATE TABLE t10(a int,b int,c int);\n" +
        "      INSERT INTO t10 VALUES(1,2,3), (4,5,6), (7,8,9);\n" +
        "      SELECT * FROM t10", false, false, [[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
    runTest(db, "INSERT INTO t10 VALUES(11,12,13), (14,15), (16,17,28)", true, true, undefined);



    let sql = "\
    CREATE TABLE pirates (\
        id uint32 IDENTITY(1,1),\
        name VARCHAR(255),\
        country VARCHAR(50),\
        dob date,\
        death date,\
        bounty numeric(12,0)\
);\
    INSERT INTO pirates (name, country, dob, death, bounty) VALUES\
    ('Calico Jack John Rackham', 'England', '1682-12-26', '1720-11-18', 125000),\
    ('Anne Bonny', 'Ireland', '1697-03-08', '1721-04-00', 80000),\
    ('Bartholomew Roberts', 'Wales', '1682-05-17', '1722-02-10', 800000),\
    ('Blackbeard (Edward Teach)', 'England', '1680-00-00', '1718-11-22', 900000);";
    let st = new SQLStatement(db, sql);
    st.run();

    runTest(db, "SELECT name, country FROM pirates WHERE country IN ('Wales', 'Ireland')", false, false,
        [["Anne Bonny", "Ireland"], ["Bartholomew Roberts", "Wales"]]);

    checkNoTempTables(db);
    next();

}