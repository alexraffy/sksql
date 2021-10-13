import {DBData} from "../API/DBInit";
import {readTableDefinition} from "./readTableDefinition";


export function tableWithName(name: string) {
    let at = DBData.instance.allTables;
    for (let i = 0; i < at.length; i++) {
        let def = readTableDefinition(at[i].data);
        if (def.name === name) {
            return at[i];
        }
    }
    return undefined;
}