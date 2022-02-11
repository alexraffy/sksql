import {TEPNestedLoop} from "./TEPNestedLoop";
import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {runScan} from "./runScan";
import {TableColumnType} from "../Table/TableColumnType";
import {TExecutionContext} from "./TExecutionContext";
import {SKSQL} from "../API/SKSQL";


export function runNestedLoop(db: SKSQL, context: TExecutionContext,
                              tep: TEPNestedLoop,
                              onRowSelected: (tep: TEPNestedLoop, walkInfos: TTableWalkInfo[]) => boolean) {

    runScan(db, context, tep.a, (scan, walking) => {
        if (tep.b.kind === "TEPScan") {
            runScan(db, context, tep.b, (scanN, walkingN) => {
                return onRowSelected(tep, context.openTables);
            });
        } else if (tep.b.kind === "TEPNestedLoop") {
            runNestedLoop(db, context, tep.b, (tepN, walkInfos: TTableWalkInfo[]) => {
                return onRowSelected(tep, context.openTables);
            })
        }
        return true;
    });


}