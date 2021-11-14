import {ParseResult} from "../BaseParser/ParseResult";
import {TQuerySelect} from "../Query/Types/TQuerySelect";
import {SQLResult} from "./SQLResult";
import {instanceOfParseResult} from "../BaseParser/Guards/instanceOfParseResult";
import {instanceOfTQuerySelect} from "../Query/Guards/instanceOfTQuerySelect";
import {TTableWalkInfo} from "./TTableWalkInfo";
import {openTables} from "./openTables";
import {TEP} from "../ExecutionPlan/TEP";
import {generateExecutionPlanFromStatement} from "../ExecutionPlan/generateExecutionPlanFromStatement";
import {run} from "../ExecutionPlan/run";
import {DBData} from "./DBInit";
import {readTableDefinition} from "../Table/readTableDefinition";
import {readFirst} from "../Cursor/readFirst";
import {recordSize} from "../Table/recordSize";
import {TEPScan} from "../ExecutionPlan/TEPScan";
import {getValueForAliasTableOrLiteral} from "../Query/getValueForAliasTableOrLiteral";
import {TEPNestedLoop} from "../ExecutionPlan/TEPNestedLoop";
import {TEPSortNTop} from "../ExecutionPlan/TEPSortNTop";
import {TEPSelect} from "../ExecutionPlan/TEPSelect";
import {TEPGroupBy} from "../ExecutionPlan/TEPGroupBy";


function addTable(tables: TTableWalkInfo[], table: string, alias: string) {
    if (table === undefined || table === "") {
        return tables;
    }
    if (alias === undefined || alias === "") {
        alias = table;
    }
    let exists = tables.find((t) => { return t.name.toUpperCase() === table.toUpperCase();});
    if (!exists) {
        let tbl = DBData.instance.getTable(table);
        if (tbl === undefined) {
            throw "Could not find table " + table;
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

export function processSelectStatement(parseResult: ParseResult, statement: TQuerySelect, parameters: {name: string, value: any}[]): SQLResult {
    if (!instanceOfParseResult(parseResult) || !instanceOfTQuerySelect(statement)) {
        return {
            error: "Misformed Select Query.",
            resultTableName: "",
            rowCount: 0,
            executionPlan: {
                description: ""
            }
        } as SQLResult;
    }
    let select: TQuerySelect = statement;
    let columnsNeededForWhereClause: {tableName: string, columnName: string}[] = [];
    let tables: TTableWalkInfo[] = [];

    let planDescription = "";
    let plan: TEP[] = generateExecutionPlanFromStatement(select);
    let recur = function (plan: TEP) {
        planDescription += "\t"
        if (plan.kind === "TEPScan") {
            let p = plan as TEPScan;
            let tblName = getValueForAliasTableOrLiteral(p.table);
            tables = addTable(tables, tblName.table, tblName.alias);
            tables = addTable(tables, p.result, p.result);
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
            tables = addTable(tables, src.table, src.alias);
            tables = addTable(tables, dest.table, dest.alias);
            planDescription += "[GroupBy " + src.table + "=>" + dest.table + "]";
        }
        if (plan.kind === "TEPSortNTop") {
            let p = plan as TEPSortNTop;
            planDescription += "[SortNTop]";
            tables = addTable(tables, p.source, p.source);
            tables = addTable(tables, p.dest, p.dest);
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

    let returnSQLResult = run(select, plan, parameters, tables);
    returnSQLResult.executionPlan = {
        description: planDescription
    };

    return returnSQLResult;



}