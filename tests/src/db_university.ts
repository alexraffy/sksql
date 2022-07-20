import * as fs from "fs";
import {SQLStatement, readTableAsJSON, dumpTable, SKSQL, TSQLResult, numericLoad} from "sksql";
import {checkNoTempTables, runTest} from "./runTest";


export function test_db_university(db: SKSQL, next:()=>void) {
    console.log("TESTING DB-BOOK SAMPLES...");

    let createSQLScript = fs.readFileSync("res\\university_ddl.sql").toString();
    let fillSQLScript = fs.readFileSync("res\\university_data.sql").toString();

    let createTablesStatement = new SQLStatement(db, createSQLScript);
    let ret = createTablesStatement.run();
    let fillTablesStatement = new SQLStatement(db, fillSQLScript);
    let ret2 = fillTablesStatement.run();
    fillTablesStatement.close();

    runTest(db, "select title from course where dept_name = 'Comp. Sci.' and credits = 3", false, false,
        [
            ["Robotics"],
            ["Image Processing"],
            ["Database System Concepts"]
        ]);
    runTest(db, "select * from instructor where name = 'Einstein'", false, false, [
        ['22222', 'Einstein', 'Physics', numericLoad("95000")]
    ]);
    runTest(db, "select * from teaches where id = '22222';", false, false, [
       ['22222', 'PHY-101', '1', 'Fall', numericLoad("2009")]
    ]);
    runTest(db, "select * from takes where sec_id = '1' and semester = 'Fall' and course_id = 'PHY-101';", false, false, [
       ['44553', 'PHY-101', '1', 'Fall', numericLoad("2009"), 'B-']
    ]);
    runTest(db, "SELECT distinct takes.ID from takes, instructor, teaches " +
        "where takes.course_id = teaches.course_id and takes.sec_id = teaches.sec_id and " +
        "takes.semester = teaches.semester and takes.year = teaches.year and " +
        "teaches.id = instructor.id and instructor.name = 'Einstein'", false, false, [
            ['44553']
        ]);
    runTest(db, "SELECT MIN(salary), MAX(Salary) FROM instructor", false, false, [
        [numericLoad("40000"), numericLoad("95000")]
    ]);
    runTest(db, "select id, name from instructor where salary = (SELECT max(salary) from instructor)", false, false, [
        ["22222", "Einstein"]
    ]);

    let sql3 = "select \n" +
    "        course_id, \n" +
    "        sec_id, \n" +
    "        (select count(ID) \n" +
    "            from takes \n" +
    "            where takes.year = section.year and \n" +
    "            takes.semester = section.semester and \n" +
    "            takes.course_id = section.course_id and\n" +
    "            takes.sec_id = section.sec_id)\n" +
    "        as enrollment\n" +
    "    from section\n" +
    "    where semester = 'Fall' and\n" +
    "    year = '2009'"
    runTest(db, sql3, false, false, [
        ["CS-101", "1", 6],
        ["CS-347", "1", 2],
        ["PHY-101", "1", 1]
    ])

    let sql4 = "select takes.course_id, takes.sec_id\n" +
        "            from section, takes\n" +
        "            where takes.year = section.year\n" +
        "            and takes.semester = section.semester\n" +
        "            and takes.course_id = section.course_id\n" +
        "            and takes.sec_id = section.sec_id\n" +
        "            and takes.semester = 'Fall'\n" +
        "            and takes.year = '2009'\n" +
        "            group by takes.course_id, takes.sec_id";
    runTest(db, sql4, false, false, [
        ["CS-101", "1"],
        ["CS-347", "1"],
        ["PHY-101", "1"]
    ], undefined, {printDebug: false});

    let sql5 = "select count(id) as enrollment\n" +
        "            from section, takes\n" +
        "            where takes.year = section.year\n" +
        "            and takes.semester = section.semester\n" +
        "            and takes.course_id = section.course_id\n" +
        "            and takes.sec_id = section.sec_id\n" +
        "            and takes.semester = 'Fall'\n" +
        "            and takes.year = '2009'\n" +
        "            group by takes.course_id, takes.sec_id";
    runTest(db, sql5, false, false, [
        [6],
        [2],
        [1]
    ], undefined, {printDebug: false});


    let sql6 = "select max(enrollment)\n" +
        "    from (select count(id) as enrollment\n" +
        "            from section, takes\n" +
        "            where takes.year = section.year\n" +
        "            and takes.semester = section.semester\n" +
        "            and takes.course_id = section.course_id\n" +
        "            and takes.sec_id = section.sec_id\n" +
        "            and takes.semester = 'Fall'\n" +
        "            and takes.year = '2009'\n" +
        "            group by takes.course_id, takes.sec_id)";
    runTest(db, sql6, false, false, [[6]], undefined, {printDebug: false});



    runTest(db, "SELECT * from instructor ORDER BY name ASC", false, false, [
        ["83821", "Brandt", "Comp. Sci.", numericLoad("92000")],
        ["58583", "Califieri", "History", numericLoad("62000")],
        ["76766", "Crick", "Biology", numericLoad("72000")],
        ["22222", "Einstein", "Physics", numericLoad("95000")],
        ["32343", "El Said", "History", numericLoad("60000")],
        ["33456", "Gold", "Physics", numericLoad("87000")],
        ["45565", "Katz", "Comp. Sci.", numericLoad("75000")],
        ["98345", "Kim", "Elec. Eng.", numericLoad("80000")],
        ["15151", "Mozart", "Music", numericLoad("40000")],
        ["76543", "Singh", "Finance", numericLoad("80000")],
        ["10101", "Srinivasan", "Comp. Sci.", numericLoad("65000")],
        ["12121", "Wu", "Finance", numericLoad("90000")]
    ])


    runTest(db, "SELECT course_id, title, course.dept_name, building FROM course JOIN department ON department.dept_name = course.dept_name", false, false, [
        ["BIO-101", "Intro. to Biology", "Biology", "Watson"],
        ["BIO-301", "Genetics", "Biology", "Watson"],
        ["BIO-399", "Computational Biology", "Biology", "Watson"],
        ["CS-101", "Intro. to Computer Science", "Comp. Sci.", "Taylor"],
        ["CS-190", "Game Design", "Comp. Sci.", "Taylor"],
        ["CS-315", "Robotics", "Comp. Sci.", "Taylor"],
        ["CS-319", "Image Processing", "Comp. Sci.", "Taylor"],
        ["CS-347", "Database System Concepts", "Comp. Sci.", "Taylor"],
        ["EE-181", "Intro. to Digital Systems", "Elec. Eng.", "Taylor"],
        ["FIN-201", "Investment Banking", "Finance", "Painter"],
        ["HIS-351", "World History", "History", "Painter"],
        ["MU-199", "Music Video Production", "Music", "Packard"],
        ["PHY-101", "Physical Principles", "Physics", "Watson"]
    ], undefined, {printDebug: false});


    checkNoTempTables(db);

    next();

}