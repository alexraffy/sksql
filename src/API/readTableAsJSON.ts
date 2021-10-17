import {DBData} from "./DBInit";
import {readTableDefinition} from "../Table/readTableDefinition";
import {readFirst} from "../Cursor/readFirst";
import {cursorEOF} from "../Cursor/cursorEOF";
import {readNext} from "../Cursor/readNext";
import {readValue} from "../BlockIO/readValue";


export function readTableAsJSON(table: string): any[] {
    let ret: any[] = [];
    let tbl = DBData.instance.getTable(table);
    if (tbl === undefined) { return ret; }
    let def = readTableDefinition(tbl.data);
    let cursor = readFirst(tbl, def);
    while (!cursorEOF(cursor)) {
        let row = {};
        let dv = new DataView(tbl.data.blocks[cursor.blockIndex], cursor.offset +5, cursor.rowLength);
        for (let i = 0; i < def.columns.length; i++) {
            let val = readValue(tbl, def, def.columns[i], dv, 0);
            row[def.columns[i].name] = val;
        }
        ret.push(row);
        cursor = readNext(tbl, def, cursor);
    }
    return ret;
}