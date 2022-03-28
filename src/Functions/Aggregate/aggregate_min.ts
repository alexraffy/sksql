import {numericLoad} from "../../Numeric/numericLoad";
import {numeric} from "../../Numeric/numeric";
import {numericCmp} from "../../Numeric/numericCmp";
import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";
import {isNumeric} from "../../Numeric/isNumeric";
import {TableColumnType} from "../../Table/TableColumnType";


export function aggregate_min(context: TExecutionContext, mode: "init" | "row" | "final", isDistinct: boolean, groupInfo: any, input: numeric | number) {
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
                    groupInfo.value = input;
                }
            } else {
                if (isDistinct === true) {
                    let ta = (isNumeric(groupInfo.value[0])) ? TableColumnType.numeric : TableColumnType.int32;
                    let tb = (isNumeric(input)) ? TableColumnType.numeric : TableColumnType.int32;
                    if (ta === TableColumnType.numeric || tb === TableColumnType.numeric) {
                        if (ta === TableColumnType.int32) {
                            groupInfo.value[0] = numericLoad(groupInfo.value[0].toString());
                        }
                        if (tb === TableColumnType.int32) {
                            input = numericLoad(input.toString());
                        }
                    }
                    groupInfo.value.push(input);
                } else {
                    let ta = (isNumeric(groupInfo.value)) ? TableColumnType.numeric : TableColumnType.int32;
                    let tb = (isNumeric(input)) ? TableColumnType.numeric : TableColumnType.int32;
                    if (ta === TableColumnType.numeric || tb === TableColumnType.numeric) {
                        if (ta === TableColumnType.int32) {
                            groupInfo.value = numericLoad(groupInfo.value.toString());
                        }
                        if (tb === TableColumnType.int32) {
                            input = numericLoad(input.toString());
                        }
                        let cmp = numericCmp(groupInfo.value, input as numeric);
                        if (cmp === 1) {
                            groupInfo.value = input;
                        }
                    } else {
                        if (input < groupInfo.value) {
                            groupInfo.value = input;
                        }
                    }

                }
            }
        }
        return groupInfo;
    }
    if (mode === "final") {
        if (isDistinct === true) {
            let minValue = undefined;
            for (let i = 0; i < groupInfo.value.length; i++) {
                if (minValue === undefined) {
                    minValue = groupInfo.value[i];
                } else {
                    if (typeof minValue === "number") {
                        if (groupInfo.value[i] < minValue) {
                            minValue = groupInfo.value[i];
                        }
                    } else if (isNumeric(minValue)) {
                        let cmp = numericCmp(minValue, groupInfo.value[i] as numeric);
                        if (cmp === 1) {
                            minValue = groupInfo.value[i];
                        }
                    }
                }
            }
            return minValue;
        } else {
            return groupInfo.value;
        }
    }
}