import {TQueryExpression} from "./Types/TQueryExpression";
import {TQueryColumn} from "./Types/TQueryColumn";
import {TBoolValue} from "./Types/TBoolValue";
import {instanceOfTVariable} from "./Guards/instanceOfTVariable";
import {instanceOfTString} from "./Guards/instanceOfTString";
import {instanceOfTNumber} from "./Guards/instanceOfTNumber";
import {instanceOfTLiteral} from "./Guards/instanceOfTLiteral";
import {instanceOfTColumn} from "./Guards/instanceOfTColumn";
import {TColumn} from "./Types/TColumn";
import {findTableNameForColumn} from "../API/findTableNameForColumn";
import {readValue} from "../BlockIO/readValue";
import {instanceOfTQueryColumn} from "./Guards/instanceOfTQueryColumn";
import {instanceOfTQueryExpression} from "./Guards/instanceOfTQueryExpression";
import {kQueryExpressionOp} from "./Enums/kQueryExpressionOp";
import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {TableColumn} from "../Table/TableColumn";
import {columnTypeIsBoolean} from "../Table/columnTypeIsBoolean";
import {TQueryAnyType} from "./Types/TQueryAnyType";
import {instanceOfTQueryInsert} from "./Guards/instanceOfTQueryInsert";
import {TQueryInsert} from "./Types/TQueryInsert";
import {TValidExpressions} from "./Types/TValidExpressions";


export function listOfColumnsUsedInExpression(struct: TQueryAnyType | TValidExpressions, tables: TTableWalkInfo[]): TColumn[] {
    let ret: TColumn[] = [];

    if (instanceOfTVariable(struct)) {
        return [];
    }

    if (instanceOfTString(struct)) {
        return [];
    }
    if (instanceOfTNumber(struct)) {
        return [];
    }
    if (instanceOfTLiteral(struct) || instanceOfTColumn(struct)) {
        let name = "";
        let table = "";
        if (instanceOfTLiteral(struct)) {
            name = struct.value;
        } else if (instanceOfTColumn(struct)) {
            name = (struct as TColumn).column;
            table = struct.table
        }
        // look up the column
        if (table === "") {
            let tablesMatch = findTableNameForColumn(name, tables, struct);
            if (tablesMatch.length !== 1) {
                if (tables.length === 0) {
                    throw "Unknown column name " + name;
                }
                if (tables.length > 1) {
                    throw "Ambiguous column name " + name;
                }
            }
            table = tablesMatch[0];
        }
        ret.push({ kind: "TColumn", column: name, table: table} as TColumn);
    }
    if (instanceOfTQueryColumn(struct)) {
        let cols = listOfColumnsUsedInExpression(struct.expression, tables);
        if (cols.length > 0) {
            ret.push(...cols);
        }
    }
    if (instanceOfTQueryExpression(struct)) {
        let left = listOfColumnsUsedInExpression(struct.value.left, tables);
        let right = listOfColumnsUsedInExpression(struct.value.right, tables);
        if (left.length > 0) {
            ret.push(...left);
        }
        if (right.length > 0) {
            ret.push(...right);
        }
    }

    if (instanceOfTQueryInsert(struct)) {
        let qi = struct as TQueryInsert;
        if (qi.hasValues) {
            for (let i = 0; i < qi.values.length; i++) {
                for (let x = 0; x < qi.values[i].values.length; x++) {
                    let cols = listOfColumnsUsedInExpression(qi.values[i].values[x], tables);
                    if (cols.length > 0) {
                        ret.push(...cols);
                    }
                }
            }
        }
        if (qi.selectStatement !== undefined) {
            let cols = listOfColumnsUsedInExpression(qi.selectStatement, tables);
            if (cols.length > 0) {
                ret.push(...cols);
            }
        }
    }

    return ret;
}