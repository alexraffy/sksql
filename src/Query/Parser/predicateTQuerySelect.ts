import {str} from "../../BaseParser/Predicates/str";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {whitespace} from "../../BaseParser/Predicates/whitespace";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {exitIf} from "../../BaseParser/Predicates/exitIf";
import {literal} from "../../BaseParser/Predicates/literal";
import {either} from "../../BaseParser/Predicates/either";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TQuerySelect} from "../Types/TQuerySelect";
import {kCommandType} from "../Enums/kCommandType";
import {TQueryTable} from "../Types/TQueryTable";
import {kQueryJoin} from "../Enums/kQueryJoin";
import {predicateTQueryColumn} from "./predicateTQueryColumn";
import {predicateTLiteral} from "./predicateTLiteral";
import {TQueryComparisonExpression} from "../Types/TQueryComparisonExpression";
import {TQueryComparison} from "../Types/TQueryComparison";
import {kOrder} from "../Enums/kOrder";
import {predicateTQueryComparisonExpression} from "./predicateTQueryComparisonExpression";
import {TQueryColumn} from "../Types/TQueryColumn";
import {predicateTColumn} from "./predicateTColumn";
import {TLiteral} from "../Types/TLiteral";
import {TColumn} from "../Types/TColumn";
import {predicateTTableName} from "./predicateTTableName";
import {TNumber} from "../Types/TNumber";
import {predicateTNumber} from "./predicateTNumber";
import {predicateTQueryExpression} from "./predicateTQueryExpression";
import {predicateTQueryFunctionCall} from "./predicateTQueryFunctionCall";
import {predicateTVariable} from "./predicateTVariable";
import {TQueryExpression} from "../Types/TQueryExpression";
import {TQueryFunctionCall} from "../Types/TQueryFunctionCall";
import {TVariable} from "../Types/TVariable";

/*
    tries to parse a SELECT statement
    SELECT [TOP(X)] (COLUMN | EXPRESSION [AS alias],...) FROM {TABLENAME},... [WHERE CLAUSE...] [ORDER BY {COLUMN} ASC | DESC]

 */
export const predicateTQuerySelect = function *(callback) {
    //@ts-ignore
    if (callback as string === "isGenerator") {
        return;
    }
    let parameters: TQueryColumn[] = [];
    const command = yield str("SELECT");
    yield whitespace;
    const hasTop = yield maybe(str("TOP"));
    let topNumber: TQueryExpression | TQueryFunctionCall | TVariable | TNumber = undefined;
    if (hasTop) {
        yield maybe(whitespace);
        yield str("(");
        yield maybe(whitespace);
        topNumber = yield oneOf([predicateTQueryExpression, predicateTQueryFunctionCall, predicateTVariable, predicateTNumber], "");
        yield maybe(whitespace);
        yield str(")");
        yield whitespace;
    }
    yield maybe(whitespace);

    let param1: TQueryColumn = yield oneOf([predicateTQueryColumn], "");
    parameters.push(param1);
    yield maybe(whitespace);
    let gotMore = yield maybe(str(","));
    while (gotMore === ",") {
        yield maybe(whitespace);
        const extraParam = yield oneOf([predicateTQueryColumn], "a list of parameters");
        parameters.push(extraParam);
        yield maybe(whitespace);
        let reachedFROM = yield exitIf(str("FROM"));
        if (reachedFROM === "FROM") {
            break;
        }
        gotMore = yield maybe(str(","));
    }
    yield maybe(whitespace);
    yield str("FROM");
    yield whitespace;
    const tableName = yield predicateTTableName;
    let tables: TQueryTable[] = [];
    tables.push(
        {
            kind: "TQueryTable",
            tableName: {
                kind: "TAlias",
                name: tableName,
                alias: ""
            },
            joinTarget: undefined,
            joinClauses: [],
            joinType: kQueryJoin.from
        }
    )
    yield maybe(whitespace);
    const where = yield maybe(str("WHERE"));
    let whereClause: TQueryComparisonExpression | TQueryComparison = undefined;
    if (where === "WHERE") {
        yield whitespace;
        whereClause = yield predicateTQueryComparisonExpression;
    }
    yield maybe(whitespace);
    const orderBy = yield maybe(str("ORDER BY"));
    let orderByClause: TColumn | TLiteral = {kind: "TLiteral", value: "ROWID"} as TLiteral;
    let orderBySort = "ASC";
    if (orderBy === "ORDER BY") {
        yield whitespace;
        orderByClause = yield oneOf([predicateTColumn, predicateTLiteral], "");
        yield whitespace;
        orderBySort = yield oneOf([str("ASC"), str("DESC")], "ASC or DESC")
    }
    yield maybe(str(";"));
    return returnPred(
        {
            kind: "TQuerySelect",
            command: kCommandType.select,
            top: topNumber,
            tables: tables,
            columns: parameters,
            where: whereClause,
            orderBy: [{
                column: orderByClause,
                order: (orderBySort === "ASC") ? kOrder.asc : kOrder.desc
            }]
        } as TQuerySelect
    );
}