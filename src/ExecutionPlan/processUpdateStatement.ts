import {TQueryUpdate} from "../Query/Types/TQueryUpdate";
import {TExecutionContext} from "./TExecutionContext";
import {TEP, TExecutionPlan} from "./TEP";
import {TEPScan} from "./TEPScan";
import {getValueForAliasTableOrLiteral} from "../Query/getValueForAliasTableOrLiteral";
import {TEPNestedLoop} from "./TEPNestedLoop";
import {TEPGroupBy} from "./TEPGroupBy";
import {TEPSortNTop} from "./TEPSortNTop";
import {TEPSelect} from "./TEPSelect";
import {runUpdatePlan} from "./runUpdatePlan";
import {TEPUpdate} from "./TEPUpdate";
import {SKSQL} from "../API/SKSQL";
import {openTable} from "../API/openTables";
import {generateEP} from "./generateEP";


// Process a UPDATE statement


export function processUpdateStatement(db: SKSQL, context: TExecutionContext, statement: TQueryUpdate) {

    let update = statement as TQueryUpdate;

    let numberOfRowsModified: number = 0;
    let done = false;
    let tables = openTable(db, context, statement);
    //let newContext: TExecutionContext = cloneContext(context, "update", true, false);
    //newContext.openTables = tables;

    let planDescription = "";
    let plan: TExecutionPlan[] = generateEP(db, context, statement);
    let recur = function (plan: TEP) {
        planDescription += "\t"
        if (plan.kind === "TEPScan") {
            let p = plan as TEPScan;
            let tblName = getValueForAliasTableOrLiteral(p.table);
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
            planDescription += "[GroupBy " + src.table + "=>" + dest.table + "]";
        }
        if (plan.kind === "TEPSortNTop") {
            let p = plan as TEPSortNTop;
            planDescription += "[SortNTop]";
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
        for (let x = 0; x < plan[i].steps.length; x++) {
            recur(plan[i].steps[x]);
        }
        runUpdatePlan(db, context, statement, plan[i].steps);
    }



    context.broadcastQuery = true;


}