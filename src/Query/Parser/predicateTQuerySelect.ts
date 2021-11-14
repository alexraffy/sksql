import {str} from "../../BaseParser/Predicates/str";
import {maybe} from "../../BaseParser/Predicates/maybe";
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
import {TQueryOrderBy} from "../Types/TQueryOrderBy";

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
    if (where !== undefined && where.toUpperCase() === "WHERE") {
        yield atLeast1(whitespaceOrNewLine);
        whereClause = yield predicateTQueryComparisonExpression;
    }
    yield maybe(atLeast1(whitespaceOrNewLine));

    const groupBy = yield maybe(str("GROUP BY"));
    let groupByClauses: TQueryOrderBy[] = [];
    let havingClause: TQueryComparisonExpression | TQueryComparison = undefined;
    if (groupBy !== undefined && groupBy.toUpperCase() === "GROUP BY") {
        yield atLeast1(whitespaceOrNewLine);
        let gotMoreGroups = ",";
        while (gotMoreGroups === ",") {
            yield maybe(atLeast1(whitespaceOrNewLine));
            let groupByClause = yield oneOf([predicateTColumn, predicateTLiteral], "");
            yield maybe(atLeast1(whitespaceOrNewLine));
            gotMoreGroups = yield maybe(str(","));
            groupByClauses.push(
                {
                    column: groupByClause,
                    order: kOrder.asc
                } as TQueryOrderBy
            );
        }
        yield maybe(atLeast1(whitespaceOrNewLine));
        const having = yield maybe(str("HAVING"));
        if (having !== undefined && having.toUpperCase() === "HAVING") {
            yield atLeast1(whitespaceOrNewLine);
            havingClause = yield predicateTQueryComparisonExpression;
        }
    }

    yield maybe(atLeast1(whitespaceOrNewLine));
    const orderBy = yield maybe(str("ORDER BY"));
    let orderByClauses: TQueryOrderBy[] = [];
    if (orderBy !== undefined && orderBy.toUpperCase() === "ORDER BY") {
        yield atLeast1(whitespaceOrNewLine);
        let gotMoreOrderByClauses = ",";
        while (gotMoreOrderByClauses === ",") {
            yield maybe(atLeast1(whitespaceOrNewLine));
            let orderByClause = yield oneOf([predicateTColumn, predicateTLiteral], "");
            yield atLeast1(whitespaceOrNewLine);
            let orderBySort = yield oneOf([str("ASC"), str("DESC")], "ASC or DESC")
            yield maybe(atLeast1(whitespaceOrNewLine));
            gotMoreOrderByClauses = yield maybe(str(","));
            orderByClauses.push(
                {
                    column: orderByClause,
                    order: (orderBySort.toUpperCase() === "ASC") ? kOrder.asc : kOrder.desc
                }
            );
        }
    }


    yield maybe(atLeast1(whitespaceOrNewLine));
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
            orderBy: orderByClauses,
            groupBy: groupByClauses,
            having: havingClause
        } as TQuerySelect
    );
}