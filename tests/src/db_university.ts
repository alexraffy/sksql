import * as fs from "fs";
import {SQLStatement, readTableAsJSON, dumpTable, DBData} from "sksql";


export function test_db_university() {
    let createSQLScript = fs.readFileSync("res\\university_ddl.sql").toString();
    let fillSQLScript = fs.readFileSync("res\\university_data.sql").toString();

    let createTablesStatement = new SQLStatement(createSQLScript);
    let ret = createTablesStatement.run();


    let fillTablesStatement = new SQLStatement(fillSQLScript);
    let ret2 = fillTablesStatement.run();

    console.log(dumpTable(DBData.instance.getTable("instructor")));
    console.log(readTableAsJSON("instructor"));


    let selectInstructor = new SQLStatement("SELECT ID, name, dept_name, salary from instructor ORDER BY name ASC");
    let retSelectInstruct = selectInstructor.run();
    console.log(readTableAsJSON(retSelectInstruct[0].resultTableName));


}