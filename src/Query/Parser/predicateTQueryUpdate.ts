import {str} from "../../BaseParser/Predicates/str";
import {predicateTTableName} from "./predicateTTableName";
import {predicateTColumn} from "./predicateTColumn";
import {predicateTQueryExpression} from "./predicateTQueryExpression";
import {predicateTQueryFunctionCall} from "./predicateTQueryFunctionCall";
import {predicateTVariable} from "./predicateTVariable";
import {predicateTNumber} from "./predicateTNumber";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TQueryUpdate} from "../Types/TQueryUpdate";
import {TColumn} from "../Types/TColumn";
import {kQueryAssignOp} from "../Enums/kQueryAssignOp";
import {TQueryExpression} from "../Types/TQueryExpression";
import {TQueryFunctionCall} from "../Types/TQueryFunctionCall";
import {TVariable} from "../Types/TVariable";
import {TNumber} from "../Types/TNumber";
import {exitIf} from "../../BaseParser/Predicates/exitIf";
import {TQueryTable} from "../Types/TQueryTable";
import {kQueryJoin} from "../Enums/kQueryJoin";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {TValidExpressions} from "../Types/TValidExpressions";
import {predicateValidExpressions} from "./predicateValidExpressions";

/*
    tries to parse an update statement
    UPDATE [TOP(X)] SET COLUMN = VALUE, ... FROM {TABLENAME} [WHERE CLAUSE]
 */
export const predicateTQueryUpdate = function *(callback) {

    yield maybe(atLeast1(whitespaceOrNewLine));
    yield str("UPDATE");
    yield atLeast1(whitespaceOrNewLine);
    const hasTop = yield maybe(str("TOP"));
    let topNumber: TQueryExpression | TQueryFunctionCall | TVariable | TNumber = undefined;
    if (hasTop) {
        yield maybe(atLeast1(whitespaceOrNewLine));
        yield maybe(str("("));
        yield maybe(atLeast1(whitespaceOrNewLine));
        topNumber = yield oneOf([predicateTQueryExpression, predicateTQueryFunctionCall, predicateTVariable, predicateTNumber], "");
        yield maybe(atLeast1(whitespaceOrNewLine));
        yield maybe(str(")"));
        yield atLeast1(whitespaceOrNewLine);
    }
    yield maybe(atLeast1(whitespaceOrNewLine));

    let skipTableName = yield exitIf(str("SET"));
    let tableName = undefined;
    if (!skipTableName) {
        tableName = yield maybe(predicateTTableName);
    }
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield str("SET");
    yield atLeast1(whitespaceOrNewLine);
    let gotMore = ",";
    let assignments: {
        column: TColumn,
        operator: kQueryAssignOp,
        value: TQueryExpression | TValidExpressions
    }[] = [];

    while (gotMore === ",") {
        yield maybe(atLeast1(whitespaceOrNewLine));
        const col = yield predicateTColumn;
        yield maybe(atLeast1(whitespaceOrNewLine));
        yield str("=");
        yield maybe(atLeast1(whitespaceOrNewLine));
        const expression = yield oneOf([predicateTQueryExpression, predicateValidExpressions], "");
        yield maybe(atLeast1(whitespaceOrNewLine));

        assignments.push({
            column: col,
            operator: kQueryAssignOp.assign,
            value: expression
        });
        let reachedFROM = yield exitIf(str("FROM"));
        if (reachedFROM === "FROM") {
            break;
        }
        gotMore = yield maybe(str(","))
    }
    let tables: TQueryTable[] = [];
    yield maybe(atLeast1(whitespaceOrNewLine));
    let hasFrom = yield maybe(str("FROM"));
    if (hasFrom === "FROM") {
        yield atLeast1(whitespaceOrNewLine);
        const tableName = yield predicateTTableName;
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
    }
    yield maybe(atLeast1(whitespaceOrNewLine));

    let whereClause: TQueryExpression | TValidExpressions = undefined;
    const where = yield maybe(str("WHERE"));
    if (where === "WHERE") {
        yield atLeast1(whitespaceOrNewLine);
        whereClause = yield predicateTQueryExpression;
    }
    yield maybe(str(";"));
    yield maybe(atLeast1(whitespaceOrNewLine));

    yield returnPred({
        kind: "TQueryUpdate",
        table: tableName,
        top: topNumber,
        tables: tables,
        where: whereClause,
        sets: assignments,
    } as TQueryUpdate)

}