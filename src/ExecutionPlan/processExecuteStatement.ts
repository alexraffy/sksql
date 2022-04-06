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
import {cloneContext} from "./cloneContext";
import {addNewestResultToList} from "./addNewestResultToList";
import {swapContext} from "./swapContext";

// Process a EXECUTE/EXEC statement
//
// Execute the procedure in a new context and switch back after
// If the procedure returns data with a SELECT statement, we add the result to the calling context
// If OUTPUT is specified for a parameter, we update the variable in the calling context afterward.


export function processExecuteStatement(db: SKSQL,
                                        context: TExecutionContext,
                                        statement: TExecute): SQLResult {
    if (!instanceOfTExecute(statement)) {
        context.result.error = "Misformed Execute Query.";
        return;
    }

    let proc = db.procedures.find((p) => { return p.procName.toUpperCase() === statement.procName.toUpperCase();});
    if (proc !== undefined) {
        let newContext: TExecutionContext = cloneContext(context, "Execute ", false, true);
        newContext.label = proc.procName;
        newContext.stack = [];
        newContext.currentStatement = proc;
        let gotOutput = false;
        for (let i = 0; i < proc.parameters.length; i++) {
            let p = proc.parameters[i];
            let newParameter = {name: p.variableName.name, type: typeString2TableColumnType(p.type.type), value: undefined};
            let exists = statement.parameters.find((param) => { return param.name.name === p.variableName.name;});
            let gotParameter = false;
            if (exists) {
                if (exists.value !== undefined) {
                    let value = evaluate(db, context, exists.value,  [], undefined);
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
                        let value = evaluate(db, context, existsByIndex.value,  [],  undefined);
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
                    let value = evaluate(db, context, p.defaultValue,  [],  undefined);
                    newParameter.value = true;
                }
            }
            newContext.stack.push(newParameter);
        }

        runProcedure(db, newContext, statement, proc);
        context.broadcastQuery = newContext.broadcastQuery;
        swapContext(context, newContext);
        context.exitExecution = false;
        addNewestResultToList(context, newContext);

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


    } else {
        throw new TParserError("Could not find procedure " + proc.procName);
    }

}