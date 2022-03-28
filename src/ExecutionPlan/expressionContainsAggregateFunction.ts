import {walkTree} from "./walkTree";
import {TExecutionContext} from "./TExecutionContext";
import {TValidStatementsInProcedure} from "../Query/Types/TValidStatementsInProcedure";
import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {TableColumnType} from "../Table/TableColumnType";
import {instanceOfTQueryFunctionCall} from "../Query/Guards/instanceOfTQueryFunctionCall";
import {kFunctionType} from "../Functions/kFunctionType";


export function expressionContainsAggregateFunction(db: any,
                                                    context: TExecutionContext,
                                                    currentStatement: TValidStatementsInProcedure,
                                                    tables: TTableWalkInfo[],
                                                    parameters: {name: string, type: TableColumnType, value: any}[],
                                                    o: any) {
    let ret: boolean = false;
    walkTree(db, context, currentStatement, tables, parameters, o, [],{status: "", extra: {}},
        (obj, parents, info) => {
        if (instanceOfTQueryFunctionCall(obj)) {
            if (info.functionData.data.type === kFunctionType.aggregate) {
                ret = true;
                return false;
            }
        }

        return true;
    });
    return ret;

}