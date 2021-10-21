import {TEPNestedLoop} from "./TEPNestedLoop";
import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {runScan} from "./runScan";


export function runNestedLoop(tep: TEPNestedLoop, parameters: {name: string, value: any}[], tables: TTableWalkInfo[], onRowSelected: (tep: TEPNestedLoop, walkInfos: TTableWalkInfo[]) => boolean) {

    runScan(tep.a, parameters, tables, (scan, walking) => {
        if (tep.b.kind === "TEPScan") {
            runScan(tep.b, parameters, tables, (scanN, walkingN) => {
                return onRowSelected(tep, tables);
            });
        } else if (tep.b.kind === "TEPNestedLoop") {
            runNestedLoop(tep.b, parameters, tables, (tepN, walkInfos: TTableWalkInfo[]) => {
                return onRowSelected(tep, tables);
            })
        }
        return true;
    });


}