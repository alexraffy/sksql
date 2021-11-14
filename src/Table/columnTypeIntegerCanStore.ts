import {TableColumnType} from "./TableColumnType";
import {columnTypeIsSignedInteger} from "./columnTypeIsSignedInteger";
import {columnTypeIsUnsignedInteger} from "./columnTypeIsUnsignedInteger";


export function columnTypeIntegerCanStore(val: number, src: TableColumnType, dest: TableColumnType) {
    if (columnTypeIsSignedInteger(src) && columnTypeIsUnsignedInteger(dest) && val < 0) {
        return false;
    }
    if (columnTypeIsUnsignedInteger(src) && columnTypeIsUnsignedInteger(dest) && src <= dest) {
        return true;
    }
    if (columnTypeIsSignedInteger(src) && columnTypeIsSignedInteger(dest) && src <= dest) {
        return true;
    }


    if (src === TableColumnType.uint8 && ((dest === TableColumnType.int8 && val < 128) || (columnTypeIsSignedInteger(dest) && dest > TableColumnType.int8))) {
        return true;
    }

    if (src === TableColumnType.uint16 && ((dest === TableColumnType.int16 && val < 32767) || (columnTypeIsSignedInteger(dest) && dest > TableColumnType.int16))) {
        return true;
    }

    if (src === TableColumnType.uint32 && ((dest === TableColumnType.int32 && val < 2147483647) || (dest > TableColumnType.int64))) {
        return true;
    }
    if ((src === TableColumnType.int64 || src === TableColumnType.uint64) && (dest === TableColumnType.int64 || dest === TableColumnType.uint64)) {
        return true;
    }

    return true;
}