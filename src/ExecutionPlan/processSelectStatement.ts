
import {TQuerySelect} from "../Query/Types/TQuerySelect";
import {TTableWalkInfo} from "../API/TTableWalkInfo";
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
import {TExecutionContext} from "./TExecutionContext";
import {ITable} from "../Table/ITable";
import {ITableDefinition} from "../Table/ITableDefinition";
import {TTableInfo} from "../API/CTableInfoManager";


export function addTable2Plan(db: SKSQL, tables: TTableWalkInfo[], table: string, alias: string) {
    if (table === undefined || table === "") {
        return tables;
    }
    if (alias === undefined || alias === "") {
        alias = table;
    }
    let exists = tables.find((t) => { return t.name.toUpperCase() === table.toUpperCase();});
    if (!exists) {
        let tbl: ITable;
        let def: ITableDefinition;
        let info: TTableInfo = db.tableInfo.get(table);
        if (info !== undefined) {
            tbl = info.pointer;
            def = info.def;
        } else {
            tbl = db.getTable(table);
            if (tbl === undefined) {
                throw new TParserError("Table " + table + " not found.");
            }
            def = readTableDefinition(tbl.data, true);
        }
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

export function processSelectStatement(db: SKSQL, context: TExecutionContext,
                                       statement: TQuerySelect) {
    let select: TQuerySelect = statement;

    context.currentStatement = select;

    let planDescription = "";
    let plan: TEP[] = generateExecutionPlanFromStatement(db, context, select);
    let recur = function (plan: TEP) {
        planDescription += "\t"
        if (plan.kind === "TEPScan") {
            let p = plan as TEPScan;
            let tblName = getValueForAliasTableOrLiteral(p.table);
            context.openTables = addTable2Plan(db, context.openTables, tblName.table, tblName.alias);
            context.openTables = addTable2Plan(db, context.openTables, p.result, p.result);
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
            context.openTables = addTable2Plan(db, context.openTables, src.table, src.alias);
            context.openTables = addTable2Plan(db, context.openTables, dest.table, dest.alias);
            planDescription += "[GroupBy " + src.table + "=>" + dest.table + "]";
        }
        if (plan.kind === "TEPSortNTop") {
            let p = plan as TEPSortNTop;
            planDescription += "[SortNTop]";
            context.openTables = addTable2Plan(db, context.openTables, p.source, p.source);
            context.openTables = addTable2Plan(db, context.openTables, p.dest, p.dest);
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

    run(db, context, select, plan);
    context.result.queries.push({
        statement: "",
        executionPlan: {
            description: planDescription
        },
        parserTime: 0,
        runtime: 0
    });



    //if (returnSQLResult.resultTableName !== undefined && returnSQLResult.resultTableName !== "") {
//        context.openedTempTables.push(returnSQLResult.resultTableName);
//    }


}