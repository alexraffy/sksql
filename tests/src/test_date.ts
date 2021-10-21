
import {parseDateString, SQLStatement, dumpTable, DBData, readTableDefinition, readTableAsJSON} from "sksql";
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

    let padLeft = (str, size, char) => {
        let ret = str;
        while (ret.length < size) {
            ret = char + ret;
        }
        return ret;
    }

    let st = new SQLStatement("CREATE TABLE date_tests(dates DATE)");
    st.run();
    console.log(readTableDefinition(DBData.instance.getTable("date_tests").data));
    let inserts = new SQLStatement("INSERT INTO date_tests(dates) VALUES(@date)");
    for (let i = 0; i < 10; i++) {
        let y = 1920 + parseInt(""+ (Math.random()*100) );
        let m = 1 + parseInt("" + (Math.random() * 11) );
        let d = 1 + parseInt("" + (Math.random() * 30) );
        inserts.setParameter("@date", padLeft(y.toString(), 4, "0") + "-" + padLeft(m.toString(), 2, "0") + "-" + padLeft(d.toString(), 2, "0"));
        inserts.run();
    }
    console.log(dumpTable(DBData.instance.getTable("date_tests")));
    let sort = new SQLStatement("SELECT TOP(4) dates FROM date_tests ORDER BY dates DESC");
    let result = sort.run();
    console.log(dumpTable(DBData.instance.getTable(result[0].resultTableName)));
    //console.log(readTableAsJSON(result[0].resultTableName));
}