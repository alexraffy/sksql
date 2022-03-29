import {str} from "../../BaseParser/Predicates/str";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {predicateTVariable} from "./predicateTVariable";
import {predicateTColumnType} from "./predicateTColumnType";
import {TColumnType} from "../Types/TColumnType";
import {literal} from "../../BaseParser/Predicates/literal";
import {exitIf} from "../../BaseParser/Predicates/exitIf";
import {TQueryCreateFunction} from "../Types/TQueryCreateFunction";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {predicateValidStatementsInFunction} from "./predicateValidStatementsInFunction";


export function * predicateTQueryCreateFunction(callback) {


    let ret: TQueryCreateFunction = {
        kind: "TQueryCreateFunction",
        functionName: "",
        parameters: [],
        returnType: {
            kind: "TColumnType",
            type: "BOOLEAN",
            dec: undefined,
            size: {kind: "TNumber", value: "1"},
            isNullable: {kind: "TBoolValue", value: true}
        } as TColumnType,
        ops: []
    };

    yield oneOf([str("CREATE"), str("ALTER")], "CREATE OR ALTER");
    yield atLeast1(whitespaceOrNewLine);
    let gotOr = yield maybe(str("OR"));
    if (gotOr) {
        yield atLeast1(whitespaceOrNewLine);
        yield str("ALTER");
        yield atLeast1(whitespaceOrNewLine);
    }
    yield str("FUNCTION");
    yield maybe(atLeast1(whitespaceOrNewLine));
    ret.functionName = yield literal;
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield str("(");
    let gotMore = ",";
    while (gotMore === ",") {
        yield maybe(atLeast1(whitespaceOrNewLine));
        let variable = yield maybe(predicateTVariable);
        if (variable !== undefined) {
            yield atLeast1(whitespaceOrNewLine);
            let varType = yield predicateTColumnType;
            ret.parameters.push({variableName: variable, type: varType});
        }
        yield maybe(atLeast1(whitespaceOrNewLine));
        gotMore = yield maybe(str(","));
    }
    yield str(")");
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield str("RETURNS");
    yield atLeast1(whitespaceOrNewLine);
    ret.returnType = yield predicateTColumnType;

    yield maybe(atLeast1(whitespaceOrNewLine));
    yield str("AS");
    yield atLeast1(whitespaceOrNewLine);
    yield str("BEGIN");
    yield atLeast1(whitespaceOrNewLine);

    yield maybe(atLeast1(whitespaceOrNewLine));
    let gotExit = yield exitIf(str("END"));
    while (!gotExit) {
        yield maybe(atLeast1(whitespaceOrNewLine));
        let op = yield predicateValidStatementsInFunction;

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