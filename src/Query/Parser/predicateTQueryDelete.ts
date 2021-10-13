import {str} from "../../BaseParser/Predicates/str";
import {whitespace} from "../../BaseParser/Predicates/whitespace";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {predicateTTableName} from "./predicateTTableName";
import {TQueryTable} from "../Types/TQueryTable";
import {kQueryJoin} from "../Enums/kQueryJoin";
import {TQueryComparisonExpression} from "../Types/TQueryComparisonExpression";
import {TQueryComparison} from "../Types/TQueryComparison";
import {predicateTQueryComparisonExpression} from "./predicateTQueryComparisonExpression";
import {predicateTNumber} from "./predicateTNumber";
import {TNumber} from "../Types/TNumber";
import {TQueryExpression} from "../Types/TQueryExpression";
import {TQueryFunctionCall} from "../Types/TQueryFunctionCall";
import {TVariable} from "../Types/TVariable";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {predicateTQueryExpression} from "./predicateTQueryExpression";
import {predicateTQueryFunctionCall} from "./predicateTQueryFunctionCall";
import {predicateTVariable} from "./predicateTVariable";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TQueryDelete} from "../Types/TQueryDelete";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";

/*
    tries to parse a delete statement
    DELETE [TOP(X)] FROM {TABLENAME} [WHERE CLAUSES...]
 */
export const predicateTQueryDelete = function *(callback) {
    //@ts-ignore
    if (callback as string === "isGenerator") {
        return;
    }
    yield str("DELETE");
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
            joinClauses: [],
            joinType: kQueryJoin.from
        }
    )
    yield maybe(atLeast1(whitespaceOrNewLine));
    const where = yield maybe(str("WHERE"));
    let whereClause: TQueryComparisonExpression | TQueryComparison = undefined;
    if (where === "WHERE") {
        yield atLeast1(whitespaceOrNewLine);
        whereClause = yield predicateTQueryComparisonExpression;
    }
    yield maybe(str(";"));

    yield returnPred(
        {
            kind: "TQueryDelete",
            top: topNumber,
            tables: tables,
            where: whereClause
        } as TQueryDelete
    );

}