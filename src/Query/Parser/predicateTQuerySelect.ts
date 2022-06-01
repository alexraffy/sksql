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
import {kUnionType} from "../Enums/kUnionType";



function * predicateTypeOfJoin() {

    let join = yield maybe(oneOf(
        [
            str(","),
            checkSequence([str("JOIN"), atLeast1(whitespaceOrNewLine)]),
            checkSequence([str("INNER"), atLeast1(whitespaceOrNewLine), str("JOIN"), atLeast1(whitespaceOrNewLine)]),
            checkSequence([str("CROSS"), atLeast1(whitespaceOrNewLine), str("JOIN"), atLeast1(whitespaceOrNewLine)]),
            checkSequence([str("LEFT"), atLeast1(whitespaceOrNewLine),
                maybe(checkSequence([str("OUTER"), atLeast1(whitespaceOrNewLine)])),
                str("JOIN"), atLeast1(whitespaceOrNewLine)]),
            checkSequence([str("RIGHT"), atLeast1(whitespaceOrNewLine),
                maybe(checkSequence([str("OUTER"), atLeast1(whitespaceOrNewLine)])),
                str("JOIN"), atLeast1(whitespaceOrNewLine)]),
            checkSequence([str("FULL"), atLeast1(whitespaceOrNewLine),
                maybe(checkSequence([str("OUTER"), atLeast1(whitespaceOrNewLine)])),
                str("JOIN"), atLeast1(whitespaceOrNewLine)])
        ], ""));
    if (join === undefined) {
        yield returnPred(undefined);
        return;
    }

    if (typeof join === "string" && join === ",") {
        yield returnPred(kQueryJoin.cross);
    }
    if (join.length > 0 && join[0].toUpperCase() === "JOIN" || join[0].toUpperCase() === "INNER") {
        yield returnPred(kQueryJoin.inner);
    }
    if (join.length > 0 && join[0].toUpperCase() === "LEFT") {
        yield returnPred(kQueryJoin.left);
    }
    if (join.length > 0 && join[0].toUpperCase() === "RIGHT") {
        yield returnPred(kQueryJoin.right);
    }
    if (join.length > 0 && join[0].toUpperCase() === "FULL") {
        yield returnPred(kQueryJoin.full);
    }
    if (join.length > 0 && join[0].toUpperCase() === "CROSS") {
        yield returnPred(kQueryJoin.cross);
    }
}


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



    let hasMoreTables = yield predicateTypeOfJoin; //yield maybe(oneOf([str(","), str("LEFT JOIN"), str("RIGHT JOIN"), str("JOIN")], ""));
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
        } else {
            let aliasWithoutAS = yield maybe(checkAhead([literal], ""));
            if (aliasWithoutAS !== undefined) {
                if (!isKeyword(aliasWithoutAS)) {
                    aliasWithoutAS = yield literal;
                    alias = aliasWithoutAS;
                }
            }
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
            joinType: hasMoreTables,
            joinTarget: undefined,
            joinClauses: joinClause
        }
        tables.push(tbl);
        yield maybe(atLeast1(whitespaceOrNewLine));
        hasMoreTables = yield predicateTypeOfJoin;
    }

    const where = yield maybe(str("WHERE"));
    let whereClause: TQueryExpression | TValidExpressions;
    if (where !== undefined && where.toUpperCase() === "WHERE") {
        yield atLeast1(whitespaceOrNewLine);
        whereClause = yield predicateTQueryExpression;
    }
    yield maybe(atLeast1(whitespaceOrNewLine));

    const groupBy = yield maybe(checkSequence([str("GROUP"), atLeast1(whitespaceOrNewLine), str("BY"), atLeast1(whitespaceOrNewLine)]));
    let groupByClauses: TQueryOrderBy[] = [];
    let havingClause: TQueryExpression | TValidExpressions;
    if (groupBy !== undefined && groupBy[0].toUpperCase() === "GROUP") {
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
    let offsetExpression: TQueryExpression | TValidExpressions = undefined;
    let fetchExpression: TQueryExpression | TValidExpressions = undefined;
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

        let hasOffset = yield maybe(checkSequence([str("OFFSET"), atLeast1(whitespaceOrNewLine)]));
        if (hasOffset) {
            offsetExpression = yield predicateTQueryExpression;
            yield maybe(atLeast1(whitespaceOrNewLine));
            yield oneOf([str("ROWS"), str("ROW")], "ROW or ROWS");
            yield maybe(atLeast1(whitespaceOrNewLine));
            let hasFetch = yield maybe(checkSequence([str("FETCH"), atLeast1(whitespaceOrNewLine)]));
            if (hasFetch) {
                yield maybe(checkSequence([oneOf([str("FIRST"), str("NEXT")], "FIRST or NEXT"), atLeast1(whitespaceOrNewLine)]));
                fetchExpression = yield predicateTQueryExpression;
                yield maybe(atLeast1(whitespaceOrNewLine));
                yield oneOf([str("ROWS"), str("ROW")], "ROW or ROWS");
                yield maybe(atLeast1(whitespaceOrNewLine));
                yield maybe(str("ONLY"));
            }
        }

    }

    yield maybe(atLeast1(whitespaceOrNewLine));

    let hasUnion = yield maybe(oneOf([
        checkSequence([str("UNION"), atLeast1(whitespaceOrNewLine), str("ALL"), atLeast1(whitespaceOrNewLine)]),
        checkSequence([str("UNION"), atLeast1(whitespaceOrNewLine)]),
        checkSequence([str("EXCEPT"), atLeast1(whitespaceOrNewLine)]),
        checkSequence([str("INTERSECT"), atLeast1(whitespaceOrNewLine)])], ""));
    let unionType: kUnionType = kUnionType.none;
    let subSet: TQuerySelect = undefined;
    if (hasUnion !== undefined) {
        subSet = yield predicateTQuerySelect;
        if (hasUnion.length >= 3 && hasUnion[0].toUpperCase() === "UNION" && hasUnion[2].toUpperCase() === "ALL") {
            unionType = kUnionType.unionAll;
        } else if (hasUnion[0].toUpperCase() === "UNION") {
            unionType = kUnionType.union;
        } else if (hasUnion[0].toUpperCase() === "EXCEPT") {
            unionType = kUnionType.except;
        } else if (hasUnion[0].toUpperCase() === "INTERSECT") {
            unionType = kUnionType.intersect;
        }
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
            orderBy: orderByClauses,
            groupBy: groupByClauses,
            having: havingClause,
            resultTableName: "#" + generateV4UUID(),
            hasDistinct: hasDistinct !== undefined,
            unionType: unionType,
            subSet: subSet,
            offset: offsetExpression,
            fetch: fetchExpression
        } as TQuerySelect
    );
}