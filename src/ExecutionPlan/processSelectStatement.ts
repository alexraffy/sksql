import {ParseResult} from "../BaseParser/ParseResult";
import {TQuerySelect} from "../Query/Types/TQuerySelect";
import {SQLResult} from "../API/SQLResult";
import {instanceOfParseResult} from "../BaseParser/Guards/instanceOfParseResult";
import {instanceOfTQuerySelect} from "../Query/Guards/instanceOfTQuerySelect";
import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {openTables} from "../API/openTables";
import {TEP} from "./TEP";
import {generateExecutionPlanFromStatement} from "./generateExecutionPlanFromStatement";
import {run} from "./run";
import {SKSQL} from "../API/SKSQL";
import {readTableDefinition} from "../Table/readTableDefinition";
import {readFirst} from "../Cursor/readFirst";
import {recordSize} from "../Table/recordSize";
import {TEPScan} from "./TEPScan";
import {getValueForAliasTableOrLiteral} from "../Query/getValueForAliasTableOrLiteral";
import {TEPNestedLoop} from "./TEPNestedLoop";
import {TEPSortNTop} from "./TEPSortNTop";
import {TEPSelect} from "./TEPSelect";
import {TEPGroupBy} from "./TEPGroupBy";
import {TParserError} from "../API/TParserError";
import {TableColumnType} from "../Table/TableColumnType";
import {TExecutionContext} from "./TExecutionContext";


export function addTable2Plan(tables: TTableWalkInfo[], table: string, alias: string) {
    if (table === undefined || table === "") {
        return tables;
    }
    if (alias === undefined || alias === "") {
        alias = table;
    }
    let exists = tables.find((t) => { return t.name.toUpperCase() === table.toUpperCase();});
    if (!exists) {
        let tbl = SKSQL.instance.getTable(table);
        if (tbl === undefined) {
            throw new TParserError("Table " + table + " not found.");
        }
        let def = readTableDefinition(tbl.data, true);
        let cursor = readFirst(tbl, def);
        let rowLength = recordSize(tbl.data) + 5;
        tables.push({
            name: table,
            alias: alias,
            table: tbl,
            def: def,
            cursor: cursor,
            rowLength: rowLength
        });
    }
    return tables;
}

export function processSelectStatement(context: TExecutionContext,
                                       statement: TQuerySelect) {
    let select: TQuerySelect = statement;
    let columnsNeededForWhereClause: {tableName: string, columnName: string}[] = [];


    let planDescription = "";
    let plan: TEP[] = generateExecutionPlanFromStatement(context, select);
    let recur = function (plan: TEP) {
        planDescription += "\t"
        if (plan.kind === "TEPScan") {
            let p = plan as TEPScan;
            let tblName = getValueForAliasTableOrLiteral(p.table);
            context.openTables = addTable2Plan(context.openTables, tblName.table, tblName.alias);
            context.openTables = addTable2Plan(context.openTables, p.result, p.result);
            planDescription += "[SCAN " + tblName.table + "";
            if (p.result !== undefined && p.result !== "" && p.result !== tblName.table) {
                planDescription += "=>" + p.result;
            }
            planDescription += "]";
        }
        if (plan.kind === "TEPNestedLoop") {
            let p = plan as TEPNestedLoop;
            planDescription += "[NESTED LOOP]\n"
            recur(p.a);
            planDescription += "\n";
            recur(p.b);
        }
        if (plan.kind === "TEPGroupBy") {
            let p = plan as TEPGroupBy;
            let src = getValueForAliasTableOrLiteral(p.source);
            let dest = getValueForAliasTableOrLiteral(p.dest);
            context.openTables = addTable2Plan(context.openTables, src.table, src.alias);
            context.openTables = addTable2Plan(context.openTables, dest.table, dest.alias);
            planDescription += "[GroupBy " + src.table + "=>" + dest.table + "]";
        }
        if (plan.kind === "TEPSortNTop") {
            let p = plan as TEPSortNTop;
            planDescription += "[SortNTop]";
            context.openTables = addTable2Plan(context.openTables, p.source, p.source);
            context.openTables = addTable2Plan(context.openTables, p.dest, p.dest);
        }
        if (plan.kind === "TEPSelect") {
            let p = plan as TEPSelect;
            planDescription += "[Select " + p.dest + "]";
        }
    }
    for (let i = 0; i < plan.length; i++) {
        recur(plan[i]);
    }

    //console.log(planDescription);

    let returnSQLResult = run(context, select, plan);
    returnSQLResult.executionPlan = {
        description: planDescription
    };

    context.results.push(returnSQLResult);
    //if (returnSQLResult.resultTableName !== undefined && returnSQLResult.resultTableName !== "") {
//        context.openedTempTables.push(returnSQLResult.resultTableName);
//    }


}