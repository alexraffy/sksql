import {str} from "../../BaseParser/Predicates/str";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {predicateTVariable} from "./predicateTVariable";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {literal} from "../../BaseParser/Predicates/literal";
import {predicateValidExpressions} from "./predicateValidExpressions";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {predicateTQueryExpression} from "./predicateTQueryExpression";
import {TExecute} from "../Types/TExecute";
import {checkSequence} from "../../BaseParser/Predicates/checkSequence";
import {eof} from "../../BaseParser/Predicates/eof";
import {exitIf} from "../../BaseParser/Predicates/exitIf";


// parse a EXECUTE/EXEC op

export function* predicateTExecute(callback) {
    let ret: TExecute = {
        kind: "TExecute",
        procName: "",
        returns: undefined,
        parameters: []
    };

    yield oneOf([str("EXECUTE"), str("EXEC")], "");
    yield atLeast1(whitespaceOrNewLine);
    let expectsReturn = yield maybe(predicateTVariable);
    if (expectsReturn !== undefined) {
        yield maybe(atLeast1(whitespaceOrNewLine));
        yield str("=")
        yield maybe(atLeast1(whitespaceOrNewLine));
        ret.returns = expectsReturn;
    }
    let procName = yield literal;
    ret.procName = procName;
    yield maybe(atLeast1(whitespaceOrNewLine));

    let param_order = -1;
    let noParams = yield maybe(str(";"));

    if (noParams === undefined) {
        let gotMore = ",";
        while (gotMore === ",") {
            let p = {
                name: undefined,
                order: undefined,
                value: undefined,
                output: false
            };

            let param = yield maybe(predicateTVariable);
            if (param !== undefined) {
                yield maybe(atLeast1(whitespaceOrNewLine));
                let gotAssignment = yield maybe(str("="));
                if (gotAssignment !== undefined) {
                    // supplied parameter is in the form: @parameter = EXPRESSION
                    yield maybe(atLeast1(whitespaceOrNewLine));
                    let param_value = yield oneOf([predicateTQueryExpression, predicateValidExpressions], "");
                    p.name = param;
                    p.value = param_value;
                    yield maybe(atLeast1(whitespaceOrNewLine));
                } else {
                    param_order++;
                    p.order = param_order;
                    p.value = param;
                    yield maybe(atLeast1(whitespaceOrNewLine));
                }
            } else {
                // supplied parameter is an expression directly
                param_order++;
                param = yield oneOf([predicateTQueryExpression, predicateValidExpressions], "");
                p.value = param;
                p.order = param_order;
                yield maybe(atLeast1(whitespaceOrNewLine));
            }
            let endOfStatement = oneOf([whitespaceOrNewLine, str(";"), str(","), eof], "");
            const output = yield exitIf(
                oneOf([
                    checkSequence([str("OUTPUT"), endOfStatement]),
                    checkSequence([str("OUT"), endOfStatement])
                    ], ""));
            if (output) {
                yield oneOf([str("OUTPUT"), str("OUT")], "");
            }
            p.output = output;
            yield maybe(atLeast1(whitespaceOrNewLine));
            gotMore = yield maybe(str(","));
            yield maybe(atLeast1(whitespaceOrNewLine));
            ret.parameters.push(p);
        }
        yield maybe(str(";"));
    }


    yield returnPred(ret);


}