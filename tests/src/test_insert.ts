
import {SQLStatement, dumpTable, kResultType, SKSQL, SQLResult} from "sksql";


export function test_insert(db: SKSQL) {
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

    let st2 = new SQLStatement(db, "SELECT name, country FROM pirates WHERE country IN ('Wales', 'Ireland')");
    let result = st2.run(kResultType.JSON);
    console.log(result);

}