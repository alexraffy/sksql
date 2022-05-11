import {TEPNestedLoop} from "./TEPNestedLoop";
import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {runScan} from "./runScan";
import {TableColumnType} from "../Table/TableColumnType";
import {TExecutionContext} from "./TExecutionContext";
import {SKSQL} from "../API/SKSQL";
import {kQueryJoin} from "../Query/Enums/kQueryJoin";


// run a nested loop stage from an execution plan.


export function runNestedLoop(db: SKSQL, context: TExecutionContext,
                              tep: TEPNestedLoop,
                              onRowSelected: (tep: TEPNestedLoop, walkInfos: TTableWalkInfo[]) => boolean) {

    runScan(db, context, tep.a, context.tables, (scan, walking) => {
        if (tep.b.kind === "TEPScan") {
            let scanResult = runScan(db, context, tep.b, context.tables, (scanN, walkingN) => {
                return onRowSelected(tep, context.tables);
            });
            if (scanResult.rowsSelected === 0 && tep.joinType === kQueryJoin.left) {
                onRowSelected(tep, context.tables);
            }
        } else if (tep.b.kind === "TEPNestedLoop") {
            runNestedLoop(db, context, tep.b, (tepN, walkInfos: TTableWalkInfo[]) => {
                return onRowSelected(tep, context.tables);
            })
        }
        return true;
    });



}