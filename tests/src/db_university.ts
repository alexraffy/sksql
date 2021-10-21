import * as fs from "fs";
import {SQLStatement, readTableAsJSON, dumpTable, DBData, SQLResult} from "sksql";


export function test_db_university() {
    let createSQLScript = fs.readFileSync("res\\university_ddl.sql").toString();
    let fillSQLScript = fs.readFileSync("res\\university_data.sql").toString();

    let createTablesStatement = new SQLStatement(createSQLScript);
    let ret = createTablesStatement.run();
    DBData.instance.tablesInfo();

    let fillTablesStatement = new SQLStatement(fillSQLScript);
    let ret2 = fillTablesStatement.run();

    console.log(dumpTable(DBData.instance.getTable("instructor")));
    console.log(readTableAsJSON("instructor"));


    let selectInstructor = new SQLStatement("SELECT ID, name, dept_name, salary from instructor ORDER BY name ASC");
    //let retSelectInstruct = selectInstructor.run();
    //console.log(readTableAsJSON(retSelectInstruct[0].resultTableName));


    let selectJOIN = new SQLStatement("SELECT course_id, title, course.dept_name, building FROM course JOIN department ON department.dept_name = course.dept_name");
    let retSelectJOIN = selectJOIN.run();
    if ((retSelectJOIN[0] as SQLResult).error) {
        throw (retSelectJOIN[0] as SQLResult).error
    }
    console.log(readTableAsJSON(retSelectJOIN[0].resultTableName));



}