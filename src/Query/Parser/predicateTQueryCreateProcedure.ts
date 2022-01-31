import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {str} from "../../BaseParser/Predicates/str";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {literal} from "../../BaseParser/Predicates/literal";
import {TQueryCreateFunction} from "../Types/TQueryCreateFunction";
import {TColumnType} from "../Types/TColumnType";
import {TQueryCreateProcedure} from "../Types/TQueryCreateProcedure";
import {predicateTString} from "./predicateTString";
import {exitIf} from "../../BaseParser/Predicates/exitIf";
import {predicateValidStatementsInFunction} from "./predicateValidStatementsInFunction";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {predicateTVariable} from "./predicateTVariable";
import {predicateTColumnType} from "./predicateTColumnType";
import {TVariable} from "../Types/TVariable";
import {TValidExpressions} from "../Types/TValidExpressions";
import {predicateTQueryExpression} from "./predicateTQueryExpression";
import {predicateValidExpressions} from "./predicateValidExpressions";
import {predicateValidStatementsInProcedure} from "./predicateValidStatementsInProcedure";


export function * predicateTQueryCreateProcedure(callback) {
    let ret: TQueryCreateProcedure = {
        kind: "TQueryCreateProcedure",
        procName: "",
        parameters: [],
        ops: []
    };
    yield str("CREATE");
    yield atLeast1(whitespaceOrNewLine);
    let gotOr = yield maybe(str("OR"));
    if (gotOr) {
        yield atLeast1(whitespaceOrNewLine);
        yield str("ALTER");
        yield atLeast1(whitespaceOrNewLine);
    }
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield oneOf([str("PROCEDURE"), str("PROC")], "");
    yield maybe(atLeast1(whitespaceOrNewLine));
    ret.procName = yield literal;
    yield atLeast1(whitespaceOrNewLine);

    // parameters
    let gotMore = ",";
    while (gotMore === ",") {
        yield maybe(atLeast1(whitespaceOrNewLine));
        let variable = yield maybe(predicateTVariable);
        if (variable !== undefined) {
            let p: {
                variableName: TVariable;
                type: TColumnType;
                defaultValue?: TValidExpressions;
                output: boolean
            }  = {
                variableName: variable,
                type: {
                    kind: "TColumnType",
                    type: "ANY",
                    size: {
                        kind: "TNumber",
                        value: "1"
                    },
                    isNullable: {
                        kind: "TBoolValue",
                        value: false
                    }
                },
                output: false
            }
            yield atLeast1(whitespaceOrNewLine);
            p.type = yield predicateTColumnType;
            yield maybe(atLeast1(whitespaceOrNewLine));
            let gotDefault = yield maybe(str("="));
            if (gotDefault !== undefined) {
                yield maybe(atLeast1(whitespaceOrNewLine));
                p.defaultValue = yield oneOf([predicateTQueryExpression, predicateValidExpressions], "");
                yield maybe(atLeast1(whitespaceOrNewLine));
            }
            let output = yield maybe(oneOf([str("OUTPUT"), str("OUT"), str("READONLY")], ""));
            p.output = output !== undefined && (output.toUpperCase() === "OUTPUT" || output.toUpperCase() === "OUT");
            ret.parameters.push(p);
        }
        yield maybe(atLeast1(whitespaceOrNewLine));
        gotMore = yield maybe(str(","));
    }



    // options are not supported but to keep a compat with t-sql we parse them anyway
    const gotOptions = yield maybe(str("WITH"));
    if (gotOptions !== undefined) {
        let gotMoreOption = true;
        while (gotMoreOption === true) {
            yield maybe(atLeast1(whitespaceOrNewLine));
            let option = yield oneOf([str("ENCRYPTION"), str("RECOMPILE"), str("EXECUTE")], "");
            if (option !== undefined && option.toUpperCase() === "EXECUTE") {
                yield atLeast1(whitespaceOrNewLine);
                yield str("AS")
                yield atLeast1(whitespaceOrNewLine);
                yield oneOf([literal, predicateTString], "");
            }
            yield maybe(atLeast1(whitespaceOrNewLine));
            gotMoreOption = yield maybe(str(","));
        }
    }

    yield str("AS");
    yield atLeast1(whitespaceOrNewLine);
    yield str("BEGIN");
    yield atLeast1(whitespaceOrNewLine);

    yield maybe(atLeast1(whitespaceOrNewLine));
    let gotExit = yield exitIf(str("END"));
    while (!gotExit) {
        yield maybe(atLeast1(whitespaceOrNewLine));
        let op = yield predicateValidStatementsInProcedure;

        ret.ops.push(op);
        yield maybe(atLeast1(whitespaceOrNewLine));
        yield maybe(str(";"));
        yield maybe(atLeast1(whitespaceOrNewLine));
        gotExit = yield exitIf(str("END"));
    }
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield str("END");
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield returnPred(ret);


}