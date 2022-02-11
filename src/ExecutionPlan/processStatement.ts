import {TValidStatementsInFunction} from "../Query/Types/TValidStatementsInFunction";
import {instanceOfTDebugger} from "../Query/Guards/instanceOfTDebugger";
import {evaluateWhereClause} from "../API/evaluateWhereClause";
import {serializeTQuery} from "../API/serializeTQuery";
import {instanceOfTBreak} from "../Query/Guards/instanceOfTBreak";
import {instanceOfTVariableAssignment} from "../Query/Guards/instanceOfTVariableAssignment";
import {evaluate} from "../API/evaluate";
import {isNumeric} from "../Numeric/isNumeric";
import {columnTypeIsInteger} from "../Table/columnTypeIsInteger";
import {numericToNumber} from "../Numeric/numericToNumber";
import {TableColumnType} from "../Table/TableColumnType";
import {numericFromNumber} from "../Numeric/numericFromNumber";
import {instanceOfTVariableDeclaration} from "../Query/Guards/instanceOfTVariableDeclaration";
import {instanceOfTColumnType} from "../Query/Guards/instanceOfTColumnType";
import {typeString2TableColumnType} from "../API/typeString2TableColumnType";
import {instanceOfTReturnValue} from "../Query/Guards/instanceOfTReturnValue";
import {instanceOfTBeginEnd} from "../Query/Guards/instanceOfTBeginEnd";
import {instanceOfTWhile} from "../Query/Guards/instanceOfTWhile";
import {instanceOfTIf} from "../Query/Guards/instanceOfTIf";
import {instanceOfTQueryFunctionCall} from "../Query/Guards/instanceOfTQueryFunctionCall";
import {TExecutionContext} from "./TExecutionContext";
import {instanceOfTQueryCreateProcedure} from "../Query/Guards/instanceOfTQueryCreateProcedure";
import {instanceOfTQueryCreateFunction} from "../Query/Guards/instanceOfTQueryCreateFunction";
import {instanceOfTQueryCreateTable} from "../Query/Guards/instanceOfTQueryCreateTable";
import {instanceOfTQueryInsert} from "../Query/Guards/instanceOfTQueryInsert";
import {instanceOfTQueryUpdate} from "../Query/Guards/instanceOfTQueryUpdate";
import {instanceOfTQueryDelete} from "../Query/Guards/instanceOfTQueryDelete";
import {processCreateStatement} from "./processCreateStatement";
import {processCreateProcedureStatement} from "./processCreateProcedureStatement";
import {processCreateFunctionStatement} from "./processCreateFunctionStatement";
import {processInsertStatement} from "./processInsertStatement";
import {processUpdateStatement} from "./processUpdateStatement";
import {processDeleteStatement} from "./processDeleteStatement";
import {TValidStatementsInProcedure} from "../Query/Types/TValidStatementsInProcedure";
import {instanceOfTQuerySelect} from "../Query/Guards/instanceOfTQuerySelect";
import {processSelectStatement} from "./processSelectStatement";
import {instanceOfTExecute} from "../Query/Guards/instanceOfTExecute";
import {runProcedure} from "./runProcedure";
import {processExecuteStatement} from "./processExecuteStatement";
import {instanceOfTQueryDropTable} from "../Query/Guards/instanceOfTQueryDropTable";
import {processDropTableStatement} from "./processDropTableStatement";
import {TParserError} from "../API/TParserError";
import {SKSQL} from "../API/SKSQL";


