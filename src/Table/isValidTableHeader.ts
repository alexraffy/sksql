import {readStringFromUtf8Array} from "../BlockIO/readStringFromUtf8Array";
import {offs} from "../Blocks/kBlockHeaderField";


export function isValidTableHeader(dv: DataView) {
    if (dv.byteLength < 30) {
        return false;
    }
    let magix = readStringFromUtf8Array(dv, offs().TableDefMagic, 4);
    if (magix.toUpperCase() !== "TSDB") {
        return false;
    }
    return true;
}