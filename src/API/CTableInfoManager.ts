import {ITableDefinition} from "../Table/ITableDefinition";
import {ITable} from "../Table/ITable";
import {SKSQL} from "./SKSQL";
import {readTableDefinition} from "../Table/readTableDefinition";


export interface TTableInfo {
    name: string;
    def: ITableDefinition;
    objectID: string;
    serverID: string;
    pointer: ITable;
    numberOfRows: number;
    numberOfBlocks: number;
    blockSize: number;
    headerSize: number;
}


// Cache Manager for table information
// Do not use directly

export class CTableInfoManager {

    private tablesInfos: TTableInfo[] = [];
    private db: SKSQL;

    constructor(db: SKSQL){
        this.db = db;
    }

    syncAll() {
        this.tablesInfos = [];
        let db = this.db.allTables;
        for (let i = 0; i < db.length; i++) {
            let def = readTableDefinition(db[i].data, true);
            this.add(db[i], def);
        }
    }

    add(t: ITable, def: ITableDefinition) {
        let header = t.data.tableDef;
        let blocks = t.data.blocks;

        let d: TTableInfo = {
            name: def.name.toUpperCase(),
            def: def,
            headerSize: header.byteLength,
            blockSize: (blocks.length > 0) ? blocks[0].byteLength : 4096,
            numberOfBlocks: blocks.length,
            numberOfRows: 0,
            objectID: "",
            pointer: t,
            serverID: ""
        };
        let idx = -1;
        for (let i = 0; i < this.tablesInfos.length; i++) {
            if (this.tablesInfos[i].name === d.name) {
                idx = i;
                break;
            }
        }
        if (idx > -1) {
            this.tablesInfos.splice(idx, 1);
        }
        this.tablesInfos.push(d);
    }


    remove(name: string) {
        let n = name.toUpperCase();
        let idx = -1;
        for (let i = 0; i < this.tablesInfos.length; i++) {
            if (this.tablesInfos[i].name === n) {
                idx = i;
                break;
            }
        }
        if (idx > -1) {
            this.tablesInfos.splice(idx, 1);
        }
    }

    get(name: string): TTableInfo {
        let n = name.toUpperCase();
        for (let i = 0; i < this.tablesInfos.length; i++) {
            if (this.tablesInfos[i].name === n) {
                return this.tablesInfos[i];
            }
        }
        return undefined;
    }

}