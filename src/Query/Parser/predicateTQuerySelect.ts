import {str} from "../../BaseParser/Predicates/str";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {whitespace} from "../../BaseParser/Predicates/whitespace";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {exitIf} from "../../BaseParser/Predicates/exitIf";
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
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {predicateTQueryComparison} from "./predicateTQueryComparison";

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
    yield maybe(atLeast1(whitespaceOrNewLine));
    const command = yield str("SELECT");
    yield atLeast1(whitespaceOrNewLine);
    const hasTop = yield maybe(str("TOP"));
    let topNumber: TQueryExpression | TQueryFunctionCall | TVariable | TNumber = undefined;
    if (hasTop) {
        yield maybe(atLeast1(whitespaceOrNewLine));
        yield str("(");
        yield maybe(atLeast1(whitespaceOrNewLine));
        topNumber = yield oneOf([predicateTQueryExpression, predicateTQueryFunctionCall, predicateTVariable, predicateTNumber], "");
        yield maybe(atLeast1(whitespaceOrNewLine));
        yield str(")");
        yield atLeast1(whitespaceOrNewLine);
    }
    yield maybe(atLeast1(whitespaceOrNewLine));

    let param1: TQueryColumn = yield oneOf([predicateTQueryColumn], "");
    parameters.push(param1);
    yield maybe(atLeast1(whitespaceOrNewLine));
    let gotMore = yield maybe(str(","));
    while (gotMore === ",") {
        yield maybe(atLeast1(whitespaceOrNewLine));
        const extraParam = yield oneOf([predicateTQueryColumn], "a list of parameters");
        parameters.push(extraParam);
        yield maybe(atLeast1(whitespaceOrNewLine));
        let reachedFROM = yield exitIf(str("FROM"));
        if (reachedFROM === "FROM") {
            break;
        }
        gotMore = yield maybe(str(","));
    }
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield str("FROM");
    yield atLeast1(whitespaceOrNewLine);
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
            joinClauses: undefined,
            joinType: kQueryJoin.from
        }
    )
    yield maybe(atLeast1(whitespaceOrNewLine));

    let hasMoreTables = yield maybe(oneOf([str(","), str("LEFT JOIN"), str("RIGHT JOIN"), str("JOIN")], ""));
    while (hasMoreTables !== undefined) {
        yield atLeast1(whitespaceOrNewLine);
        const joinTableName = yield predicateTTableName;
        yield atLeast1(whitespaceOrNewLine);
        let hasOnClause = yield maybe(str("ON"));
        let joinClause = undefined;
        if (hasOnClause === "ON") {
            yield maybe(atLeast1(whitespaceOrNewLine));
            joinClause = yield oneOf([predicateTQueryComparisonExpression, predicateTQueryComparison], "a comparison expression");
        }
        let tbl : TQueryTable = {
            kind: "TQueryTable",
            tableName: joinTableName,
            joinType: kQueryJoin.left,
            joinTarget: undefined,
            joinClauses: joinClause
        }
        tables.push(tbl);
        yield maybe(atLeast1(whitespaceOrNewLine));
        hasMoreTables = yield maybe(oneOf([str(","), str("LEFT JOIN"), str("RIGHT JOIN"), str("JOIN")], ""));
    }

    const where = yield maybe(str("WHERE"));
    let whereClause: TQueryComparisonExpression | TQueryComparison = undefined;
    if (where === "WHERE") {
        yield atLeast1(whitespaceOrNewLine);
        whereClause = yield predicateTQueryComparisonExpression;
    }
    yield maybe(atLeast1(whitespaceOrNewLine));
    const orderBy = yield maybe(str("ORDER BY"));
    let orderByClause: TColumn | TLiteral = {kind: "TLiteral", value: "ROWID"} as TLiteral;
    let orderBySort = "ASC";
    if (orderBy === "ORDER BY") {
        yield atLeast1(whitespaceOrNewLine);
        orderByClause = yield oneOf([predicateTColumn, predicateTLiteral], "");
        yield atLeast1(whitespaceOrNewLine);
        orderBySort = yield oneOf([str("ASC"), str("DESC")], "ASC or DESC")
    }
    yield maybe(str(";"));
    yield maybe(atLeast1(whitespaceOrNewLine));
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