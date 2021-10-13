import {ITable} from "../Table/ITable";
import {readTableDefinition} from "../Table/readTableDefinition";


export class DBData {
    private static _instance:DBData;

    constructor() {
        this.allTables = [];
        DBData._instance = this;
    }
    static get instance(): DBData {
        if (DBData._instance === undefined) {
            new DBData();
        }
        return DBData._instance;
    }

    allTables: ITable[];

    tablesInfo() {
        let at = this.allTables;
        for (let i = 0; i < at.length; i++ ) {
            let tb = readTableDefinition(at[i].data);
            console.log("*****************");
            console.log("TABLE: " + tb.name);
            console.log("COLUMNS");
            for (let x = 0; x < tb.columns.length; x++) {
                console.log(`${tb.columns[x].name} ${tb.columns[x].type} ${tb.columns[x].length} ${tb.columns[x].offset}`);
            }
            console.log("BLOCKS: " + at[i].data.blocks.length);
        }
    }

    getTable(tableName: string) {
        let at = this.allTables;
        for (let i = 0; i < at.length; i++ ) {
            let tb = readTableDefinition(at[i].data);
            if (tb.name.localeCompare(tableName) === 0) {
                return at[i];
            }
        }
        return undefined;
    }




}


export function DBInit() {
    let _ = new DBData();

}