import {TQueryExpression} from "../Query/Types/TQueryExpression";
import {TQueryFunctionCall} from "../Query/Types/TQueryFunctionCall";
import {TVariable} from "../Query/Types/TVariable";
import {TBoolValue} from "../Query/Types/TBoolValue";
import {TColumn} from "../Query/Types/TColumn";
import {TString} from "../Query/Types/TString";
import {TLiteral} from "../Query/Types/TLiteral";
import {TNumber} from "../Query/Types/TNumber";
import {instanceOfTVariable} from "../Query/Guards/instanceOfTVariable";
import {instanceOfTString} from "../Query/Guards/instanceOfTString";
import {instanceOfTNumber} from "../Query/Guards/instanceOfTNumber";
import {instanceOfTLiteral} from "../Query/Guards/instanceOfTLiteral";
import {instanceOfTColumn} from "../Query/Guards/instanceOfTColumn";
import {instanceOfTQueryExpression} from "../Query/Guards/instanceOfTQueryExpression";
import {kQueryExpressionOp} from "../Query/Enums/kQueryExpressionOp";
import {TTableWalkInfo} from "./TTableWalkInfo";
import {instanceOfTQueryColumn} from "../Query/Guards/instanceOfTQueryColumn";
import {TQueryColumn} from "../Query/Types/TQueryColumn";
import {findTableNameForColumn} from "./findTableNameForColumn";
import {readValue} from "../BlockIO/readValue";
import {TNull} from "../Query/Types/TNull";
import {instanceOfTNull} from "../Query/Guards/instanceOfTNull";
import {numeric} from "../Numeric/numeric";
import {numericLoad} from "../Numeric/numericLoad";
import {TableColumn} from "../Table/TableColumn";
import {TableColumnType} from "../Table/TableColumnType";
import {numericAdd} from "../Numeric/numericAdd";
import {isNumeric} from "../Numeric/isNumeric";
import {numericSub} from "../Numeric/numericSub";
import {instanceOfTNumeric} from "../Query/Guards/instanceOfTNumeric";
import {numericFromNumber} from "../Numeric/numericFromNumber";
import {TDate} from "../Query/Types/TDate";
import {instanceOfTDate} from "../Query/Guards/instanceOfTDate";


export function evaluate(struct: string | number | bigint | boolean | TQueryExpression | TQueryFunctionCall | TNull | TQueryColumn | TVariable | TBoolValue | TColumn | TDate | TString |  TLiteral | TNumber,
        parameters: {name: string, value: any}[],
        tables: TTableWalkInfo[],
        colDef: TableColumn): string | number | boolean | bigint | numeric | TDate {

    if (instanceOfTNull(struct)) {
        return undefined;
    }
    if (instanceOfTDate(struct)) {
        return struct;
    }
    if (instanceOfTVariable(struct)) {
        // look up the parameter
        let exists = parameters.find((p) => { return p.name === struct.name;});
        if (!exists) {
            throw "Parameter " + struct.name + " expected";
        }
        if (colDef !== undefined) {
            if (colDef.type === TableColumnType.numeric) {
                if (typeof exists.value === "string") {
                    return numericLoad(exists.value);
                } if (typeof exists.value === "number") {
                    return numericFromNumber(exists.value);
                }
            }
        }
        return exists.value;
    }

    if (instanceOfTString(struct)) {
        if (colDef !== undefined) {
            if (colDef.type === TableColumnType.numeric) {
                return numericLoad(struct.value.substr(1, struct.value.length - 2));
            }
        }
        return struct.value.substr(1, struct.value.length - 2);
    }
    if (instanceOfTNumber(struct)) {
        if (struct.value[0] === "'" || (struct.value[0] === '"')) {
            return numericLoad(struct.value.substr(1, struct.value.length - 2));
        }
        return numericLoad(struct.value);
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
            let tablesMatch = findTableNameForColumn(name, tables);
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
        let tableInfo = tables.find((t) => { return t.name.toUpperCase() === table.toUpperCase() });
        let columnDef = tableInfo.def.columns.find((c) => { return c.name.toUpperCase() === name.toUpperCase();});
        if (columnDef === undefined) {
            throw "Unknown column " + name + ". Could not find column definition in table " + table;
        }
        let dv = new DataView(tableInfo.table.data.blocks[tableInfo.cursor.blockIndex], tableInfo.cursor.offset, tableInfo.rowLength);
        let val = readValue(tableInfo.table, tableInfo.def, columnDef, dv);

        return val;
    }
    if (instanceOfTQueryColumn(struct)) {
        return evaluate(struct.expression, parameters, tables, colDef);
    }
    if (instanceOfTQueryExpression(struct)) {
        let left = evaluate(struct.value.left, parameters, tables, undefined);
        let right = evaluate(struct.value.right, parameters, tables, undefined);
        let op = struct.value.op;
        if (typeof left !== typeof right) {
            throw "Incompatible types between " + left + " and " + right;
        }
        if (isNumeric(left) && isNumeric(right)) {
            switch (op) {
                case kQueryExpressionOp.add:
                    return numericAdd(left, right);
                case kQueryExpressionOp.minus:
                    return numericSub(left, right);
            }
        }
        if (instanceOfTNumeric(left) && instanceOfTNumeric(right)) {
            switch (op) {
                case kQueryExpressionOp.add:
                    return numericAdd(left.value, right.value);
                case kQueryExpressionOp.minus:
                    return numericSub(left.value, right.value);
            }
        }

        if (typeof left === "number" && typeof right === "number") {
            switch (op) {
                case kQueryExpressionOp.add:
                    return left + right;
                case kQueryExpressionOp.minus:
                    return left - right;
                case kQueryExpressionOp.mul:
                    return left * right;
                case kQueryExpressionOp.div:
                    return left / right;
            }
        }
        if (typeof left === "string" && typeof right === "string") {
            if (op !== kQueryExpressionOp.add) {
                throw "Incorrect operation between two strings.";
            }
            return left + right;
        }
        if (typeof left === "boolean" && typeof right === "boolean") {
            return left && right;
        }
    }
}