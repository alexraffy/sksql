import {SQLStatement, readTableAsJSON, SKSQL} from "sksql";



export function test_worker(db: SKSQL) {

    let st = new SQLStatement(db, "CREATE TABLE keyValues(ID VARCHAR(255), VALUE VARCHAR(255) )");
    st.run();
    let inserts = new SQLStatement(db, "INSERT INTO keyValues(ID, VALUE) VALUES(@name, @value)");
    inserts.setParameter("@name", "user_id");
    inserts.setParameter("@value", '1544');
    inserts.run();
    console.log(readTableAsJSON(db, "keyValues"));
    let select = new SQLStatement(db, "SELECT ID, VALUE FROM keyValues WHERE ID = @id");
    select.setParameter("@id", "user_id");
    select.runOnWebWorker().then((resultTableName) => {
        console.log(readTableAsJSON(db, resultTableName));
    }).catch((e) => {
        console.log("Error ", e);
    })


}