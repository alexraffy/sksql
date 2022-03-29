import {TQuerySelect} from "../Query/Types/TQuerySelect";
import {TQueryUpdate} from "../Query/Types/TQueryUpdate";
import {TEP} from "./TEP";
import {instanceOfTQuerySelect} from "../Query/Guards/instanceOfTQuerySelect";
import {createNewContext} from "./newContext";
import {processSelectStatement} from "./processSelectStatement";
import {instanceOfTAlias} from "../Query/Guards/instanceOfTAlias";
import {TAlias} from "../Query/Types/TAlias";
import {walkTree} from "./walkTree";
import {instanceOfTColumn} from "../Query/Guards/instanceOfTColumn";
import {instanceOfTTable} from "../Query/Guards/instanceOfTTable";
import {addTable2Context} from "./contextTables";
import {SKSQL} from "../API/SKSQL";
import {TExecutionContext} from "./TExecutionContext";
import {TEPProjection} from "./TEPProjection";
import {instanceOfTQueryFunctionCall} from "../Query/Guards/instanceOfTQueryFunctionCall";
import {kFunctionType} from "../Functions/kFunctionType";
import {instanceOfTStar} from "../Query/Guards/instanceOfTStar";
import {TQueryColumn} from "../Query/Types/TQueryColumn";
import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {getValueForAliasTableOrLiteral} from "../Query/getValueForAliasTableOrLiteral";
import {TLiteral} from "../Query/Types/TLiteral";
import {TTable} from "../Query/Types/TTable";
import {addAllColumnsForTable} from "./addAllColumnsForTable";
import {ITableDefinition} from "../Table/ITableDefinition";
import {instanceOfTQueryColumn} from "../Query/Guards/instanceOfTQueryColumn";
import {generateV4UUID} from "../API/generateV4UUID";
import {TNumber} from "../Query/Types/TNumber";
import {kOrder} from "../Query/Enums/kOrder";
import {instanceOfTString} from "../Query/Guards/instanceOfTString";
import {instanceOfTVariable} from "../Query/Guards/instanceOfTVariable";
import {TParserError} from "../API/TParserError";
import {TableColumnType} from "../Table/TableColumnType";
import {instanceOfTNumber} from "../Query/Guards/instanceOfTNumber";
import {instanceOfTDate} from "../Query/Guards/instanceOfTDate";
import {instanceOfTTime} from "../Query/Guards/instanceOfTTime";
import {instanceOfTDateTime} from "../Query/Guards/instanceOfTDateTime";
import {instanceOfTBoolValue} from "../Query/Guards/instanceOfTBoolValue";
import {findExpressionType} from "../API/findExpressionType";
import {electQueryColumnType} from "./electQueryColumnType";
import {instanceOfTLiteral} from "../Query/Guards/instanceOfTLiteral";
import {ITable} from "../Table/ITable";
import {newTable} from "../Table/newTable";
import {recordSize} from "../Table/recordSize";
import {readFirst} from "../Cursor/readFirst";
import {instanceOfTQueryUpdate} from "../Query/Guards/instanceOfTQueryUpdate";
import {findWalkTable} from "./findWalkTable";
import {TEPScan} from "./TEPScan";
import {TEPNestedLoop} from "./TEPNestedLoop";
import {TEPGroupBy} from "./TEPGroupBy";
import {TEPSortNTop} from "./TEPSortNTop";
import {TEPSelect} from "./TEPSelect";
import {TEPUpdate} from "./TEPUpdate";
import {TColumn} from "../Query/Types/TColumn";
import {TRegisteredFunction} from "../Functions/TRegisteredFunction";
import {TQueryFunctionCall} from "../Query/Types/TQueryFunctionCall";
import {instanceOfTQueryCreateFunction} from "../Query/Guards/instanceOfTQueryCreateFunction";
import {TQueryOrderBy} from "../Query/Types/TQueryOrderBy";
import {instanceOfTQueryExpression} from "../Query/Guards/instanceOfTQueryExpression";
import {TQueryExpression} from "../Query/Types/TQueryExpression";
import {kQueryExpressionOp} from "../Query/Enums/kQueryExpressionOp";
import {TDebugInfo} from "../Query/Types/TDebugInfo";
import {dumpTable} from "../Table/dumpTable";
import {instanceOfTCast} from "../Query/Guards/instanceOfTCast";
import {typeString2TableColumnType} from "../API/typeString2TableColumnType";

