import * as fs from "fs";
import {SQLStatement, readTableAsJSON, dumpTable, SKSQL, SQLResult} from "sksql";


export function test_db_university(db: SKSQL) {
    let createSQLScript = fs.readFileSync("res\\university_ddl.sql").toString();
    let fillSQLScript = fs.readFileSync("res\\university_data.sql").toString();

    let createTablesStatement = new SQLStatement(db, createSQLScript);
    let ret = createTablesStatement.run() as SQLResult;
    db.tablesInfo();

    let fillTablesStatement = new SQLStatement(db, fillSQLScript);
    let ret2 = fillTablesStatement.run();

    console.log(dumpTable(db.getTable("instructor")));
    console.log(readTableAsJSON(db, "instructor"));


    let selectInstructor = new SQLStatement(db, "SELECT * from instructor ORDER BY name ASC");
    let retSelectInstruct = selectInstructor.run() as SQLResult;
    console.log(readTableAsJSON(db, retSelectInstruct.resultTableName));


    let selectJOIN = new SQLStatement(db, "SELECT course_id, title, course.dept_name, building FROM course JOIN department ON department.dept_name = course.dept_name");
    let retSelectJOIN = selectJOIN.run() as SQLResult;
    if ((retSelectJOIN as SQLResult).error) {
        throw (retSelectJOIN as SQLResult).error
    }
    console.log(readTableAsJSON(db, retSelectJOIN.resultTableName));



}