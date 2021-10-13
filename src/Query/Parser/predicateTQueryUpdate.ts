import {str} from "../../BaseParser/Predicates/str";
import {predicateTTableName} from "./predicateTTableName";
import {whitespace} from "../../BaseParser/Predicates/whitespace";
import {predicateTColumn} from "./predicateTColumn";
import {predicateTQueryExpression} from "./predicateTQueryExpression";
import {predicateTQueryFunctionCall} from "./predicateTQueryFunctionCall";
import {predicateTBoolValue} from "./predicateTBoolValue";
import {predicateTVariable} from "./predicateTVariable";
import {predicateTString} from "./predicateTString";
import {predicateTLiteral} from "./predicateTLiteral";
import {predicateTNumber} from "./predicateTNumber";
import {TQueryComparisonExpression} from "../Types/TQueryComparisonExpression";
import {TQueryComparison} from "../Types/TQueryComparison";
import {predicateTQueryComparisonExpression} from "./predicateTQueryComparisonExpression";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TQueryUpdate} from "../Types/TQueryUpdate";
import {TColumn} from "../Types/TColumn";
import {kQueryAssignOp} from "../Enums/kQueryAssignOp";
import {TQueryExpression} from "../Types/TQueryExpression";
import {TQueryFunctionCall} from "../Types/TQueryFunctionCall";
import {TVariable} from "../Types/TVariable";
import {TBoolValue} from "../Types/TBoolValue";
import {TString} from "../Types/TString";
import {TLiteral} from "../Types/TLiteral";
import {TNumber} from "../Types/TNumber";
import {exitIf} from "../../BaseParser/Predicates/exitIf";
import {TQueryTable} from "../Types/TQueryTable";
import {kQueryJoin} from "../Enums/kQueryJoin";

/*
    tries to parse an update statement
    UPDATE [TOP(X)] SET COLUMN = VALUE, ... FROM {TABLENAME} [WHERE CLAUSE]
 */
export const predicateTQueryUpdate = function *(callback) {
    //@ts-ignore
    if (callback as string === "isGenerator") {
        return;
    }
    yield str("UPDATE");
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

    let skipTableName = yield exitIf(str("SET"));
    let tableName = undefined;
    if (!skipTableName) {
        tableName = yield maybe(predicateTTableName);
    }
    yield maybe(whitespace);
    yield str("SET");
    yield whitespace;
    let gotMore = ",";
    let assignments: {
        column: TColumn,
        operator: kQueryAssignOp,
        value: TQueryExpression | TQueryFunctionCall | TVariable | TBoolValue | TColumn | TString | TLiteral | TNumber
    }[] = [];

    while (gotMore === ",") {
        yield maybe(whitespace);
        const col = yield predicateTColumn;
        yield maybe(whitespace);
        yield str("=");
        yield maybe(whitespace);
        const expression = yield oneOf([predicateTQueryExpression, predicateTQueryFunctionCall, predicateTVariable, predicateTBoolValue, predicateTColumn, predicateTString, predicateTLiteral, predicateTNumber], "");
        yield maybe(whitespace);

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
    yield maybe(whitespace);
    let hasFrom = yield maybe(str("FROM"));
    if (hasFrom === "FROM") {
        yield whitespace;
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
                joinClauses: [],
                joinType: kQueryJoin.from
            }
        )
    }
    yield maybe(whitespace);

    let whereClause: TQueryComparisonExpression | TQueryComparison = undefined;
    const where = yield maybe(str("WHERE"));
    if (where === "WHERE") {
        yield whitespace;
        whereClause = yield predicateTQueryComparisonExpression;
    }

    yield returnPred({
        kind: "TQueryUpdate",
        table: tableName,
        top: topNumber,
        tables: tables,
        where: whereClause,
        sets: assignments,
    } as TQueryUpdate)

}