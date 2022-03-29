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
import {kOrder} from "../Enums/kOrder";
import {TQueryColumn} from "../Types/TQueryColumn";
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
import {TQueryOrderBy} from "../Types/TQueryOrderBy";
import {generateV4UUID} from "../../API/generateV4UUID";
import {checkSequence} from "../../BaseParser/Predicates/checkSequence";
import {literal} from "../../BaseParser/Predicates/literal";
import {TAlias} from "../Types/TAlias";
import {TValidExpressions} from "../Types/TValidExpressions";
import {checkAhead} from "../../BaseParser/Predicates/checkAhead";
import {isKeyword} from "../isKeyword";



/*
    tries to parse a SELECT statement
    SELECT [TOP(X)] (COLUMN | EXPRESSION [AS alias],...) FROM {TABLENAME},... [WHERE CLAUSE...] [ORDER BY {COLUMN} ASC | DESC]

 */
export const predicateTQuerySelect = function *(callback) {

    let parameters: TQueryColumn[] = [];
    yield maybe(atLeast1(whitespaceOrNewLine));
    const command = yield str("SELECT");
    yield atLeast1(whitespaceOrNewLine);
    const hasDistinct = yield maybe(str("DISTINCT"));
    if (hasDistinct) {
        yield atLeast1(whitespaceOrNewLine);
    }

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

    let param1: TQueryColumn = yield predicateTQueryColumn;
    parameters.push(param1);
    yield maybe(atLeast1(whitespaceOrNewLine));
    let gotMore = yield maybe(str(","));
    while (gotMore === ",") {
        yield maybe(atLeast1(whitespaceOrNewLine));
        const extraParam = yield predicateTQueryColumn;
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

    let tableNameOrSubQuery;

    let gotSubQuery = yield exitIf(checkSequence([str("("), maybe(atLeast1(whitespaceOrNewLine)), str("SELECT")]));
    if (gotSubQuery) {
        yield str("(");
        yield maybe(atLeast1(whitespaceOrNewLine));
        tableNameOrSubQuery = yield predicateTQuerySelect;
        yield maybe(atLeast1(whitespaceOrNewLine));
        yield str(")");
    } else {
        tableNameOrSubQuery = yield predicateTTableName;
    }
    yield maybe(atLeast1(whitespaceOrNewLine));
    let tableAliasSeq = yield maybe(checkSequence([str("as"), atLeast1(whitespaceOrNewLine), literal]));
    let alias = "";
    if (tableAliasSeq !== undefined) {
        alias = tableAliasSeq[2];
    }
    let aliasWithoutAS = yield maybe(checkAhead([literal], ""));
    if (aliasWithoutAS !== undefined) {
        if (!isKeyword(aliasWithoutAS)) {
            aliasWithoutAS = yield literal;
            alias = aliasWithoutAS;
        }
    }

    let tables: TQueryTable[] = [];
    tables.push(
        {
            kind: "TQueryTable",
            tableName: {
                kind: "TAlias",
                name: tableNameOrSubQuery,
                alias: alias
            },
            joinTarget: undefined,
            joinClauses: undefined,
            joinType: kQueryJoin.from
        }
    )
    yield maybe(atLeast1(whitespaceOrNewLine));

    let hasMoreTables = yield maybe(oneOf([str(","), str("LEFT JOIN"), str("RIGHT JOIN"), str("JOIN")], ""));
    while (hasMoreTables !== undefined) {
        yield maybe(atLeast1(whitespaceOrNewLine));
        let joinTableName;
        let gotSubQuery = yield exitIf(checkSequence([str("("), maybe(atLeast1(whitespaceOrNewLine)), str("SELECT")]));
        if (gotSubQuery) {
            yield str("(");
            yield maybe(atLeast1(whitespaceOrNewLine));
            joinTableName = yield predicateTQuerySelect;
            yield maybe(atLeast1(whitespaceOrNewLine));
            yield str(")");
        } else {
            joinTableName = yield predicateTTableName;
        }
        yield maybe(atLeast1(whitespaceOrNewLine));

        let tableAliasSeq = yield maybe(checkSequence([str("as"), atLeast1(whitespaceOrNewLine), literal]));
        let alias = joinTableName;
        if (tableAliasSeq !== undefined) {
            alias = tableAliasSeq[2];
        }
        yield maybe(atLeast1(whitespaceOrNewLine));
        let hasOnClause = yield maybe(str("ON"));
        let joinClause = undefined;
        if (hasOnClause === "ON") {
            yield maybe(atLeast1(whitespaceOrNewLine));
            joinClause = yield predicateTQueryExpression; //oneOf([predicateTWhereClause, predicateTQueryComparisonExpression, predicateTQueryComparison], "a comparison expression");
        }

        let as: TAlias = {
            kind: "TAlias",
            name: joinTableName,
            alias: alias
        }
        let tbl : TQueryTable = {
            kind: "TQueryTable",
            tableName: as,
            joinType: kQueryJoin.left,
            joinTarget: undefined,
            joinClauses: joinClause
        }
        tables.push(tbl);
        yield maybe(atLeast1(whitespaceOrNewLine));
        hasMoreTables = yield maybe(oneOf([str(","), str("LEFT JOIN"), str("RIGHT JOIN"), str("JOIN")], ""));
    }

    const where = yield maybe(str("WHERE"));
    let whereClause: TQueryExpression | TValidExpressions;
    if (where !== undefined && where.toUpperCase() === "WHERE") {
        yield atLeast1(whitespaceOrNewLine);
        whereClause = yield predicateTQueryExpression;
    }
    yield maybe(atLeast1(whitespaceOrNewLine));

    const groupBy = yield maybe(str("GROUP BY"));
    let groupByClauses: TQueryOrderBy[] = [];
    let havingClause: TQueryExpression | TValidExpressions;
    if (groupBy !== undefined && groupBy.toUpperCase() === "GROUP BY") {
        yield atLeast1(whitespaceOrNewLine);
        let gotMoreGroups = ",";
        while (gotMoreGroups === ",") {
            yield maybe(atLeast1(whitespaceOrNewLine));
            let groupByClause = yield predicateTQueryColumn; // oneOf([predicateTColumn, predicateTLiteral], "");
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
            havingClause = yield predicateTQueryExpression;
        }
    }

    yield maybe(atLeast1(whitespaceOrNewLine));
    const orderBy = yield maybe(checkSequence([str("ORDER"), atLeast1(whitespaceOrNewLine), str("BY")]));
    let orderByClauses: TQueryOrderBy[] = [];
    if (orderBy !== undefined && orderBy[0].toUpperCase() === "ORDER") {
        yield atLeast1(whitespaceOrNewLine);
        let gotMoreOrderByClauses = ",";
        while (gotMoreOrderByClauses === ",") {
            yield maybe(atLeast1(whitespaceOrNewLine));
            let orderByClause = yield predicateTQueryColumn; //oneOf([predicateTColumn, predicateTLiteral], "");


            yield maybe(atLeast1(whitespaceOrNewLine));
            let orderBySort = yield maybe(oneOf([str("ASC"), str("DESC")], "ASC or DESC"));
            if (orderBySort === undefined) {
                orderBySort = "ASC";
            }
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
            having: havingClause,
            resultTableName: "#" + generateV4UUID()
        } as TQuerySelect
    );
}