import {TQueryExpression} from "../Query/Types/TQueryExpression";
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
import {instanceOfTQueryColumn} from "../Query/Guards/instanceOfTQueryColumn";
import {TNull} from "../Query/Types/TNull";
import {instanceOfTNull} from "../Query/Guards/instanceOfTNull";
import { TArray } from "../Query/Types/TArray";
import { instanceOfTArray } from "../Query/Guards/instanceOfTArray";
import { TDate } from "../Query/Types/TDate";
import { instanceOfTDate } from "../Query/Guards/instanceOfTDate";
import { padLeft } from "../Date/padLeft";
import { TVariable } from "../Query/Types/TVariable";
import { numeric } from "../Numeric/numeric";
import {isNumeric} from "../Numeric/isNumeric";
import {numericDisplay} from "../Numeric/numericDisplay";
import {instanceOfTVariable} from "../Query/Guards/instanceOfTVariable";
import {TValidExpressions} from "../Query/Types/TValidExpressions";




export function serializeTQuery(a: TQueryExpression | TValidExpressions | numeric | string): string {
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
        if (a.alias) {
            str += " AS " + serializeTQuery(a.alias.alias);
        }
        return str;
    }


    if (typeof a === "string") {
        return a as string;
    }

}