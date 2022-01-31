import {TEPNestedLoop} from "./TEPNestedLoop";
import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {runScan} from "./runScan";
import {TableColumnType} from "../Table/TableColumnType";
import {TExecutionContext} from "./TExecutionContext";


export function runNestedLoop(context: TExecutionContext,
                              tep: TEPNestedLoop,
                              onRowSelected: (tep: TEPNestedLoop, walkInfos: TTableWalkInfo[]) => boolean) {

    runScan(context, tep.a, (scan, walking) => {
        if (tep.b.kind === "TEPScan") {
            runScan(context, tep.b, (scanN, walkingN) => {
                return onRowSelected(tep, context.openTables);
            });
        } else if (tep.b.kind === "TEPNestedLoop") {
            runNestedLoop(context, tep.b, (tepN, walkInfos: TTableWalkInfo[]) => {
                return onRowSelected(tep, context.openTables);
            })
        }
        return true;
    });


}