export function processStatement(db: SKSQL, context: TExecutionContext, op: TValidStatementsInProcedure) {
    if (context.rollback === true) {
        throw new TParserError(context.rollbackMessage);
    }


    if (instanceOfTDebugger(op)) {
        let shouldDisplay = true;
        if (op.test !== undefined) {
            shouldDisplay = evaluateWhereClause(db, context, op.test, {aggregateMode: "none", aggregateObjects: [], forceTable: ""});
        }
        if (shouldDisplay) {
            let debugStr = "-- FROM " + context.label + "\r\n";
            if (op.label !== undefined) {
                debugStr += "-- LABEL " + op.label.value + "\r\n";
            }
            if (op.test !== undefined) {
                debugStr += "-- TEST " + serializeTQuery(op.test) + "\r\n";
            }
            for (let i = 0; i < context.stack.length; i++) {
                debugStr += context.stack[i].name + " = " + context.stack[i].value + "\r\n";
            }
            console.log(debugStr);
        }
        return;
    }

    if (instanceOfTBreak(op)) {
        // exit current loop
        context.breakLoop = true;
        return;
    }


    if (instanceOfTVariableAssignment(op)) {
        let varExists = context.stack.find((v) => { return v.name.toUpperCase() === op.name.name.toUpperCase();});
        if (varExists) {
            let val = evaluate(db, context, op.value, undefined, {aggregateMode: "none", aggregateObjects: [], forceTable: ""});
            if (isNumeric(val) && columnTypeIsInteger(varExists.type)) {
                varExists.value = numericToNumber(val);
            } else if (typeof val === "number" && varExists.type === TableColumnType.numeric) {
                varExists.value = numericFromNumber(val);
            } else {
                varExists.value = val;
            }
        }
        return;
    }
    if (instanceOfTVariableDeclaration(op)) {
        for (let i = 0; i < op.declarations.length; i++) {
            let value = undefined;
            if (op.declarations[i].value !== undefined) {
                value = evaluate(db, context, op.declarations[i].value, undefined, {
                    aggregateMode: "none",
                    aggregateObjects: [],
                    forceTable: ""
                });
            }
            let varExists = context.stack.find((v) => {
                return v.name.toUpperCase() === op.declarations[i].name.name.toUpperCase();
            });
            if (varExists) {

            } else {
                let type: string;
                if (instanceOfTColumnType(op.declarations[i].type)) {
                    //@ts-ignore
                    type = op.declarations[i].type.type;
                } else {
                    type = op.declarations[i].type;
                }
                context.stack.push({name: op.declarations[i].name.name, type: typeString2TableColumnType(type), value: value})
            }
        }
        return;
    }
    if (instanceOfTReturnValue(op)) {
        let value = evaluate(db, context, op.value, undefined, {aggregateMode: "none", aggregateObjects: [], forceTable: ""});
        context.returnValue = value;
        context.exitExecution = true;
        return;
    }
    if (instanceOfTBeginEnd(op)) {
        for (let x = 0; x < op.ops.length; x++) {
            processStatement(db, context, op.ops[x]);
            if (context.exitExecution === true) {
                return context.returnValue;
            }
            if (context.breakLoop === true) {
                break;
            }
        }
        return;
    }
    if (instanceOfTWhile(op)) {
        let test = evaluateWhereClause(db, context, op.test, {aggregateMode: "none", aggregateObjects: [], forceTable: ""});
        while (test) {
            for (let i = 0; i < op.op.length; i++) {
                processStatement(db, context, op.op[i]);
                if (context.exitExecution === true) {
                    return context.returnValue;
                }
                if (context.breakLoop === true) {
                    break;
                }
            }
            if (context.breakLoop === true) {
                context.breakLoop = false;
                break;
            }
            test = evaluateWhereClause(db, context, op.test, {aggregateMode: "none", aggregateObjects: [], forceTable: ""});
        }
        return;
    }
    if (instanceOfTIf(op)) {
        for (let x = 0; x < op.tests.length; x++) {
            if (op.tests[x].test !== undefined) {
                let evalRet = evaluateWhereClause(db, context, op.tests[x].test, {aggregateMode: "none", aggregateObjects: [], forceTable: ""});
                if (evalRet === false) {
                    continue;
                }
            }
            for (let i = 0; i < op.tests[x].op.length; i++) {
                processStatement(db, context, op.tests[x].op[i]);
                if (context.exitExecution === true) {
                    return;
                }
                if (context.breakLoop === true) {
                    //exitCurrentLoop = false;
                    break;
                }
            }
            break;
        }
        return;
    }
    if (instanceOfTQueryFunctionCall(op)) {
        evaluate(db, context, op, undefined, {aggregateMode: "none", aggregateObjects: [], forceTable: ""});
        return;
    }
    if (instanceOfTExecute(op)) {
        processExecuteStatement(db, context, op);
        return;
    }
    if (instanceOfTQueryCreateProcedure(op)) {
        processCreateProcedureStatement(db, context, op);
        return;
    }
    if (instanceOfTQueryCreateFunction(op)) {
        processCreateFunctionStatement(db, context, op);
        return;
    }
    if (instanceOfTQueryCreateTable(op)) {
        processCreateStatement(db, context, op);
        return;
    }
    if (instanceOfTQueryInsert(op)) {
        processInsertStatement(db, context, op);
        return;
    }
    if (instanceOfTQueryUpdate(op)) {
        processUpdateStatement(db, context, op);
        return;
    }
    if (instanceOfTQueryDelete(op)) {
        processDeleteStatement(db, context, op);
        return;
    }
    if (instanceOfTQuerySelect(op)) {
        processSelectStatement(db, context, op);
        return;
    }
    if (instanceOfTQueryDropTable(op)) {
        processDropTableStatement(db, context, op);
        return;
    }

}