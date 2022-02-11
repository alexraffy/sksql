import {SKSQL} from "../API/SKSQL";
import {readTableDefinition} from "./readTableDefinition";


export function tableWithName(db: SKSQL, name: string) {
    let at = db.allTables;
    for (let i = 0; i < at.length; i++) {
        let def = readTableDefinition(at[i].data);
        if (def.name === name) {
            return at[i];
        }
    }
    return undefined;
}