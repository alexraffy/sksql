import {numericLoad} from "../../Numeric/numericLoad";
import {numericAdd} from "../../Numeric/numericAdd";
import {TableColumnType} from "../../Table/TableColumnType";
import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";
import {isNumeric} from "../../Numeric/isNumeric";
import {numeric} from "../../Numeric/numeric";
import {numericCmp} from "../../Numeric/numericCmp";


export function aggregate_count(context: TExecutionContext, mode: "init" | "row" | "final", isDistinct: boolean, groupInfo: any, input: any) {
    if (mode === "init") {
        groupInfo = {
            value: undefined
        };
        return groupInfo;
    }
    if (mode === "row") {
        if (input !== undefined) {
            if (groupInfo.value === undefined) {
                if (isDistinct === true) {
                    groupInfo.value = [input];
                } else {
                    groupInfo.value = 1;
                }
            } else {
                if (isDistinct === true) {
                    groupInfo.value.push(input);
                } else {
                    groupInfo.value += 1;
                }
            }
        }
        return groupInfo;
    }
    if (mode === "final") {
        if (isDistinct === true) {
            let countValue = undefined;
            groupInfo.value.sort((a, b) => {
                if (typeof a === "number") {
                    if (a > b) { return 1;}
                    if (a < b) { return -1;}
                    return 0;
                } else if (isNumeric(a)) {
                    return numericCmp(a, b);
                } else if (typeof a === "string") {
                    return a.localeCompare(b);
                } else if (typeof a === "boolean") {
                    return a === true;
                }
            });

            for (let i = 0; i < groupInfo.value.length; i++) {
                if (countValue === undefined) {
                    countValue = 1;
                } else {
                    if (typeof (groupInfo.value[0] === "number")) {
                        if (groupInfo.value[i] !== groupInfo.value[i-1]) {
                            countValue++;
                        }
                    } else if (isNumeric(groupInfo.value[0])) {
                        let cmp = numericCmp(groupInfo.value[i], groupInfo.value[i-1] as numeric);
                        if (cmp !== 0) {
                            countValue++;
                        }
                    }
                }
            }
            return countValue;
        } else {
            if (groupInfo.value === undefined) { return 0;}
            return groupInfo.value;
        }
    }
}