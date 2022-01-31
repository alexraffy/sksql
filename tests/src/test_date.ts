
import {parseDateString, SQLStatement, dumpTable, SKSQL, readTableDefinition, readTableAsJSON, parseTimeString, parseDateTimeString, kResultType} from "sksql";
import * as assert from "assert";






export function test_date() {

    let str1 = ""; let r1 = parseDateString(str1); assert(r1 === undefined, "Empty string should be parsed as string");
    let str2 = "1492-12-01"; let r2 = parseDateString(str2); assert(r2 !== undefined, str2 + " could not be parsed as date")
    let str3 = "1510-13-01"; let r3 = parseDateString(str3); assert(r3 === undefined, str3 + " should fail to be parsed as a date");
    let str4 = "1580-05-32"; let r4 = parseDateString(str4); assert(r4 === undefined, str4 + " should fail to be parsed as a date");
    let str5 = "1680-00-00"; let r5 = parseDateString(str5); assert(r5 !== undefined, str5 + " could not be parsed as date")
    let str6 = "1720-01-00"; let r6 = parseDateString(str6); assert(r6 !== undefined, str6 + " could not be parsed as date")
    let str7 = "1780-00-13"; let r7 = parseDateString(str7); assert(r7 !== undefined, str7 + " could not be parsed as date")
    let str8 = "1820/6/12"; let r8 = parseDateString(str8); assert(r8 === undefined, str8 + " should fail to be parsed as a date");
    let str9 = "1830/05/2"; let r9 = parseDateString(str9); assert(r8 === undefined, str8 + " should fail to be parsed as a date");
    let str10 = "5:15"; let r10 = parseTimeString(str10); assert(r10 !== undefined, str10 + " could not be parsed as time");
    let str11 = "15:5"; let r11 = parseTimeString(str11); assert(r11 !== undefined, str11 + " could not be parsed as a time");
    let str12 = "15:04"; let r12 = parseTimeString(str12); assert(r12 !== undefined, str12 + " could not be parsed a time");
    let str13 = "24:00"; let r13 = parseTimeString(str13); assert(r13 === undefined, str13 + " should fail to be parsed as a time");
    let str14 = "12:60"; let r14 = parseTimeString(str14); assert(r14 === undefined, str14 + " should fail to be parsed as a time");
    let str15 = "2021-12-29T22:10:00.000"; let r15 = parseDateTimeString(str15); assert(r15 !== undefined, str15 + " could not be parsed as datetime");



    let padLeft = (str, size, char) => {
        let ret = str;
        while (ret.length < size) {
            ret = char + ret;
        }
        return ret;
    }

    let st = new SQLStatement("CREATE TABLE date_tests(dates DATE)");
    st.run();
    console.log(readTableDefinition(SKSQL.instance.getTable("date_tests").data));
    let inserts = new SQLStatement("INSERT INTO date_tests(dates) VALUES(@date)");
    for (let i = 0; i < 10; i++) {
        let y = 1920 + parseInt(""+ (Math.random()*100) );
        let m = 1 + parseInt("" + (Math.random() * 11) );
        let d = 1 + parseInt("" + (Math.random() * 30) );
        inserts.setParameter("@date", padLeft(y.toString(), 4, "0") + "-" + padLeft(m.toString(), 2, "0") + "-" + padLeft(d.toString(), 2, "0"));
        inserts.run();
    }
    console.log(dumpTable(SKSQL.instance.getTable("date_tests")));
    let sort = new SQLStatement("SELECT TOP(4) dates FROM date_tests ORDER BY dates DESC");
    let result = sort.run();
    console.log(dumpTable(SKSQL.instance.getTable(result[0].resultTableName)));
    //console.log(readTableAsJSON(result[0].resultTableName));

    let stTimes = new SQLStatement("CREATE TABLE time_tests(times TIME)");
    stTimes.run();
    console.log(readTableDefinition(SKSQL.instance.getTable("time_tests").data));
    let timesInserts = new SQLStatement("INSERT INTO time_tests(times) VALUES(@time)");
    timesInserts.setParameter("@time", "12:05:50");
    timesInserts.run();
    timesInserts.setParameter("@time", "04:50");
    timesInserts.run();
    timesInserts.setParameter("@time", "10:30:00");
    timesInserts.run();
    console.log(dumpTable(SKSQL.instance.getTable("time_tests")));

    {
        let sql = "SELECT times FROM time_tests ORDER BY times ASC"
        console.log("TESTING " + sql);
        let stTest = new SQLStatement(sql);
        let ret = stTest.run();
        console.log(readTableDefinition(SKSQL.instance.getTable(ret[0].resultTableName).data));
        console.log(dumpTable(SKSQL.instance.getTable(ret[0].resultTableName)));
        stTest.close();
    }

    {
        let sql = "SELECT times FROM time_tests WHERE times > '10:00:00'";
        console.log("TESTING " + sql);
        let stTest = new SQLStatement(sql);
        let ret = stTest.run();
        console.log(readTableDefinition(SKSQL.instance.getTable(ret[0].resultTableName).data));
        console.log(dumpTable(SKSQL.instance.getTable(ret[0].resultTableName)));
        stTest.close();
    }






}