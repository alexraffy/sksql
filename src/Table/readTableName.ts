import {ITableData} from "./ITableData";
import {ITableDefinition} from "./ITableDefinition";
import {readStringFromUtf8Array} from "../BlockIO/readStringFromUtf8Array";
import {kBlockHeaderField} from "../Blocks/kBlockHeaderField";


export function readTableName(tb: ITableData): string {
    let b = tb.tableDef;
    let dv = new DataView(b);
    return readStringFromUtf8Array(dv, kBlockHeaderField.TableDefTableName, 255);
}