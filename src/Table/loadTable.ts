import {ITableData} from "./ITableData";
import {copyBytesToSharedBuffer} from "../BlockIO/copyBytesToSharedBuffer";
import {ITable} from "./ITable";
import {SKSQL} from "../API/SKSQL";


export function loadTable(header: ArrayBuffer, blocks: ArrayBuffer[]): ITable {
    let ret: ITable = {
        data: {
            tableDef: new SharedArrayBuffer(header.byteLength),
            blocks: []
        },
    }
    copyBytesToSharedBuffer(header, new DataView(ret.data.tableDef));
    for (let i = 0; i < blocks.length; i++) {
        let s = new SharedArrayBuffer(blocks[i].byteLength);
        copyBytesToSharedBuffer(blocks[i], new DataView(s));
        ret.data.blocks.push(s);
    }
    SKSQL.instance.allTables.push(ret);
    return ret;
}