/*
    generateEP
    Generate the execution plan for the SQL statement.

    It generates a list of TEP steps (Scan, NestedLoop, GroupBy, SortNTop...) that we can execute later on.

    We start by executing any sub-query present in the FROM clauses and replacing its leaf with a TTable referencing the temp table generated.
    We then walk the AST cleaning up TColumn references so we don't have to lookup its table later on,
    compiling the list of columns needed for ordering.
    If a join is needed, we generate a NestedLoop step.
    If an aggregate function or a GROUP BY clause are present, we add the columns referenced if they are not already in the projection list
    and remove any aggregate functions call from the first Scan step and move their evaluation to the GroupBy step.
    If an order by step is present we add a SortNTop step.


*/
export function generateEP(db: SKSQL, context: TExecutionContext, select: TQuerySelect | TQueryUpdate, options: { printDebug: boolean} = {printDebug: false}): TEP[] {
    let ret: TEP[] = [];
    let returnTableName = "";
    let returnTableDefinition = {
        name: returnTableName,
        columns: [],
        hasIdentity: false,
        identityColumnName: '',
        identitySeed: 1,
        identityIncrement: 1,
        constraints: [],
    } as ITableDefinition
    let groupByResultTableDef: ITableDefinition = {
        name: "",
        columns: [],
        hasIdentity: false,
        identityColumnName: '',
        identitySeed: 1,
        identityIncrement: 1,
        constraints: []
    } as ITableDefinition;
    let projectionsGroupBy: TEPProjection[] = [];
    let aggregateFunctions: {name: string, fn: TRegisteredFunction, funcCall: TQueryFunctionCall, data: any}[] = [];
    let projections: TEPProjection[] = [];
    let hasAggregation = false;




    // process sub-queries in FROM clauses
    if (instanceOfTQuerySelect(select)) {
        for (let i = 0; i < select.tables.length; i++) {
            let newC = createNewContext("subQuery " + i, "", undefined );
            let rt : TTable;
            if (instanceOfTQuerySelect(select.tables[i].tableName)) {
                let subQuery = select.tables[i].tableName as TQuerySelect;
                rt = processSelectStatement(db, newC, subQuery, true, options);
                select.tables[i].tableName = rt;
                context.openedTempTables.push(rt.table);
            } else if (instanceOfTAlias(select.tables[i].tableName) && instanceOfTQuerySelect((select.tables[i].tableName as TAlias).name)) {
                let subQuery = (select.tables[i].tableName as TAlias).name as TQuerySelect;
                rt = processSelectStatement(db, newC, subQuery, true, options);
                (select.tables[i].tableName as TAlias).name = rt;
                context.openedTempTables.push(rt.table);
            }
            if (rt !== undefined && options !== undefined && options.printDebug === true) {
                console.log("--------------------");
                console.log("SUBQUERY TABLE DUMP: " + rt.table);
                console.log(dumpTable(db.getTable(rt.table)));
            }
        }
    }

    if (instanceOfTQuerySelect(select)) {
        let i = 1;
        returnTableName = "#query" + i;
        while (db.tableInfo.get(returnTableName) !== undefined) {
            returnTableName = "#query" + (++i);
        }
    }
    returnTableName = returnTableName.toUpperCase();
    returnTableDefinition.name = returnTableName;


    // walk the AST
    // on TTable: add table information to context.tables
    // on TColumn: add a table alias if not present
    // on TStar: add all columns to the projection list
    // on TQueryColumn: calculate the expression type and add it to the projection list
    let expressionType: TableColumnType = TableColumnType.int32;
    let expressionLength: number = undefined;
    let expressionTypes: TableColumnType[] = [];
    walkTree(db, context, select, context.tables, context.stack, select, [], {status: "", extra: {}},
        (obj, parents, info) => {

            if (instanceOfTQuerySelect(obj)) {
                if (parents.length > 0 && (instanceOfTQueryColumn(parents[0]) || instanceOfTQueryExpression(parents[0]))) {
                    // this is a subquery, we try to generate an execution plan.
                    // if it fails that tell us that the subquery references a foreign table
                    let newC = createNewContext("subQuery", context.query, undefined);
                    newC.stack = context.stack;
                    let subQueryHasForeignColumns = false;
                    try {
                        let copyObj = JSON.parse(JSON.stringify(obj));
                        let teps = generateEP(db, newC, copyObj);
                    } catch (e) {
                        subQueryHasForeignColumns = true;
                    }
                    obj.hasForeignColumns = subQueryHasForeignColumns;
                    return false;
                }
                if (info.status.status === "SELECT") {
                    // pre columns processing
                    if (obj.groupBy !== undefined && obj.groupBy.length > 0) {
                        hasAggregation = true;
                    }
                }
            }


            // SELECT FROM xxx, UPDATE xxx FROM yyyy, DELETE FROM xxx
            if (instanceOfTTable(obj)) {
                // add table information to context.tables
                addTable2Context(db, context, obj.table.toUpperCase(), parents[0]);
            }

            if (instanceOfTQueryColumn(obj)) {
                // reset the projection type to int32
                expressionTypes = [];
                expressionType = TableColumnType.int32;
                expressionLength = undefined;
                info.status.extra["ignoreType"] = false;
                info.status.extra["ignoreColumn"] = false;
                info.status.extra["ignoreColumnForScan"] = false;
            }

            if (instanceOfTVariable(obj) && info.status.extra["inFunction"] === undefined && info.status.extra["ignoreType"] !== true) {
                let param = context.stack.find((p) => { return p.name === obj.name;});

                    if (param.type !== undefined) {
                        expressionTypes.push(param.type);
                        if ((expressionLength !== undefined && param.type === TableColumnType.varchar && expressionLength < 4096) || expressionLength === undefined) {
                            expressionLength = 4096;
                        }
                    }

            }
            if (instanceOfTCast(obj) && info.status.extra["inFunction"] === undefined && info.status.extra["ignoreType"] !== true) {
                expressionTypes.push(typeString2TableColumnType(obj.cast.type));
                return false;
            }
            if (instanceOfTNumber(obj) && info.status.extra["inFunction"] === undefined && info.status.extra["ignoreType"] !== true) {
                if (obj.value.indexOf(".") > -1) {
                    expressionTypes.push(TableColumnType.numeric);
                }
                expressionTypes.push(TableColumnType.int32);
            }
            if (instanceOfTDate(obj) && info.status.extra["inFunction"] === undefined && info.status.extra["ignoreType"] !== true) {
                expressionTypes.push(TableColumnType.date);
            }
            if (instanceOfTTime(obj) && info.status.extra["inFunction"] === undefined && info.status.extra["ignoreType"] !== true) {
                expressionTypes.push(TableColumnType.time);
            }
            if (instanceOfTDateTime(obj) && info.status.extra["inFunction"] === undefined && info.status.extra["ignoreType"] !== true) {
                expressionTypes.push(TableColumnType.datetime);
            }
            if (instanceOfTString(obj) && info.status.extra["inFunction"] === undefined && info.status.extra["ignoreType"] !== true) {
                expressionTypes.push(TableColumnType.varchar);
                expressionLength = 4096;
            }
            if (instanceOfTBoolValue(obj) && info.status.extra["inFunction"] === undefined && info.status.extra["ignoreType"] !== true) {
                expressionTypes.push(TableColumnType.boolean);
            }

            if (instanceOfTQueryExpression(obj) && info.status.extra["inFunction"] === undefined && info.status.extra["ignoreType"] !== true) {
                if (["==", "=", "!=", "<>", "<=", "<", ">", ">=", "LIKE", "NOT LIKE", "IN", "NOT IN", "BETWEEN", "NOT", "NOT BETWEEN", "AND", "AND NOT", "OR", "IS NULL", "IS NOT NULL"].includes(obj.value.op)) {
                    expressionTypes.push(TableColumnType.boolean);
                }
            }


            if (instanceOfTColumn(obj)) {
                if (info.status.extra["inFunction"] === undefined && info.status.extra["ignoreType"] !== true) {
                    if (expressionLength === undefined) {
                        expressionLength = info.colData.def.length;
                    }
                    expressionTypes.push(info.colData.def.type);
                }
                obj.table = info.colData.table.name.toUpperCase();

                // if the TColumn is from a group by clause or a parameter of an aggregate function
                // we add it to the projection list.
                if (["SELECT.GROUPBY", "SELECT.ORDERBY"].includes(info.status.status) ||
                    info.status.extra["inAggregateFunction"] === true
                ) {
                    if (returnTableDefinition.columns.find((t) => {
                        return t.name.toUpperCase() === obj.column.toUpperCase();
                    }) === undefined) {
                        returnTableDefinition.columns.push({
                            name: obj.column,
                            type: info.colData.def.type,
                            length: info.colData.def.length,
                            invisible: true,
                            decimal: info.colData.def.decimal,
                            defaultExpression: "",
                            nullable: true
                        })
                        projections.push({
                            columnName: obj.column,
                            output: {
                                kind: "TQueryColumn",
                                alias: {
                                    kind: "TAlias",
                                    name: obj.column,
                                    alias: obj.column
                                },
                                expression: obj
                            } as TQueryColumn
                        });
                    }
                }
            }

            if (instanceOfTQueryFunctionCall(obj)) {
                // set the return type of the function
                if (info.status.extra["inFunction"] === undefined && info.functionData.data.returnTypeSameTypeHasParameterX !== undefined && info.status.extra["ignoreType"] !== true) {
                    let t;
                    if (info.functionData.data.returnTypeSameTypeHasParameterX < obj.value.parameters.length) {
                        t = findExpressionType(db, obj.value.parameters[info.functionData.data.returnTypeSameTypeHasParameterX], select, context.tables, context.stack);
                    } else if (info.functionData.data.parameters.length > info.functionData.data.returnTypeSameTypeHasParameterX) {
                        t = findExpressionType(db, info.functionData.data.parameters[info.functionData.data.returnTypeSameTypeHasParameterX], select, context.tables, context.stack);
                    } else {
                        if (info.functionData.data.returnTypeSameTypeHasParameterX < obj.value.parameters.length) {
                            t = findExpressionType(db, obj.value.parameters[info.functionData.data.returnTypeSameTypeHasParameterX], select, context.tables, context.stack);
                        } else {
                            throw new TParserError("Could not find return type for function " + info.functionData.name);
                        }
                    }

                    expressionTypes.push(t);
                    if (t === TableColumnType.varchar) {
                        expressionLength = 4096;
                    }
                } else if (info.status.extra["inFunction"] === undefined && info.status.extra["ignoreType"] !== true) {
                    expressionTypes.push(info.functionData.data.returnType);
                    if (info.functionData.data.returnType === TableColumnType.varchar) {
                        expressionLength = 4096;
                    }
                }

                if (info.status.extra["inFunction"] === undefined) {
                    info.status.extra["inFunction"] = 1;
                } else {
                    info.status.extra["inFunction"] += 1;
                }

                if (info.functionData !== undefined && info.functionData.data.type === kFunctionType.aggregate) {
                    hasAggregation = true;
                    info.status.extra["ignoreColumnForScan"] = true;
                    if (info.status.extra["inAggregateFunction"] === true) {
                        // we are already in an aggregate function.
                        // we can have an aggregate function in an aggregate function.
                        throw new TParserError("Aggregate function in aggregate function not allowed.");
                    }
                    if (info.status.status === "SELECT.WHERE") {
                        throw new TParserError("Aggregate function in where clause not allowed.");
                    }
                    if (info.status.status === "SELECT.ORDERBY") {
                        throw new TParserError("Aggregate function in order by clause not allowed.");
                    }

                    // we have an aggregate function
                    // but no group by clause
                    // we add a simple GROUP BY 1
                    if (instanceOfTQuerySelect(select) && (select.groupBy === undefined || select.groupBy.length === 0)) {
                        let groupByColumnName = generateV4UUID().toUpperCase();
                        if (select.groupBy === undefined) { select.groupBy = []; }
                        select.groupBy.push({
                            column: {
                                kind: "TQueryColumn",
                                expression: {kind: "TNumber", value: "1"} as TNumber,
                                alias: {kind: "TAlias", alias: groupByColumnName} as TAlias
                            } as TQueryColumn,
                            order: kOrder.asc
                        });
                        returnTableDefinition.columns.push({
                            name: groupByColumnName,
                            type: TableColumnType.int32,
                            length: 1,
                            invisible: true,
                            decimal: 0,
                            defaultExpression: "",
                            nullable: true
                        })
                        projections.push({
                            columnName: groupByColumnName,
                            output: {
                                kind: "TQueryColumn",
                                alias: {
                                    kind: "TAlias",
                                    name: groupByColumnName,
                                    alias: groupByColumnName
                                },
                                expression: {kind: "TNumber", value: "1"} as TNumber
                            } as TQueryColumn
                        });
                    }
                    // if a TColumn is processed in the parameters, we need a flag so we can add the column to the scan step.
                    if (info.status.extra["inAggregateFunction"] !== true) {
                        info.status.extra["inAggregateFunction"] = true;
                    }
                    // we will remove that flag at the postItem step for the function call
                }
            }
            if (instanceOfTStar(obj)) {
                // add all columns of the table specified or of all tables in the select from clause
                let table = "";
                if (instanceOfTTable(obj.table) && obj.table.table !== undefined && obj.table.table !== "") {
                    table = obj.table.table;
                    let tblWalk: TTableWalkInfo;
                    tblWalk = context.tables.find((t) => { return t.name.toUpperCase() === table.toUpperCase()});
                    addAllColumnsForTable(tblWalk, returnTableDefinition, groupByResultTableDef, projections, projectionsGroupBy);
                } else {
                    for (let x = 0; x < select.tables.length; x++) {
                        table = getValueForAliasTableOrLiteral(select.tables[x].tableName as (string | TAlias | TLiteral | TTable)).table;
                        let tblWalk: TTableWalkInfo;
                        tblWalk = context.tables.find((t) => { return t.name.toUpperCase() === table.toUpperCase()});
                        addAllColumnsForTable(tblWalk, returnTableDefinition, groupByResultTableDef, projections, projectionsGroupBy);
                    }
                }
                info.status.extra["ignoreColumn"] = true;
            }




        return true;
    }, (obj: any, parents: any[], info) => {

            if (instanceOfTQueryColumn(obj)) {
                expressionType = electQueryColumnType(expressionTypes);

                let name = "";
                if (instanceOfTLiteral(obj.alias.alias)) {
                    name = obj.alias.alias.value;
                } else if (typeof obj.alias.alias === "string") {
                    name = obj.alias.alias as string;
                }

                let colIndex = 0;
                let baseName = name;
                if (baseName === "") {
                    if (context.query !== undefined) {
                        //@ts-ignore
                        if (obj.debug !== undefined) {
                            //@ts-ignore
                            baseName = context.query.substring(obj.debug.start, obj.debug.end).trim();
                        }
                    }
                }
                name = baseName;


                if (info.status.extra["ignoreColumn"] !== true && info.status.extra["ignoreColumnForScan"] !== true) {
                    let invisible = undefined;
                    if (["SELECT.ORDERBY", "SELECT.GROUPBY", "SELECT.HAVING"].includes(info.status.status)) {
                        invisible = true;
                    }
                    let columnNameExists = returnTableDefinition.columns.find((c) => {
                        return c.name.toUpperCase() === name.toUpperCase();
                    });
                    if (columnNameExists === undefined) {
                        returnTableDefinition.columns.push(
                            {
                                name: name,
                                type: expressionType,
                                length: (expressionType === TableColumnType.varchar) ? ((expressionLength === undefined) ? 4096 : expressionLength) : 1,
                                nullable: true,
                                defaultExpression: "",
                                invisible: invisible
                            }
                        );
                        projections.push({
                            columnName: name,
                            output: obj
                        });
                    }

                }
                if (hasAggregation && info.status.extra["ignoreColumn"] !== true) {
                    let invisible = undefined;
                    if (["SELECT.ORDERBY", "SELECT.GROUPBY", "SELECT.HAVING"].includes(info.status.status)) {
                        invisible = true;
                    }
                    let columnNameExists = groupByResultTableDef.columns.find((c) => {
                        return c.name.toUpperCase() === name.toUpperCase();
                    });
                    if (columnNameExists === undefined) {

                        groupByResultTableDef.columns.push(
                            {
                                name: name,
                                type: expressionType,
                                length: (expressionType === TableColumnType.varchar) ? ((expressionLength === undefined) ? 4096 : expressionLength) : 1,
                                nullable: true,
                                defaultExpression: "",
                                invisible: invisible
                            }
                        );
                        // create a copy of obj.
                        // we'll need to modify the table name of any columns for the group step,
                        // so we don't want to keep the same reference.
                        projectionsGroupBy.push({
                            columnName: name,
                            output: JSON.parse(JSON.stringify(obj))
                        });
                    }
                }
                // reset the projection type to int32
                expressionTypes = [];
                expressionType = TableColumnType.int32;
                expressionLength = 1;
                info.status.extra["ignoreColumn"] = false;
            }


            if (instanceOfTQueryFunctionCall(obj)) {
                if (info.status.extra["inFunction"] !== undefined) {
                    info.status.extra["inFunction"] -= 1;
                    if (info.status.extra["inFunction"] <= 0) {
                        info.status.extra["inFunction"] = undefined;
                    }
                }
                if (info.functionData !== undefined && info.functionData.data.type === kFunctionType.aggregate) {
                    if (info.status.extra["inAggregateFunction"] === true) {
                        info.status.extra["inAggregateFunction"] = undefined;
                    }

                    let fnAggData = undefined;
                    if (!instanceOfTQueryCreateFunction(info.functionData.data.fn)) {
                        fnAggData = info.functionData.data.fn(context, "init", obj.distinct, undefined);
                    }
                    (obj as TQueryFunctionCall).aggregateDataId = generateV4UUID().toUpperCase();
                    aggregateFunctions.push({
                        name: info.functionData.name.toUpperCase(),
                        fn: info.functionData.data,
                        funcCall: JSON.parse(JSON.stringify(obj)),
                        data: fnAggData
                    });


                }
            }


        return true;
    });

    let returnTable: ITable;
    if (returnTableName !== "") {
        returnTable = newTable(db, returnTableDefinition);
        returnTableDefinition = db.tableInfo.get(returnTableDefinition.name).def;
        context.openedTempTables.push(returnTableName);
        context.tables.push(
            {
                name: returnTableName,
                table: returnTable,
                def: returnTableDefinition,
                alias: returnTableName,
                rowLength: recordSize(returnTable.data),
                cursor: readFirst(returnTable, returnTableDefinition)
            }
        );

        if (options !== undefined && options.printDebug === true) {
            console.log("--------------------------");
            console.log("RESULT TABLE: " + returnTableName);
            console.dir(returnTableDefinition);
        }


    }
    let currentDestName = returnTableName;
    let currentDestTable = returnTable;
    let currentDestTableDef = returnTableDefinition;

    if (instanceOfTQueryUpdate(select)) {
        let targetTable: TTableWalkInfo;
        if (select.table !== undefined) {
            targetTable = findWalkTable(context.tables, select.table);
        } else {
            if (instanceOfTQuerySelect(select.tables[0].tableName)) {
                throw new TParserError("UPDATE TABLE FROM SUBQUERY NOT SUPPORTED.");
            } else {
                targetTable = findWalkTable(context.tables, select.tables[0].tableName);
            }
        }
        currentDestName = targetTable.name;
        currentDestTable = targetTable.table;
        currentDestTableDef = targetTable.def;
    }

    let current: TEPScan | TEPNestedLoop;
    let idx = select.tables.length -1;
    while (idx >= 0) {


        let scan: TEPScan = {
            kind: "TEPScan",
            table: select.tables[idx].tableName as (TTable | TAlias),
            range: undefined,
            projection: projections,
            predicate: (idx === 0) ? select.where : select.tables[idx].joinClauses,
            result: currentDestName
        }
        if (idx === select.tables.length - 1 && select.tables.length > 1) {
            if (select.where !== undefined && select.tables[idx].joinClauses !== undefined) {
                scan.predicate = {
                    kind: "TQueryExpression",
                    value: {
                        op: kQueryExpressionOp.boolAnd,
                        left: select.where,
                        right: select.tables[idx].joinClauses
                    }
                } as TQueryExpression;
            } else if (select.tables[idx].joinClauses === undefined) {
                scan.predicate = select.where;
            } else if (select.where === undefined) {
                scan.predicate = select.tables[idx].joinClauses;
            }
        }
        if (idx === 0 && select.tables.length > 1) {
            scan.predicate = undefined;
        }

        if (current !== undefined) {
            let nestedLoop: TEPNestedLoop = {
                kind: "TEPNestedLoop",
                a: scan,
                b: current,
                join: select.tables[idx].joinClauses
            }
            current = nestedLoop;
        } else {
            current = scan;
        }

        idx--;
    }
    if (current === undefined) {
        let scan: TEPScan = {
            kind: "TEPScan",
            table: (select as TQueryUpdate).table,
            range: undefined,
            projection: projections,
            predicate:  (select as TQueryUpdate).where,
            result: currentDestName
        }
        current = scan;

    }

    ret.push(current);
    if (instanceOfTQuerySelect(select)) {
        if (select.groupBy !== undefined && select.groupBy.length > 0) {

            let groupByResultTableName = currentDestName + "_GROUPED";
            //let groupByResultTableDef: ITableDefinition = JSON.parse(JSON.stringify(currentDestTableDef));
            for (let i = groupByResultTableDef.columns.length - 1; i > 0; i--) {
                let inProjection = projectionsGroupBy.find((p) => { return p.columnName.toUpperCase() === groupByResultTableDef.columns[i].name.toUpperCase();});

                if (groupByResultTableDef.columns[i].invisible === true && inProjection === undefined) {
                    groupByResultTableDef.columns.splice(i, 1);
                }
            }
            groupByResultTableDef.name = groupByResultTableName;
            let groupByResultTable = newTable(db, groupByResultTableDef);
            groupByResultTableDef = db.tableInfo.get(groupByResultTableName).def;

            context.openedTempTables.push(groupByResultTableName);

            if (options !== undefined && options.printDebug === true) {
                console.log("--------------------------");
                console.log("GROUP BY RESULT TABLE: " + groupByResultTableName);
                console.dir(groupByResultTableDef);
            }

            context.tables.push(
                {
                    name: groupByResultTableName,
                    table: groupByResultTable,
                    def: groupByResultTableDef,
                    alias: groupByResultTableName,
                    rowLength: recordSize(groupByResultTable.data),
                    cursor: readFirst(groupByResultTable, groupByResultTableDef)
                }
            );
            // update columns in projections and aggregate functions so they use the result table of the first step
            for (let i = 0; i < projectionsGroupBy.length; i++) {
                walkTree(db, context, select, context.tables, context.stack, projectionsGroupBy[i].output, [], {
                    status: "",
                    extra: {}
                }, (obj, parents, info) => {
                    if (instanceOfTColumn(obj)) {
                        (obj as TColumn).table = currentDestName.toUpperCase();
                    }
                    return true;
                });
            }
            if (select.having !== undefined) {
                walkTree(db, context, select, context.tables, context.stack, select.having, [], {status: "", extra: {}},
                    (obj, parents, info) => {
                        if (instanceOfTColumn(obj)) {
                            (obj as TColumn).table = currentDestName.toUpperCase();
                        }
                        return true;
                    });
            }
            for (let i = 0; i < aggregateFunctions.length; i++) {
                walkTree(db, context, select, context.tables, context.stack, aggregateFunctions[i].funcCall, [], {
                    status: "",
                    extra: {}
                }, (obj, parents, info) => {
                    if (instanceOfTColumn(obj)) {
                        (obj as TColumn).table = currentDestName.toUpperCase();
                    }
                    return true;
                });
            }


            let stepGroupBy: TEPGroupBy = {
                kind: "TEPGroupBy",
                groupBy: select.groupBy,
                output: select.columns,
                having: select.having,
                projections: projectionsGroupBy,
                source: {kind: "TTable", table: currentDestName.toUpperCase(), schema: "dbo"} as TTable,
                dest: {kind: "TTable", table: groupByResultTableName, schema: "dbo"} as TTable,
                aggregateFunctions: aggregateFunctions
            }
            ret.push(stepGroupBy);

            currentDestName = groupByResultTableName;


        }


        if (select.orderBy.length > 0) {

            let copyOrderBy: TQueryOrderBy[] = JSON.parse(JSON.stringify(select.orderBy));
            for (let i = 0; i < copyOrderBy.length; i++) {
                walkTree(db, context, select, context.tables, context.stack, copyOrderBy[i].column, [], {
                    status: "",
                    extra: {}
                }, (obj, parents, info) => {
                    if (instanceOfTColumn(obj)) {
                        (obj as TColumn).table = currentDestName.toUpperCase();
                    }
                    return true;
                });
            }
            let stepSort: TEPSortNTop = {
                kind: "TEPSortNTop",
                source: currentDestName,
                orderBy: copyOrderBy,
                top: select.top,
                dest: ""
            }
            ret.push(stepSort);


        }
    }
    if (instanceOfTQuerySelect(select)) {
        let stepSelect: TEPSelect = {
            kind: "TEPSelect",
            dest: currentDestName,
        }
        ret.push(stepSelect);
    }
    if (instanceOfTQueryUpdate(select)) {
        let stepUpdate: TEPUpdate = {
            kind: "TEPUpdate",
            dest: currentDestName,
            sets: select.sets.map((t) => { return t.column;})
        }
        ret.push(stepUpdate);
    }

    if (options !== undefined && options.printDebug === true) {
        console.log("--------------------------");
        console.log("EXECUTION PLAN");
        console.dir(ret);
    }


    return ret;

}