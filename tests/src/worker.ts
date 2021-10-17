import {SQLStatement, readTableAsJSON} from "sksql";



export function test_worker() {

    let st = new SQLStatement("CREATE TABLE keyValues(ID VARCHAR(255), VALUE VARCHAR(255) )");
    st.run();
    let inserts = new SQLStatement("INSERT INTO keyValues(ID, VALUE) VALUES(@name, @value)");
    inserts.setParameter("@name", "user_id");
    inserts.setParameter("@value", '1544');
    inserts.run();
    console.log(readTableAsJSON("keyValues"));
    let select = new SQLStatement("SELECT ID, VALUE FROM keyValues WHERE ID = @id");
    select.setParameter("@id", "user_id");
    select.runOnWebWorker().then((resultTableName) => {
        console.log(readTableAsJSON(resultTableName));
    })


}