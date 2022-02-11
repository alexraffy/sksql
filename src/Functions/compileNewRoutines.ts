import {readFirst} from "../Cursor/readFirst";
import {SKSQL} from "../API/SKSQL";
import {readTableDefinition} from "../Table/readTableDefinition";
import {cursorEOF} from "../Cursor/cursorEOF";
import {readNext} from "../Cursor/readNext";
import {readValue} from "../BlockIO/readValue";
import {SQLStatement} from "../API/SQLStatement";


export function compileNewRoutines(db: SKSQL) {
    // routines definitions are 65k, we need to use a cursor
    let tblRoutines = db.getTable("routines");
    let def = readTableDefinition(tblRoutines.data);
    let cursor = readFirst(tblRoutines, def);
    let colNameDef = def.columns.find((t) => { return t.name === "name";});
    let colDefinitionDef = def.columns.find((t) => { return t.name === "definition";});
    while (!cursorEOF(cursor)) {
        let fr = new DataView(tblRoutines.data.blocks[cursor.blockIndex], cursor.offset, cursor.rowLength + 5);
        const name = readValue(tblRoutines, def, colNameDef, fr, 5) as string;
        const fnDef = readValue(tblRoutines, def, colDefinitionDef, fr, 5) as string;
        let sql = new SQLStatement(db, fnDef, false);
        sql.run();

        cursor = readNext(tblRoutines, def, cursor);
    }
}

