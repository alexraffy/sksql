


import {SQLStatement, dumpTable, SQLResult, SKSQL, numericLoad} from "sksql";
import {runTest} from "./runTest";


export function join1(db: SKSQL, next:()=>void) {
    console.log("TESTING JOINS...");

    runTest(db, "DROP TABLE department; DROP TABLE employees; DROP TABLE salary;", false, false, undefined);
    runTest(db, "CREATE TABLE department(id UINT32 IDENTITY(1,1), name VARCHAR(50))", false, false, undefined);
    runTest(db, "INSERT INTO department(name) VALUES('Sales')", false, false, undefined);
    runTest(db, "INSERT INTO department(name) VALUES('IT')", false, false, undefined);
    runTest(db, "CREATE TABLE employees(id UINT32 IDENTITY(1,1), firstname VARCHAR(50), lastname VARCHAR(50), department_id UINT32, FOREIGN KEY (department_id) REFERENCES department (id))", false, false, undefined);
    runTest(db, "INSERT INTO employees(firstname, lastname, department_id) VALUES('Alicia', 'Krazenski', 1);", false, false, undefined);
    runTest(db, "INSERT INTO employees(firstname, lastname, department_id) VALUES('Bob', 'Turner', 1);", false, false, undefined);
    runTest(db, "INSERT INTO employees(firstname, lastname, department_id) VALUES('Jennifer', 'Lewis', 1);", false, false, undefined);
    runTest(db, "INSERT INTO employees(firstname, lastname, department_id) VALUES('Jay', 'Lafayette', 1);", false, false, undefined);
    runTest(db, "INSERT INTO employees(firstname, lastname, department_id) VALUES('Josh', 'Thompson', 2);", false, false, undefined);
    runTest(db, "INSERT INTO employees(firstname, lastname, department_id) VALUES('Gary', 'Powell', 2);", false, false, undefined);
    runTest(db, "INSERT INTO employees(firstname, lastname, department_id) VALUES('Joe', 'Intern', NULL);", false, false, undefined);

    runTest(db, "SELECT firstname, lastname, name FROM employees JOIN department", false, false, [
        ["Alicia", "Krazenski", "Sales"],
        ["Alicia", "Krazenski", "IT"],
        ["Bob", "Turner", "Sales"],
        ["Bob", "Turner", "IT"],
        ["Jennifer", "Lewis", "Sales"],
        ["Jennifer", "Lewis", "IT"],
        ["Jay", "Lafayette", "Sales"],
        ["Jay", "Lafayette", "IT"],
        ["Josh", "Thompson", "Sales"],
        ["Josh", "Thompson", "IT"],
        ["Gary", "Powell", "Sales"],
        ["Gary", "Powell", "IT"],
        ["Joe", "Intern", "Sales"],
        ["Joe", "Intern", "IT"]
    ]);

    runTest(db, "SELECT firstname, lastname, name FROM employees JOIN department ON department.id = employees.department_id", false, false, [
        ["Alicia", "Krazenski", "Sales"],
        ["Bob", "Turner", "Sales"],
        ["Jennifer", "Lewis", "Sales"],
        ["Jay", "Lafayette", "Sales"],
        ["Josh", "Thompson", "IT"],
        ["Gary", "Powell", "IT"]
    ]);

    runTest(db, "SELECT firstname, lastname, name FROM employees INNER JOIN department ON department.id = employees.department_id", false, false, [
        ["Alicia", "Krazenski", "Sales"],
        ["Bob", "Turner", "Sales"],
        ["Jennifer", "Lewis", "Sales"],
        ["Jay", "Lafayette", "Sales"],
        ["Josh", "Thompson", "IT"],
        ["Gary", "Powell", "IT"]
    ], undefined, {printDebug: false});

    runTest(db, "SELECT firstname, lastname, name FROM employees LEFT JOIN department ON department.id = employees.department_id", false, false, [
        ["Alicia", "Krazenski", "Sales"],
        ["Bob", "Turner", "Sales"],
        ["Jennifer", "Lewis", "Sales"],
        ["Jay", "Lafayette", "Sales"],
        ["Josh", "Thompson", "IT"],
        ["Gary", "Powell", "IT"],
        ["Joe", "Intern", undefined]
    ], undefined, {printDebug: false});


    runTest(db, "DROP TABLE t1; DROP TABLE t2;", false, false, undefined);
    runTest(db, "CREATE TABLE t1(a int, b int);", false, false, undefined);
    runTest(db, "CREATE TABLE t2(a int, b int);", false, false, undefined);
    runTest(db, "DECLARE @loop INT32 = 0; WHILE @loop < 1000 BEGIN SET @loop = @loop + 1; INSERT INTO t1 VALUES(@loop, @loop); INSERT INTO t2 VALUES(@loop, @loop); END", false, false, undefined);
    runTest(db, "SELECT t1.a, t2.b FROM t1 JOIN t2 ON t2.b = t1.a WHERE t1.a = 999", false, false, [
        [999, 999]
    ]);

    runTest(db, "DROP TABLE employees; DROP TABLE department; DROP TABLE t1; DROP TABLE t2;", false, false, undefined);

    next();
}