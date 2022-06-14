import {TQueryExpression} from "../Query/Types/TQueryExpression";
import {instanceOfTNumber} from "../Query/Guards/instanceOfTNumber";
import {instanceOfTString} from "../Query/Guards/instanceOfTString";
import {instanceOfTLiteral} from "../Query/Guards/instanceOfTLiteral";
import {instanceOfTColumn} from "../Query/Guards/instanceOfTColumn";
import {instanceOfTBoolValue} from "../Query/Guards/instanceOfTBoolValue";
import {instanceOfTQueryFunctionCall} from "../Query/Guards/instanceOfTQueryFunctionCall";
import {instanceOfTQueryExpression} from "../Query/Guards/instanceOfTQueryExpression";
import {instanceOfTQueryColumn} from "../Query/Guards/instanceOfTQueryColumn";
import {instanceOfTNull} from "../Query/Guards/instanceOfTNull";
import {instanceOfTArray} from "../Query/Guards/instanceOfTArray";
import {instanceOfTDate} from "../Query/Guards/instanceOfTDate";
import {padLeft} from "../Date/padLeft";
import {TVariable} from "../Query/Types/TVariable";
import {numeric} from "../Numeric/numeric";
import {isNumeric} from "../Numeric/isNumeric";
import {numericDisplay} from "../Numeric/numericDisplay";
import {instanceOfTVariable} from "../Query/Guards/instanceOfTVariable";
import {TValidExpressions} from "../Query/Types/TValidExpressions";
import {TQueryColumn} from "../Query/Types/TQueryColumn";
import {instanceOfTQuerySelect} from "../Query/Guards/instanceOfTQuerySelect";
import {instanceOfTAlias} from "../Query/Guards/instanceOfTAlias";
import {TAlias} from "../Query/Types/TAlias";
import {TLiteral} from "../Query/Types/TLiteral";
import {TTable} from "../Query/Types/TTable";
import {TQuerySelect} from "../Query/Types/TQuerySelect";
import {instanceOfTTable} from "../Query/Guards/instanceOfTTable";
import {kQueryJoin} from "../Query/Enums/kQueryJoin";
import {kOrder} from "../Query/Enums/kOrder";
import {kUnionType} from "../Query/Enums/kUnionType";
import {TQueryUpdate} from "../Query/Types/TQueryUpdate";


// serialize an AST structure

