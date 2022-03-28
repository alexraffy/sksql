import {SQLStatement, readTableAsJSON, SKSQL} from "sksql";
import * as assert from "assert";


export function test_worker(db: SKSQL, next:()=>void) {
    console.log("TESTING WORKER...");

    db.updateWorkerDB(0);
    let st = new SQLStatement(db, "CREATE TABLE keyValues(ID VARCHAR(255), VALUE VARCHAR(255) )");
    st.run();
    let inserts = new SQLStatement(db, "INSERT INTO keyValues(ID, VALUE) VALUES(@name, @value)");
    inserts.setParameter("@name", "user_id");
    inserts.setParameter("@value", '1544');
    inserts.run();
    //console.log(readTableAsJSON(db, "keyValues"));
    let select = new SQLStatement(db, "SELECT ID, VALUE FROM keyValues WHERE ID = @id");
    select.setParameter("@id", "user_id");
    select.runOnWebWorker().then((resultTableName) => {
        let result = readTableAsJSON(db, resultTableName);
        assert(result !== undefined && result[0]["ID"] === "user_id" && result[0]["VALUE"] === "1544", "WebWorker test1 failed.");
        next();
    }).catch((e) => {
        console.log("Error ", e);
    })



}