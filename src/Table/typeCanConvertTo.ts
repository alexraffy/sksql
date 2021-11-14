import {TableColumnType} from "./TableColumnType";
import {columnTypeIsInteger} from "./columnTypeIsInteger";
import {columnTypeIsString} from "./columnTypeIsString";
import {numeric} from "../Numeric/numeric";
import {TDate} from "../Query/Types/TDate";
import {isNumeric} from "../Numeric/isNumeric";
import {numericIsInfinite} from "../Numeric/numericIsInfinite";
import {numericIsNaN} from "../Numeric/numericIsNaN";
import {numericLoad} from "../Numeric/numericLoad";
import {parseDateString} from "../Date/parseDateString";
import {columnTypeIntegerCanStore} from "./columnTypeIntegerCanStore";


export function typeCanConvertTo(val: string | number | numeric | boolean | TDate | bigint , type: TableColumnType, dest:TableColumnType): boolean {
    if (type === dest) {
        return true;
    }
    switch (type) {
        case TableColumnType.boolean:
        {
            if (columnTypeIsInteger(dest)) {
                return true;
            }
            if (columnTypeIsString(dest)) {
                return true;
            }
            return false;
        }
        break;
        case TableColumnType.date:
        {
            if (dest === TableColumnType.uint32) {
                return true;
            }
            if (columnTypeIsString(dest)) {
                return true;
            }
            return false;
        }
        case TableColumnType.numeric:
        {
            if (columnTypeIsInteger(dest) && isNumeric(val) && val.e === 0) {
                return true;
            }
            if (dest === TableColumnType.float) {
                return true;
            }
            if (columnTypeIsString(dest)) {
                return true;
            }
            return false;
        }
        case TableColumnType.varchar:
        {
            if (columnTypeIsInteger(dest)) {
                if (typeof val === "string") {
                    if (val.indexOf(".") > -1) {
                        try {
                            let newVal = parseFloat(val);
                            if (isNaN(newVal)) {
                                return false;
                            }
                            return true;
                        } catch (e) {
                            return false;
                        }
                    } else {
                        try {
                            let newVal = parseInt(val);
                            if (isNaN(newVal)) {
                                return false;
                            }
                            return true;
                        } catch (e) {
                            return false;
                        }
                    }
                }
                return false;
            }
            if (dest === TableColumnType.numeric && typeof val === "string") {
                try {
                    let newVal = numericLoad(val);
                    if (numericIsInfinite(newVal) || numericIsNaN(newVal)) {
                        return false;
                    }
                    return true;
                } catch (e) {
                    return false;
                }
            }
            if (dest === TableColumnType.date && typeof val === "string") {
                let newVal = parseDateString(val);
                return (newVal !== undefined);
            }
            return false;
        }
        break;
    }
    if (columnTypeIsInteger(type) && columnTypeIsInteger(dest)) {
        return columnTypeIntegerCanStore(val as number, type, dest);
    }
    return false;
}