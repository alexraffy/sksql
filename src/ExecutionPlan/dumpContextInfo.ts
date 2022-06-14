import {TExecutionContext} from "./TExecutionContext";
import {cursorEOF} from "../Cursor/cursorEOF";


export function dumpContextInfo(context: TExecutionContext, label: string) {
    let str = "CONTEXT INFO: " + label + "\n";
    str += "Cursors: \n";
    for (let i = 0; i < context.tables.length; i++) {
        let t = context.tables[i];
        str += "\tTable:" + t.name + "\tAlias: " + t.alias;
        if (t.cursor === undefined) {
            str += "\tCursor: NULL";
        } else {
            str += "\tCursor: ";
            if (cursorEOF(t.cursor)) {
                str += "EOF";
            } else {
                str += "[" + t.cursor.blockIndex + "]->" + t.cursor.offset;
            }
            str += " Size: " + t.cursor.rowLength;
        }
        str += "\n";
    }

    return str;
}