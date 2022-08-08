
import {TQuerySelect} from "../Query/Types/TQuerySelect";
import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {TEP, TExecutionPlan} from "./TEP";

import {run} from "./run";
import {kDebugLevel, SKSQL} from "../API/SKSQL";
import {readTableDefinition} from "../Table/readTableDefinition";
import {readFirst} from "../Cursor/readFirst";
import {recordSize} from "../Table/recordSize";
import {TEPSelect} from "./TEPSelect";
import {TParserError} from "../API/TParserError";
import {TExecutionContext} from "./TExecutionContext";
import {ITable} from "../Table/ITable";
import {ITableDefinition} from "../Table/ITableDefinition";
import {TTableInfo} from "../API/CTableInfoManager";
import {TEPUpdate} from "./TEPUpdate";
import {TTable} from "../Query/Types/TTable";
import {generateEP} from "./generateEP";
import {getResultTableFromExecutionPlanSteps} from "./getResultTableFromExecutionPlanSteps";
import {dumpContextInfo} from "./dumpContextInfo";
import {serializeTQuery} from "../API/serializeTQuery";

// Process a SELECT statement
// generate an execution plan and run it.

export function processSelectStatement(db: SKSQL, context: TExecutionContext,
                                       statement: TQuerySelect, isSubQuery: boolean = false, options: {
        previousContext?: TExecutionContext,
        printDebug: boolean
} = { previousContext: undefined, printDebug: false}) {
    let select: TQuerySelect = statement;

    context.currentStatement = select;

    if (context.accessRights !== undefined && context.accessRights.indexOf("R") === -1) {
        throw new TParserError("SELECT: NO READ ACCESS.");
    }

    if (db.debugLevel >= kDebugLevel.L990_contextUpdate) {
        console.log("processSelectStatement Start for " + serializeTQuery(statement));
        console.log(dumpContextInfo(context, "processSelectStatement START"));
    }


    let planDescription = "";
    let plan: TExecutionPlan[] = generateEP(db, context, select, options);

    for (let i = 0; i < plan.length; i++) {
        run(db, context, select, plan[i]);
    }
    context.result.queries.push({
        statement: "",
        executionPlan: {
            description: planDescription
        },
        parserTime: 0,
        runtime: 0
    });

    if (plan.length > 0) {
        let resultTableName = getResultTableFromExecutionPlanSteps(plan[plan.length-1]);
        if (db.debugLevel >= kDebugLevel.L990_contextUpdate) {
            console.log("processSelectStatement End Result in: " + resultTableName);
        }
        return {
            kind: "TTable",
            table: resultTableName,
            schema: ""
        } as TTable;
        /*
        // TODO REMOVE

        switch (plan[plan.length -1].kind) {
            case "TEPSelect": {
                let ps = plan[plan.length - 1] as TEPSelect;
                return {
                    kind: "TTable",
                    table: ps.dest,
                    schema: ""
                } as TTable
            }
                break;
            case "TEPUpdate": {
                let ps = plan[plan.length - 1] as TEPUpdate;
                return {
                    kind: "TTable",
                    table: ps.dest,
                    schema: ""
                } as TTable
            }
                break;
        }

         */
    }
    return undefined;

}