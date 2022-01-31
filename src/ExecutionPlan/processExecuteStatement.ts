import {ParseResult} from "../BaseParser/ParseResult";
import {TQuerySelect} from "../Query/Types/TQuerySelect";
import {TableColumnType} from "../Table/TableColumnType";
import {SQLResult} from "../API/SQLResult";
import {instanceOfParseResult} from "../BaseParser/Guards/instanceOfParseResult";
import {instanceOfTQuerySelect} from "../Query/Guards/instanceOfTQuerySelect";
import {instanceOfTExecute} from "../Query/Guards/instanceOfTExecute";
import {TExecute} from "../Query/Types/TExecute";
import {runFunction} from "./runFunction";
import {runProcedure} from "./runProcedure";
import {TParserError} from "../API/TParserError";
import {SKSQL} from "../API/SKSQL";
import {TExecutionContext} from "./TExecutionContext";
import {evaluate} from "../API/evaluate";
import {typeString2TableColumnType} from "../API/typeString2TableColumnType";
import {instanceOfTVariable} from "../Query/Guards/instanceOfTVariable";
import {TVariable} from "../Query/Types/TVariable";


export function processExecuteStatement(context: TExecutionContext,
                                        statement: TExecute): SQLResult {
    if (!instanceOfTExecute(statement)) {
        return {
            error: "Misformed Execute Query.",
            resultTableName: "",
            rowCount: 0,
            executionPlan: {
                description: ""
            }
        } as SQLResult;
    }

    let proc = SKSQL.instance.procedures.find((p) => { return p.procName.toUpperCase() === statement.procName.toUpperCase();});
    if (proc !== undefined) {
        let newContext: TExecutionContext = JSON.parse(JSON.stringify(context));
        newContext.label = proc.procName;
        newContext.stack = [];
        let gotOutput = false;
        for (let i = 0; i < proc.parameters.length; i++) {
            let p = proc.parameters[i];
            let newParameter = {name: p.variableName.name, type: typeString2TableColumnType(p.type.type), value: undefined};
            let exists = statement.parameters.find((param) => { return param.name.name === p.variableName.name;});
            let gotParameter = false;
            if (exists) {
                if (exists.value !== undefined) {
                    let value = evaluate(context, exists.value, undefined);
                    newParameter.value = value;
                    gotParameter = true;
                    if (exists.output === true) {
                        gotOutput = true;
                    }
                }
            } else {
                // index ?
                let existsByIndex = statement.parameters.find((param) => { return param.order === i;});
                if (existsByIndex) {
                    if (existsByIndex) {
                        let value = evaluate(context, existsByIndex.value, undefined);
                        newParameter.value = value;
                        gotParameter = true;
                        if (existsByIndex.output === true) {
                            gotOutput = true;
                        }
                    }
                }
            }
            if (gotParameter === false) {
                if (p.defaultValue !== undefined) {
                    let value = evaluate(context, p.defaultValue, undefined);
                    newParameter.value = true;
                }
            }
            newContext.stack.push(newParameter);
        }

        runProcedure(newContext, statement, proc);

        if (gotOutput) {
            for (let i = 0; i < statement.parameters.length; i++) {
                let p = statement.parameters[i];
                if (p.output === true) {
                    if (instanceOfTVariable(p.value)) {
                        let param1 = proc.parameters.find((param1) => { return param1.variableName.name === p.name.name;});
                        let fromNewStack = newContext.stack.find((pc) => { return pc.name === param1.variableName.name;});
                        let fromStack = context.stack.find((pc) => { return pc.name === (p.value as TVariable).name;});
                        for (let x = 0; x < context.stack.length; x++) {
                            if (context.stack[x].name === (p.value as TVariable).name && fromNewStack !== undefined) {
                                context.stack[x].value = fromNewStack.value;
                            }
                        }
                    }
                }
            }
        }
        console.dir(context);

    } else {
        throw new TParserError("Could not find procedure " + proc.procName);
    }

}