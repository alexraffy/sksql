import {ITableDefinition} from "./ITableDefinition";
import {numeric} from "../Numeric/numeric";
import {TDate} from "../Query/Types/TDate";
import {TTime} from "../Query/Types/TTime";
import {TDateTime} from "../Query/Types/TDateTime";
import {readValue} from "../BlockIO/readValue";
import {isNumeric} from "../Numeric/isNumeric";
import {numericDisplay} from "../Numeric/numericDisplay";
import {instanceOfTDate} from "../Query/Guards/instanceOfTDate";
import {padLeft} from "../Date/padLeft";
import {instanceOfTTime} from "../Query/Guards/instanceOfTTime";
import {instanceOfTDateTime} from "../Query/Guards/instanceOfTDateTime";
import {ITable} from "./ITable";

export function dumpAllColumnsInCurrentRow(dv: DataView, table: ITable, def: ITableDefinition, rowLength: number): string {
    let ret = "";

    let id = dv.getUint32(0);
    let flag = dv.getUint8(4);
    ret += id + "\t" + flag + "\t";
    for (let x = 0; x < def.columns.length; x++) {
        let type = def.columns[x].type;
        let len = def.columns[x].length;
        let coffset = def.columns[x].offset
        let value: string | number | bigint | boolean | numeric | TDate | TTime | TDateTime = readValue(table, def, def.columns[x], dv);
        if (value === undefined) {
            ret += "NULL" + "\t";
        } else if (isNumeric(value)) {
            ret += numericDisplay(value) + "\t";
        } else if (instanceOfTDate(value)) {
            ret += padLeft(value.year.toString(), 4, "0") + "-" +
                padLeft(value.month.toString(), 2, "0") + "-" +
                padLeft(value.day.toString(), 2, "0") + "\t";
        } else if (instanceOfTTime(value)) {
            ret += padLeft(value.hours.toString(), 2, "0") + ":" +
                padLeft(value.minutes.toString(), 2, "0") + ":" +
                padLeft(value.seconds.toString(), 2, "0") + "." +
                padLeft(value.millis.toString(), 3, "0") + "\t";
        } else if (instanceOfTDateTime(value)) {
            ret += padLeft(value.date.year.toString(), 4, "0") + "-" +
                padLeft(value.date.month.toString(), 2, "0") + "-" +
                padLeft(value.date.day.toString(), 2, "0") + "";
            ret += "T"
            ret += padLeft(value.time.hours.toString(), 2, "0") + ":" +
                padLeft(value.time.minutes.toString(), 2, "0") + ":" +
                padLeft(value.time.seconds.toString(), 2, "0") + "." +
                padLeft(value.time.millis.toString(), 3, "0") + "\t";
        } else {
            ret += value + "\t";
        }
    }
    return ret;

}