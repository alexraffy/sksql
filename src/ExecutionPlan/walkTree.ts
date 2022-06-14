import {SKSQL} from "../API/SKSQL";
import {TExecutionContext} from "./TExecutionContext";
import {TValidStatementsInProcedure} from "../Query/Types/TValidStatementsInProcedure";
import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {TableColumnType} from "../Table/TableColumnType";
import {instanceOfTVariable} from "../Query/Guards/instanceOfTVariable";
import {instanceOfTColumn} from "../Query/Guards/instanceOfTColumn";
import {findTableNameForColumn} from "../API/findTableNameForColumn";
import {TParserError} from "../API/TParserError";
import {instanceOfTAlias} from "../Query/Guards/instanceOfTAlias";
import {getValueForAliasTableOrLiteral} from "../Query/getValueForAliasTableOrLiteral";
import {instanceOfTNumber} from "../Query/Guards/instanceOfTNumber";
import {instanceOfTDate} from "../Query/Guards/instanceOfTDate";
import {instanceOfTTime} from "../Query/Guards/instanceOfTTime";
import {instanceOfTDateTime} from "../Query/Guards/instanceOfTDateTime";
import {instanceOfTString} from "../Query/Guards/instanceOfTString";
import {instanceOfTBoolValue} from "../Query/Guards/instanceOfTBoolValue";
import {instanceOfTQueryFunctionCall} from "../Query/Guards/instanceOfTQueryFunctionCall";
import {kFunctionType} from "../Functions/kFunctionType";
import {instanceOfTQueryColumn} from "../Query/Guards/instanceOfTQueryColumn";
import {instanceOfTQuerySelect} from "../Query/Guards/instanceOfTQuerySelect";
import {createNewContext} from "./newContext";
import {contextTables} from "./contextTables";
import {TableColumn} from "../Table/TableColumn";
import {TRegisteredFunction} from "../Functions/TRegisteredFunction";
import {instanceOfTQueryUpdate} from "../Query/Guards/instanceOfTQueryUpdate";
import {instanceOfTQueryDelete} from "../Query/Guards/instanceOfTQueryDelete";
import {instanceOfTTable} from "../Query/Guards/instanceOfTTable";
import {TAlias} from "../Query/Types/TAlias";
import {instanceOfTCast} from "../Query/Guards/instanceOfTCast";
import {TCast} from "../Query/Types/TCast";
import {instanceOfTArray} from "../Query/Guards/instanceOfTArray";
import {TArray} from "../Query/Types/TArray";
import {instanceOfTBetween} from "../Query/Guards/instanceOfTBetween";
import {instanceOfTStar} from "../Query/Guards/instanceOfTStar";
import {instanceOfTQueryExpression} from "../Query/Guards/instanceOfTQueryExpression";
import {instanceOfTCaseWhen} from "../Query/Guards/instanceOfTCaseWhen";
import {instanceOfTVariableAssignment} from "../Query/Guards/instanceOfTVariableAssignment";
import {instanceOfTVariableDeclaration} from "../Query/Guards/instanceOfTVariableDeclaration";
import {TQuerySelect} from "../Query/Types/TQuerySelect";

/*
    Walk an AST tree
    PARAMETERS
    db: an instance of SKSQL.
    context: the current context for the execution.
    currentStatement: the original AST for current SQL statement.
    tables: an array of TTableWalkInfo containing info about the required tables for the statement.
    parameters: an array of parameters passed to the SQL Statement. see SQLStatement.setParameter.
    o: the current leaf in the tree.
    parentsTree: an array containing the ancestors of the current leaf.
    perItem: a callback function called for every leaf with =>
        obj: the current leaf
        parents: the ancestors of the leaf
        info: information about the column if the leaf is a TColumn or
              information about the function if the leaf is a TQueryFunctionCall or a parameter of the function
        the callback function should return a boolean to specify if we should continue walking the current path.
 */
