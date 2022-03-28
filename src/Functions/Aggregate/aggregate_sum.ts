import {numeric} from "../../Numeric/numeric";
import {numericLoad} from "../../Numeric/numericLoad";
import {numericAdd} from "../../Numeric/numericAdd";
import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";
import {isNumeric} from "../../Numeric/isNumeric";
import {TableColumnType} from "../../Table/TableColumnType";
import {numericCmp} from "../../Numeric/numericCmp";


export function aggregate_sum(context: TExecutionContext, mode: "init" | "row" | "final", isDistinct: boolean, groupInfo: any, input: numeric | number): any {
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
                        groupInfo.value = numericAdd(groupInfo.value, input as numeric);

                    } else {
                        groupInfo.value += input;
                    }

                }
            }
        }
        return groupInfo;
    }
    if (mode === "final") {
        if (isDistinct === true) {
            let sumValue = undefined;
            groupInfo.value.sort((a, b) => {
                if (typeof a === "number") {
                    if (a > b) { return 1;}
                    if (a < b) { return -1;}
                    return 0;
                } else {
                    return numericCmp(a, b);
                }
            });

            for (let i = 0; i < groupInfo.value.length; i++) {
                if (sumValue === undefined) {
                    sumValue = groupInfo.value[i];
                } else {
                    if (typeof sumValue === "number") {
                        if (groupInfo.value[i] !== groupInfo.value[i-1]) {
                            sumValue += groupInfo.value[i];
                        }
                    } else if (isNumeric(sumValue)) {
                        let cmp = numericCmp(groupInfo.value[i], groupInfo.value[i-1] as numeric);
                        if (cmp !== 0) {
                            sumValue = numericAdd(sumValue, groupInfo.value[i] as numeric);
                        }
                    }
                }
            }
            return sumValue;
        } else {
            return groupInfo.value;
        }
    }

}