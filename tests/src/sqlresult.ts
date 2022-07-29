
import {SQLStatement, dumpTable, numericLoad, SKSQL, TDate, numeric, numericDisplay} from "sksql";
import {checkNoTempTables, runTest} from "./runTest";
import * as assert from "assert";



interface Pirate {
    name: string,
    country: string,
    dob: TDate,
    death: TDate,
    bounty: numeric
};

export function test_sqlresult(db: SKSQL, next: ()=>void) {
    console.log("TESTING SQLResult...")

    let sqlPirates = "DROP TABLE pirates; CREATE TABLE pirates (\n" +
        "\tid uint32 IDENTITY(1,1),\n" +
        "\tname VARCHAR(255),\n" +
        "\tcountry VARCHAR(50),\n" +
        "\tdob date,\n" +
        "\tdeath date,\n" +
        "\tbounty numeric(12,0)\n" +
        ");\n" +
        "INSERT INTO pirates (name, country, dob, death, bounty) VALUES\n" +
        "('Calico Jack John Rackham', 'England', '1682-12-26', '1720-11-18', 125000),\n" +
        "('Anne Bonny', 'Ireland', '1697-03-08', '1721-04-00', 80000),\n" +
        "('Bartholomew Roberts', 'Wales', '1682-05-17', '1722-02-10', 800000),\n" +
        "('Blackbeard (Edward Teach)', 'England', '1680-00-00', '1718-11-22', 900000);";

    runTest(db, sqlPirates, false, false, undefined);
    let st = new SQLStatement(db, "SELECT name, country, dob, death, bounty FROM pirates ORDER BY name");
    let ret = st.runSync();
    let pirates = ret.getRows<Pirate>();
    let cursor = ret.getCursor();
    let str = "";
    cursor.first();
    while (!cursor.eof()) {
        if (cursor.isRowDeleted() === false) {
            str += cursor.get("name") + "\t" + cursor.get("country") + "\t" + cursor.get<TDate>("dob").year + "\t" + numericDisplay(cursor.get<numeric>("bounty")) + "\n";
        }
        cursor.next();
    }
    console.log(str);
    assert(str === "Anne Bonny\tIreland\t1697\t80000\n" +
        "Bartholomew Roberts\tWales\t1682\t800000\n" +
        "Blackbeard (Edward Teach)\tEngland\t1680\t900000\n" +
        "Calico Jack John Rackham\tEngland\t1682\t125000\n", "Cursor.get did not return the expected data.");
    st.close();
    str = "";
    for (let i = 0; i < pirates.length; i++) {
        let p = pirates[i];
        str += `The pirate ${p.name} from ${p.country}, born ${p.dob.year} died in ${p.death.year} with a bounty of ${numericDisplay(p.bounty)}\n`
    }
    console.log(str);
    assert(str === "The pirate Anne Bonny from Ireland, born 1697 died in 1721 with a bounty of 80000\n" +
        "The pirate Bartholomew Roberts from Wales, born 1682 died in 1722 with a bounty of 800000\n" +
        "The pirate Blackbeard (Edward Teach) from England, born 1680 died in 1718 with a bounty of 900000\n" +
        "The pirate Calico Jack John Rackham from England, born 1682 died in 1720 with a bounty of 125000\n", "getRows<Pirate> did not return the expected result.");



    next();

}