export function walkTree(db: SKSQL,
                         context: TExecutionContext,
                         currentStatement: TValidStatementsInProcedure,
                         tables: TTableWalkInfo[],
                         parameters: {name: string, type: TableColumnType, value: any}[],
                         o: any,
                         parentsTree: any[],
                         info: {status: string, extra: {[key:string]: any}},
                         perItem: (obj: any, parents: any[], info: {status: { status: string, extra: {[key:string]: any}}, colData: {table: TTableWalkInfo, def: TableColumn}, functionData: {
                                name: string;
                                data: TRegisteredFunction;
                             }}) => boolean,
                         postItem: (obj: any, parents: any[], info: {status: { status: string, extra: {[key:string]: any}}, colData: {table: TTableWalkInfo, def: TableColumn}, functionData: {
                                 name: string;
                                 data: TRegisteredFunction;
                             }}) => boolean = undefined
                         ) {

    if (instanceOfTTable(o)) {
        perItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
        if (postItem !== undefined) {
            postItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
        }
    } else if (instanceOfTAlias(o)) {
        let shouldContinue = perItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
        walkTree(db, context, currentStatement, tables, parameters, (o as TAlias).name, [o, ...parentsTree], info, perItem, postItem);
        if (postItem !== undefined) {
            postItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
        }
    } else if (instanceOfTQueryExpression(o)) {
        if (perItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined}) === true) {
            walkTree(db, context, currentStatement, tables, parameters, o.value.left, [o, ...parentsTree], info, perItem, postItem);
            walkTree(db, context, currentStatement, tables, parameters, o.value.right, [o, ...parentsTree], info, perItem, postItem);
        }
        if (postItem !== undefined) {
            postItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
        }
    } else if (instanceOfTVariable(o)) {
        perItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
        if (postItem !== undefined) {
            postItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
        }
    } else if (instanceOfTVariableAssignment(o)) {
        perItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
        walkTree(db, context, currentStatement, tables, parameters, o.name, [o, ...parentsTree], info, perItem, postItem);
        if (o.value !== undefined) {
            walkTree(db, context, currentStatement, tables, parameters, o.value, [o, ...parentsTree], info, perItem, postItem);
        }
        if (postItem !== undefined) {
            postItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
        }
    } else if (instanceOfTVariableDeclaration(o)) {
        perItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
        for (let i = 0; i < o.declarations.length; i++) {
            walkTree(db, context, currentStatement, tables, parameters, o.declarations[i].value, [o, ...parentsTree], info, perItem, postItem);
        }
        if (postItem !== undefined) {
            postItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
        }
    } else if (instanceOfTColumn(o)) {
        let name = o.column;
        let table = o.table;
        if (table !== undefined) {
            table = table.toUpperCase();
        }
        // fix no table
        if (table === undefined || table === "") {
            let tableNames = findTableNameForColumn(name, tables, o);
            if (tableNames.length > 1) {
                throw new TParserError("Ambiguous column name " + name);
            }
            if (tableNames.length === 0) {
                // check the previous context if this is a sub-query
                let found = false;
                if (info.extra.previousContext !== undefined) {
                    tableNames = findTableNameForColumn(name, (info.extra.previousContext as TExecutionContext).tables, o);
                    if (tableNames.length > 1) {
                        throw new TParserError("Ambiguous column name " + name);
                    }
                    if (tableNames.length === 1) {
                        found = true;
                        switch (currentStatement.kind) {
                            case "TQuerySelect":
                                (currentStatement as TQuerySelect).hasForeignColumns = true;


                                break;
                            case "TQueryUpdate":
                                break;
                        }
                    }
                }
                if (found === false) {
                    throw new TParserError("Unknown column name " + name);
                }
            }
            table = tableNames[0];
        }
        let t = tables.find((t) => {
            let ret = false;
            if (t.name.toUpperCase() === table.toUpperCase()) {
                ret = true;
            }
            if (typeof t.alias === "string") {
                if (t.alias === table) {
                    ret = true;
                }
            } else if (instanceOfTAlias(t.alias)) {
                let val = getValueForAliasTableOrLiteral(t.alias);
                if (val.table === table || val.alias === table) {
                    ret = true;
                }
            }

            return ret;
        });
        if (t === undefined && info.extra.previousContext !== undefined) {
            t = (info.extra.previousContext as TExecutionContext).tables.find((t) => {
                let ret = false;
                if (t.name.toUpperCase() === table.toUpperCase()) {
                    ret = true;
                }
                if (typeof t.alias === "string") {
                    if (t.alias === table) {
                        ret = true;
                    }
                } else if (instanceOfTAlias(t.alias)) {
                    let val = getValueForAliasTableOrLiteral(t.alias);
                    if (val.table === table || val.alias === table) {
                        ret = true;
                    }
                }
                if (ret === true) {
                    // push the table to the list of tables in the current context
                    context.tables.push(t);
                }

                return ret;
            });
        }
        if (t === undefined) {
            throw new TParserError("Could not find table for column " + name + " from TColumn " + JSON.stringify(o));
        }
        let colDef = t.def.columns.find((col) => {
            return col.name.toUpperCase() === name.toUpperCase();
        });

        perItem(o, parentsTree, {status: info, colData: {table: t, def: colDef}, functionData: undefined});
        if (postItem !== undefined) {
            postItem(o, parentsTree, {status: info, colData: {table: t, def: colDef}, functionData: undefined});
        }
    }
         else if (instanceOfTNumber(o)) {
            perItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            if (postItem !== undefined) {
                postItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            }
        } else if (instanceOfTDate(o)) {
            perItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            if (postItem !== undefined) {
                postItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            }
        } else if (instanceOfTTime(o)) {
            perItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            if (postItem !== undefined) {
                postItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            }
        } else if (instanceOfTDateTime(o)) {
            perItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            if (postItem !== undefined) {
                postItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            }
        } else if (instanceOfTString(o)) {
            perItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            if (postItem !== undefined) {
                postItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            }
        } else if (instanceOfTBoolValue(o)) {
            perItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            if (postItem !== undefined) {
                postItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            }
        } else if (instanceOfTStar(o)) {
            perItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            if (postItem !== undefined) {
                postItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            }
        } else if (instanceOfTQueryFunctionCall(o)) {
            let fnName = o.value.name;
            let fnData = db.getFunctionNamed(fnName);
            if (fnData === undefined) {
                throw new TParserError("Function " + fnName + " does not exist. Use DBData.instance.declareFunction before using it.");
            }

            if (perItem(o, parentsTree, {status: info, colData: undefined, functionData: { name: fnName, data: fnData }}) === false) {
                return false;
            }

            for (let i = 0; i < o.value.parameters.length; i++) {
                walkTree(db, context, currentStatement, tables, parameters, o.value.parameters[i], [o, ...parentsTree], info, perItem, postItem);
            }
            if (postItem !== undefined) {
                postItem(o, parentsTree, {status: info, colData: undefined, functionData: {name: fnName, data: fnData}});
            }
        } else if (instanceOfTCast(o)) {
            let shouldContinue = perItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            if (shouldContinue) {
                walkTree(db, context, currentStatement, tables, parameters, (o as TCast).exp, [o, ...parentsTree], info, perItem, postItem);
            }
            if (postItem !== undefined) {
                postItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            }
        } else if (instanceOfTQueryColumn(o)) {
            let shouldContinue = perItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            if (shouldContinue) {
                walkTree(db, context, currentStatement, tables, parameters, o.expression, [o, ...parentsTree], info, perItem, postItem);
            }
            if (postItem !== undefined) {
                postItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            }
        } else if (instanceOfTArray(o)) {
            let shouldContinue = perItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            if (shouldContinue) {
                for (let i = 0; i < (o as TArray).array.length; i++) {
                    walkTree(db, context, currentStatement, tables, parameters, (o as TArray).array[i], [o, ...parentsTree], info, perItem, postItem);
                }
            }
            if (postItem !== undefined) {
                postItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            }
        } else if (instanceOfTBetween(o)) {
            let shouldContinue = perItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            if (shouldContinue) {
                walkTree(db, context, currentStatement, tables, parameters, o.a, [o, ...parentsTree], info, perItem, postItem);
                walkTree(db, context, currentStatement, tables, parameters, o.b, [o, ...parentsTree], info, perItem, postItem);
            }
            if (postItem !== undefined) {
                postItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            }
        } else if (instanceOfTCaseWhen(o)) {
            info.extra["ignoreType"] = false;
            let shouldContinue = perItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            if (!shouldContinue) {
                return false;
            }

            if (o.case !== undefined) {
                info.extra["ignoreType"] = true;
                walkTree(db, context, currentStatement, tables, parameters, o.case, [o, ...parentsTree], info, perItem, postItem);
            }
            for (let i = 0; i < o.whens.length; i++) {
                let w = o.whens[i];
                info.extra["ignoreType"] = true;
                walkTree(db, context, currentStatement, tables, parameters, w.test, [o, ...parentsTree], info, perItem, postItem);
                info.extra["ignoreType"] = false;
                walkTree(db, context, currentStatement, tables, parameters, w.ret, [o, ...parentsTree], info, perItem, postItem);
            }
            if (o.else !== undefined) {
                info.extra["ignoreType"] = false;
                walkTree(db, context, currentStatement, tables, parameters, o.else, [o, ...parentsTree], info, perItem, postItem);
            }
            info.extra["ignoreType"] = false;

        } else if (instanceOfTQuerySelect(o)) {
            let lastStatus = info.status;

            info.status = "SELECT";
            let process = perItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            if (process === false ) {
                return;
            }
            info.status = "SELECT.TABLES";
            for (let i = 0; i < o.tables.length; i++) {
                walkTree(db, context, o, tables, parameters, o.tables[i].tableName, [o, ...parentsTree], info, perItem, postItem);
            }
            if (postItem !== undefined) {
                postItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            }
            info.status = "SELECT.COLUMNS";
            if (o.columns.length > 0) {
                let c = createNewContext("", "", undefined);
                for (let i = 0; i < o.columns.length; i++) {
                    walkTree(db, context, o, tables, parameters, o.columns[i], [o, ...parentsTree], info, perItem, postItem);
                }
            }
            if (postItem !== undefined) {
                postItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            }
            info.status = "SELECT.WHERE";
            if (o.where !== undefined) {
                walkTree(db, context, o, tables, parameters, o.where, [o, ...parentsTree], info, perItem, postItem);
            }
            if (postItem !== undefined) {
                postItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            }
            info.status = "SELECT.GROUPBY";
            if (o.groupBy !== undefined && o.groupBy.length > 0) {
                for (let i = 0; i < o.groupBy.length; i++) {
                    walkTree(db, context, o, tables, parameters, o.groupBy[i].column, [o, ...parentsTree], info, perItem, postItem);
                }
            }
            if (postItem !== undefined) {
                postItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            }

            info.status = "SELECT.ORDERBY"
            if (o.orderBy !== undefined && o.orderBy.length > 0) {
                for (let i = 0; i < o.orderBy.length; i++) {
                    walkTree(db, context, o, tables, parameters, o.orderBy[i].column, [o, ...parentsTree], info, perItem, postItem);
                }
            }
            if (postItem !== undefined) {
                postItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            }

            info.status = "SELECT.HAVING";
            if (o.having !== undefined) {
                walkTree(db, context, o, tables, parameters, o.having, [o, ...parentsTree], info, perItem, postItem);
            }
            if (postItem !== undefined) {
                postItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            }

            info.status = lastStatus;
        } else if (instanceOfTQueryUpdate(o)) {
            if (o.table !== undefined) {
                walkTree(db, context, o, tables, parameters, o.table, [o, ...parentsTree], info, perItem, postItem);
            }
            for (let i = 0; i < o.tables.length; i++) {
                walkTree(db, context, o, tables, parameters, o.tables[i].tableName, [o, ...parentsTree], info, perItem, postItem);
            }
            for (let i = 0; i < o.sets.length; i++) {
                walkTree(db, context, o, tables, parameters, o.sets[i].column, [o, ...parentsTree], info, perItem, postItem);
                walkTree(db, context, o, tables, parameters, o.sets[i].value, [o, ...parentsTree], info, perItem, postItem);
            }
            if (o.where !== undefined) {
                walkTree(db, context, o, tables, parameters, o.where, [o, ...parentsTree], info, perItem, postItem);
            }
            if (postItem !== undefined) {
                postItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            }
        } else if (instanceOfTQueryDelete(o)) {
            for (let i = 0; i < o.tables.length; i++) {
                walkTree(db, context, o, tables, parameters, o.tables[i].tableName, [o, ...parentsTree], info, perItem, postItem);
            }
            if (o.where !== undefined) {
                walkTree(db, context, o, tables, parameters, o.where, [o, ...parentsTree], info, perItem, postItem);
            }
            if (postItem !== undefined) {
                postItem(o, parentsTree, {status: info, colData: undefined, functionData: undefined});
            }
        }


}