import {TQueryAnyType} from "../Query/Types/TQueryAnyType";
import {ITableDefinition} from "../Table/ITableDefinition";
import {instanceOfTVariable} from "../Query/Guards/instanceOfTVariable";
import {instanceOfTString} from "../Query/Guards/instanceOfTString";
import {instanceOfTNumber} from "../Query/Guards/instanceOfTNumber";
import {instanceOfTLiteral} from "../Query/Guards/instanceOfTLiteral";
import {instanceOfTColumn} from "../Query/Guards/instanceOfTColumn";
import {TColumn} from "../Query/Types/TColumn";
import {findTableNameForColumn} from "./findTableNameForColumn";
import {readValue} from "../BlockIO/readValue";
import {instanceOfTQueryColumn} from "../Query/Guards/instanceOfTQueryColumn";
import {instanceOfTQueryExpression} from "../Query/Guards/instanceOfTQueryExpression";
import {kQueryExpressionOp} from "../Query/Enums/kQueryExpressionOp";
import {ITable} from "../Table/ITable";
import {TVariable} from "../Query/Types/TVariable";
import {instanceOfTNull} from "../Query/Guards/instanceOfTNull";
import {TableColumn} from "../Table/TableColumn";


export function evaluateWithRow(struct: TQueryAnyType, table: ITable, def: ITableDefinition, colDef: TableColumn, fullRow: DataView, offset: number = 5) {
    if (instanceOfTVariable(struct)) {
        // look up the parameter
        throw "Parameter " + (struct as TVariable).name + " expected";
    }

    if (instanceOfTNull(struct)) {
        return undefined;
    }

    if (instanceOfTString(struct)) {
        return struct.value.substr(1, struct.value.length - 2);
    }
    if (instanceOfTNumber(struct)) {
        if (struct.value.indexOf(".")) {
            return parseFloat(struct.value);
        }
        return parseInt(struct.value);
    }
    if (instanceOfTLiteral(struct) || instanceOfTColumn(struct)) {
        let name = "";
        let tablename = "";
        if (instanceOfTLiteral(struct)) {
            name = struct.value;
        } else if (instanceOfTColumn(struct)) {
            name = (struct as TColumn).column;
            tablename = struct.table
        }
        // look up the column
        let columnDef = def.columns.find((c) => { return c.name.toUpperCase() === name.toUpperCase();});
        if (columnDef === undefined) {
            throw "Unknown column " + name + ". Could not find column definition in table " + table;
        }
        let val = readValue(table, def, columnDef, fullRow, offset);

        return val;
    }
    if (instanceOfTQueryColumn(struct)) {
        return evaluateWithRow(struct.expression, table, def, colDef, fullRow, offset);
    }
    if (instanceOfTQueryExpression(struct)) {
        let left = evaluateWithRow(struct.value.left, table, def, colDef, fullRow, offset);
        let right = evaluateWithRow(struct.value.right, table, def, colDef, fullRow, offset);
        let op = struct.value.op;
        if (typeof left !== typeof right) {
            throw "Incompatible types between " + left + " and " + right;
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