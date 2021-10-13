import {TQueryExpression} from "../Query/Types/TQueryExpression";
import {TQueryComparison} from "../Query/Types/TQueryComparison";
import {TQueryComparisonExpression} from "../Query/Types/TQueryComparisonExpression";
import {TQueryFunctionCall} from "../Query/Types/TQueryFunctionCall";
import {instanceOfTNumber} from "../Query/Guards/instanceOfTNumber";
import {instanceOfTString} from "../Query/Guards/instanceOfTString";
import {instanceOfTLiteral} from "../Query/Guards/instanceOfTLiteral";
import {instanceOfTColumn} from "../Query/Guards/instanceOfTColumn";
import {TColumn} from "../Query/Types/TColumn";
import {TString} from "../Query/Types/TString";
import {TLiteral} from "../Query/Types/TLiteral";
import {TNumber} from "../Query/Types/TNumber";
import {TBoolValue} from "../Query/Types/TBoolValue";
import {instanceOfTBoolValue} from "../Query/Guards/instanceOfTBoolValue";
import {instanceOfTQueryFunctionCall} from "../Query/Guards/instanceOfTQueryFunctionCall";
import {instanceOfTQueryExpression} from "../Query/Guards/instanceOfTQueryExpression";
import {kQueryExpressionOp} from "../Query/Enums/kQueryExpressionOp";
import {instanceOfTQueryComparison} from "../Query/Guards/instanceOfTQueryComparison";
import {TQueryColumn} from "../Query/Types/TQueryColumn";
import {instanceOfTQueryColumn} from "../Query/Guards/instanceOfTQueryColumn";
import {instanceOfTQueryComparisonExpression} from "../Query/Guards/instanceOfTQueryComparisonExpression";
import {TNull} from "../Query/Types/TNull";
import {instanceOfTNull} from "../Query/Guards/instanceOfTNull";


export function serializeTQuery(a: TQueryExpression | TQueryComparison | TQueryComparisonExpression | TQueryFunctionCall | TNull | TColumn | TQueryColumn | TString | TLiteral | TNumber | TBoolValue | string): string {
    if (instanceOfTNumber(a)) {
        return a.value;
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
    if (instanceOfTColumn(a)) {
        return `[${a.table}].[${a.column}]`;
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
        if (a.alias) {
            str += " AS " + serializeTQuery(a.alias.alias);
        }
        return str;
    }

    if (instanceOfTQueryComparison(a)) {
        let str = serializeTQuery(a.left);
        str += " " + ((a.comp.negative === true) ? " NOT " : "") +  a.comp.value + " ";
        str += serializeTQuery(a.right);
        return str;
    }
    if (instanceOfTQueryComparisonExpression(a)) {
        let str = serializeTQuery(a.a);
        str += " " + (a.bool) + " ";
        str += serializeTQuery(a.b);
        return str;
    }

    if (typeof a === "string") {
        return a as string;
    }

}