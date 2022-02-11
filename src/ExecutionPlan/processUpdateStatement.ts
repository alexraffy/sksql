import {TQueryUpdate} from "../Query/Types/TQueryUpdate";
import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {instanceOfParseResult} from "../BaseParser/Guards/instanceOfParseResult";
import {ParseResult} from "../BaseParser/ParseResult";
import {instanceOfTQueryUpdate} from "../Query/Guards/instanceOfTQueryUpdate";
import {SQLResult} from "../API/SQLResult";
import {openTables} from "../API/openTables";
import {cursorEOF} from "../Cursor/cursorEOF";
import {readNext} from "../Cursor/readNext";
import {evaluateWhereClause} from "../API/evaluateWhereClause";
import {evaluate} from "../API/evaluate";
import {writeValue} from "../BlockIO/writeValue";
import {getColumnDefinition} from "../API/getColumnDefinition";
import {kBlockHeaderField} from "../Blocks/kBlockHeaderField";
import {isNumeric} from "../Numeric/isNumeric";
import {TParserError} from "../API/TParserError";

import {convertValue} from "../API/convertValue";
import {TExecutionContext} from "./TExecutionContext";
import {runScan} from "./runScan";
import {TEP} from "./TEP";
import {generateExecutionPlanFromStatement} from "./generateExecutionPlanFromStatement";
import {TEPScan} from "./TEPScan";
import {getValueForAliasTableOrLiteral} from "../Query/getValueForAliasTableOrLiteral";
import {TEPNestedLoop} from "./TEPNestedLoop";
import {TEPGroupBy} from "./TEPGroupBy";
import {TEPSortNTop} from "./TEPSortNTop";
import {TEPSelect} from "./TEPSelect";
import {addTable2Plan} from "./processSelectStatement";
import {run} from "./run";
import {runUpdatePlan} from "./runUpdatePlan";
import {TEPUpdate} from "./TEPUpdate";
import {cloneContext} from "./cloneContext";
import {SKSQL} from "../API/SKSQL";


export function processUpdateStatement(db: SKSQL, context: TExecutionContext, statement: TQueryUpdate) {

    let update = statement as TQueryUpdate;

    let numberOfRowsModified: number = 0;
    let done = false;
    let tables = openTables(db, statement);
    //let newContext: TExecutionContext = cloneContext(context, "update", true, false);
    //newContext.openTables = tables;

    let planDescription = "";
    let plan: TEP[] = generateExecutionPlanFromStatement(db, context, statement);
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
            planDescription += "[SELECT " + p.dest + "]";
        }
        if (plan.kind === "TEPUpdate") {
            let p = plan as TEPUpdate;
            planDescription += "[UPDATE " + p.dest + " ";
            for (let x = 0; x < p.sets.length; x++) {
                planDescription += p.sets[x].column;
                if (x < p.sets.length - 1) {
                    planDescription += ", ";
                }
            }
            planDescription +=  "]";
        }
    }
    for (let i = 0; i < plan.length; i++) {
        recur(plan[i]);
    }

    runUpdatePlan(db, context, statement, plan);

    context.broadcastQuery = true;


}