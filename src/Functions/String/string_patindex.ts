import {str} from "../../BaseParser/Predicates/str";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {exitIf} from "../../BaseParser/Predicates/exitIf";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {letter} from "../../BaseParser/Predicates/letter";
import {digit} from "../../BaseParser/Predicates/digit";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {isEOF} from "../../BaseParser/Predicates/eof";
import {literal} from "../../BaseParser/Predicates/literal";
import {parse} from "../../BaseParser/parse";
import {Stream} from "../../BaseParser/Stream";
import {ParseResult} from "../../BaseParser/ParseResult";
import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";


function * predicateAny() {
    yield str("%");
    yield returnPred({kind: "any"});
}


function * predicateWildcard() {
    yield str("_");
    yield returnPred({kind: "wildcard"});
}

function * predicateAlphaRange() {
    const left = yield oneOf([letter, digit], "");
    yield str("-");
    const right = yield oneOf([letter, digit], "");
    yield returnPred({kind: "range", lb: left, rb: right});
}


function * predicateLetters() {
    let letters = yield atLeast1(letter);
    console.log(letters);
    yield returnPred({kind: "letters", array: []});
}

function * predicateExactValue() {
    let values = [];
    let value = yield oneOf([predicateWildcard, letter, digit], "");

    while (value !== undefined) {
        values.push(value);
        value = yield maybe(oneOf([predicateWildcard, letter, digit], ""));
    }
    yield returnPred({kind: "exact", arr: values});
}

function * predicateGroup() {
    yield str("[");
    let not = yield maybe(str("^"));
    let gotMore = yield exitIf(str("]"));
    let values = [];
    while (gotMore === false) {

        values.push(yield oneOf([predicateAlphaRange, predicateWildcard, letter, digit], ""));

        gotMore = yield exitIf(str("]"));
    }

    yield str("]");
    yield returnPred({
        kind: "group",
        not: not === "^",
        values: values
    });
}

function * predicatePattern() {
    let patterns = [];
    while ((yield isEOF) === false) {
        patterns.push(yield oneOf([predicateAny, predicateGroup, predicateExactValue, literal],""));
    }
    yield returnPred({
        kind: "pattern",
        p: patterns
    })
}

// SQL function PATINDEX


export function string_patindex(context: TExecutionContext, pattern: string, input: string) {
    if (input === undefined) { return undefined; }

    // TODO: cache parsed pattern
    let callback = function () {}
    let patternAST = parse(callback, function *(callback) {
        let pattern = yield predicatePattern;
        yield returnPred(pattern);
    }, new Stream(pattern, 0));

    let pat = (patternAST as ParseResult).value;

    let patternRegexp = '';
    let firstGroup = false;
    let gotStartingWildcard = false;
    function processNode(o) {
        if (o.kind !== "any" && firstGroup === false) {
            firstGroup = true;
        }
        if (typeof o === "string") {
            patternRegexp += o as string;
        }
        if (o.kind === "any") {
            if (firstGroup === false) {
                gotStartingWildcard = true;
            } else {
                patternRegexp += ".*";
            }
        }
        if (o.kind === "wildcard") {
            patternRegexp += ".";
        }
        if (o.kind === "exact") {
            for (let x = 0; x < o.arr.length;x++ ) {
                processNode(o.arr[x]);
            }
        }
        if (o.kind === "range") {
            patternRegexp += o.lb + "-" + o.rb;
        }
        if (o.kind === "group") {
            patternRegexp += "[" + ((o.not === true) ? "^" : "");
            for (let x = 0; x < o.values.length;x++ ) {
                processNode(o.values[x]);
            }
            patternRegexp += "]";
        }
    }

    for (let i = 0; i < pat.p.length; i++) {
        let o = pat.p[i];
        processNode(o);
    }
    //@ts-ignore

    if (!patternRegexp.endsWith(".*)")) {
        patternRegexp += "$"
    }
    if (!gotStartingWildcard) {
        patternRegexp = "^" + patternRegexp;
    }

    const regex = RegExp(patternRegexp, 'g');
    const matches = input.matchAll(regex);
    const indexes = [];
    for (const match of matches) {
        indexes.push(match.index);
    }
    if (indexes.length > 0) {
        return indexes[0] + 1;
    }
    return 0;
}