
import {TQuerySelect} from "../Query/Types/TQuerySelect";
import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {TEP} from "./TEP";

import {run} from "./run";
import {SKSQL} from "../API/SKSQL";
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

// Process a SELECT statement
// generate an execution plan and run it.

export function processSelectStatement(db: SKSQL, context: TExecutionContext,
                                       statement: TQuerySelect, isSubQuery: boolean = false, options: { printDebug: boolean} = {printDebug: false}) {
    let select: TQuerySelect = statement;

    context.currentStatement = select;

    let planDescription = "";
    let plan: TEP[] = generateEP(db, context, select, options);


    run(db, context, select, plan);
    context.result.queries.push({
        statement: "",
        executionPlan: {
            description: planDescription
        },
        parserTime: 0,
        runtime: 0
    });

    if (plan.length > 0) {
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
    }
    return undefined;

}