export function serializeTQuery(a: TQueryExpression | TValidExpressions | TQuerySelect | TQueryUpdate | TQueryColumn | TAlias | TLiteral | TTable | numeric | string): string {
    if (instanceOfTNumber(a)) {
        return a.value;
    }
    if (instanceOfTAlias(a)) {
        let str = serializeTQuery(a.name);
        if (a.alias !== undefined && a.alias !== "") {
            str += " AS " + serializeTQuery(a.alias);
        }
        return str;
    }
    if (instanceOfTTable(a)) {
        return serializeTQuery(a.table);
    }
    if (instanceOfTString(a)) {
        return a.value;
    }

    if (instanceOfTLiteral(a)) {
        return a.value;
    }
    if (instanceOfTNull(a)) {
        return "null";
    }
    if (isNumeric(a)) {
        return numericDisplay(a);
    }
    if (instanceOfTVariable(a)) {
        return (a as TVariable).name;
    }
    if (instanceOfTArray(a)) {
        let str = "(";
        for (let i = 0; i < a.array.length; i++) {
            // @ts-ignore
            str += serializeTQuery(a.array[i]);
            if (i < a.array.length -1) {
                str += ",";
            }
        }
        str += ")";
        return str;
    }
    if (instanceOfTDate(a)) {
        return a.year + "-" + padLeft(a.month, 2, "0") + "-" + padLeft(a.day, 2, "0");
    }
    if (instanceOfTColumn(a)) {
        if (a.table !== undefined && a.table !== "") {
            return `[${a.table}].[${a.column}]`;
        } else {
            return `[${a.column}]`;
        }
    }
    if (instanceOfTBoolValue(a)) {
        return (a.value === true) ? "true" : "false";
    }
    if (instanceOfTQueryFunctionCall(a)) {
        let str = a.value.name + "(";
        for (let i = 0; i < a.value.parameters.length; i++) {
            str += serializeTQuery(a.value.parameters[i]);
            if (i < a.value.parameters.length -1) {
                str += ",";
            }
        }
        str += ")";
        return str;
    }
    if (instanceOfTQueryExpression(a)) {
        let str = serializeTQuery(a.value.left);
        str += " " + a.value.op + " ";
        str += serializeTQuery(a.value.right);
        return str;
    }

    if (instanceOfTQueryColumn(a)) {
        let str = serializeTQuery(a.expression);
        //if (a.alias) {
        //    str += " AS " + serializeTQuery(a.alias.alias);
        //}
        return str;
    }

    if (instanceOfTQuerySelect(a)) {
        let str = "SELECT";
        if (a.top) {
            str += " TOP(" + serializeTQuery(a.top) + ")";
        }
        for (let i = 0; i < a.columns.length; i++) {
            str += " " + serializeTQuery(a.columns[i].expression);
            if (a.columns[i].alias !== undefined) {
                str += " AS " + serializeTQuery(a.columns[i].alias);
            }
            str += " " + (i === a.columns.length - 1) ? "" : ",";
        }
        str += " FROM " + serializeTQuery(a.tables[0].tableName);
        for (let i = 1; i < a.tables.length; i++) {
            if (a.tables[i].joinType === kQueryJoin.left) {
                str += " LEFT JOIN ";
            } else if (a.tables[i].joinType === kQueryJoin.right) {
                str += " RIGHT JOIN ";
            } else if (a.tables[i].joinType === kQueryJoin.cross) {
                str += " CROSS JOIN ";
            } else if (a.tables[i].joinType === kQueryJoin.full) {
                str += " FULL JOIN ";
            } else if (a.tables[i].joinType === kQueryJoin.inner) {
                str += " INNER JOIN ";
            }
            str += serializeTQuery(a.tables[i].tableName);
            if (a.tables[i].joinTarget !== undefined) {
                str += " AS " + serializeTQuery(a.tables[i].joinTarget);
            }
            if (a.tables[i].joinClauses !== undefined) {
                str += " " + serializeTQuery(a.tables[i].joinClauses);
            }
        }
        if (a.where !== undefined) {
            str += " WHERE " + serializeTQuery(a.where);
        }
        if (a.groupBy !== undefined && a.groupBy.length > 0) {
            str += " GROUP BY ";
            for (let i = 0; i < a.groupBy.length; i++) {
                str += " " + serializeTQuery(a.groupBy[i].column) + (i === a.groupBy.length - 1) ? "" : ",";
            }
        }
        if (a.having !== undefined) {
            str += " HAVING " + serializeTQuery(a.having);
        }
        if (a.orderBy !== undefined && a.orderBy.length > 0) {
            for (let i = 0; i < a.orderBy.length; i++) {
                str += " " + serializeTQuery(a.orderBy[i].column) + " " + ((a.orderBy[i].order === kOrder.asc) ? "ASC" : "DESC") + (i === a.orderBy.length - 1) ? "" : ",";
            }
        }
        if (a.offset !== undefined) {
            str += " OFFSET " + serializeTQuery(a.offset);
        }
        if (a.fetch !== undefined) {
            str += " FETCH " + serializeTQuery(a.fetch) + " ROWS"
        }
        if (a.unionType !== kUnionType.none) {
            switch (a.unionType) {
                case kUnionType.union:
                    str += " UNION ";
                    break;
                case kUnionType.unionAll:
                    str += " UNION ALL ";
                    break;
                case kUnionType.intersect:
                    str += " INTERSECT ";
                    break;
                case kUnionType.except:
                    str += " EXCEPT ";
                    break;
            }
            if (a.subSet !== undefined) {
                str += serializeTQuery(a.subSet);
            }
        }
        return str;
    }

    if (typeof a === "string") {
        return a as string;
    }

}