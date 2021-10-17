import {oneOf} from "../../BaseParser/Predicates/oneOf";

import {maybe} from "../../BaseParser/Predicates/maybe";
import {str} from "../../BaseParser/Predicates/str";
import {whitespace} from "../../BaseParser/Predicates/whitespace";

import {returnPred} from "../../BaseParser/Predicates/ret";
import {predicateTQueryFunctionCall} from "./predicateTQueryFunctionCall";
import {predicateTQueryExpression} from "./predicateTQueryExpression";
import {predicateTString} from "./predicateTString";
import {predicateTLiteral} from "./predicateTLiteral";
import {predicateTNumber} from "./predicateTNumber";
import {TQueryColumn} from "../Types/TQueryColumn";
import {predicateTColumn} from "./predicateTColumn";
import {TColumn} from "../Types/TColumn";
import {TLiteral} from "../Types/TLiteral";
import {TQueryFunctionCall} from "../Types/TQueryFunctionCall";
import {predicateTBoolValue} from "./predicateTBoolValue";
import {predicateTVariable} from "./predicateTVariable";
import {predicateTDate} from "./predicateTDate";


/*
    tries to parse a column expression in a select statement
    EXPRESSION | FUNCTION | VARIABLE | BOOL | COLUMN | STRING | LITERAL | NUMBER
    and an optional alias
    AS STRING | LITERAL
 */
export const predicateTQueryColumn = function *(callback) {
    //@ts-ignore
    if (callback as string === "isGenerator") {
        return;
    }
    let left = yield oneOf([predicateTQueryExpression, predicateTQueryFunctionCall,  predicateTVariable, predicateTBoolValue, predicateTColumn, predicateTDate, predicateTString, predicateTLiteral, predicateTNumber], "" );
    yield maybe(whitespace);
    let as = yield maybe(str("AS "));
    let columnName = "";
    if (as === "AS ") {
        columnName = yield oneOf([predicateTLiteral, predicateTString], "");
    } else {
        switch (left.kind) {
            case "TLiteral":
                columnName = (left as TLiteral).value;
                break;
            case "TColumn":
                columnName = (((left as TColumn).table !== "") ?  ((left as TColumn).table + ".") : "") + (left as TColumn).column;
                break;
            case "TQueryFunctionCall":
                columnName = '"' + (left as TQueryFunctionCall).value.name + '"';
                break;
        }
    }
    yield returnPred(
        {
            kind: "TQueryColumn",
            alias: {kind: "TAlias", name: columnName, alias: columnName},
            expression: left
        } as TQueryColumn
    );
}