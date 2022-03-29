import {predicateTVariable} from "./predicateTVariable";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {str} from "../../BaseParser/Predicates/str";
import {predicateTQueryExpression} from "./predicateTQueryExpression";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TVariableDeclaration} from "../Types/TVariableDeclaration";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {predicateTColumnType} from "./predicateTColumnType";



/*
    tries to parse a variable declaration
    DECLARE @variable TYPE = EXPRESSION
 */
export const predicateTVariableDeclaration = function *(callback) {

    let ret : TVariableDeclaration = {
        kind: "TVariableDeclaration",
        declarations: []
    };

    const declare = yield str("DECLARE");

    let gotMore = ",";
    while (gotMore === ",") {
        yield atLeast1(whitespaceOrNewLine);
        const varname = yield predicateTVariable;
        yield atLeast1(whitespaceOrNewLine);
        const vartype = yield predicateTColumnType;
        yield maybe(atLeast1(whitespaceOrNewLine));
        const eq = yield maybe(str("="));
        yield maybe(atLeast1(whitespaceOrNewLine));
        const value = yield predicateTQueryExpression;
        yield maybe(atLeast1(whitespaceOrNewLine));

        ret.declarations.push(
            {
                name: varname,
                type: vartype,
                value: value
            }
        );

        gotMore = yield maybe(str(","));
    }
    yield maybe(str(";"));
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield returnPred(ret);

}