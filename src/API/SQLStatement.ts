
import {instanceOfParseResult} from "../BaseParser/Guards/instanceOfParseResult";
import {parse} from "../BaseParser/parse";
import {predicateTQueryCreateTable} from "../Query/Parser/predicateTQueryCreateTable";
import {TQueryCreateTable} from "../Query/Types/TQueryCreateTable";
import {Stream} from "../BaseParser/Stream";
import {TQueryInsert} from "../Query/Types/TQueryInsert";
import {ParseResult} from "../BaseParser/ParseResult";
import {ParseError} from "../BaseParser/ParseError";
import {instanceOfParseError} from "../BaseParser/Guards/instanceOfParseError";
import {SKSQL} from "./SKSQL";
import {TQuerySelect} from "../Query/Types/TQuerySelect";
import {SQLResult} from "./SQLResult";
import {whitespaceOrNewLine} from "../BaseParser/Predicates/whitespaceOrNewLine";
import {returnPred} from "../BaseParser/Predicates/ret";
import {oneOf} from "../BaseParser/Predicates/oneOf";
import {eof} from "../BaseParser/Predicates/eof";
import {str} from "../BaseParser/Predicates/str";
import {kResultType} from "./kResultType";
import {readTableAsJSON} from "./readTableAsJSON";
import {atLeast1} from "../BaseParser/Predicates/atLeast1";
import {maybe} from "../BaseParser/Predicates/maybe";
import {checkAhead} from "../BaseParser/Predicates/checkAhead";
import {CWebSocket} from "../WebSocket/CWebSocket";
import {TWSRSQL, WSRSQL} from "../WebSocket/TMessages";
import {predicateTQueryCreateFunction} from "../Query/Parser/predicateTQueryCreateFunction";
import {TableColumnType} from "../Table/TableColumnType";
import {predicateTQueryCreateProcedure} from "../Query/Parser/predicateTQueryCreateProcedure";
import {TValidStatementsInFunction} from "../Query/Types/TValidStatementsInFunction";
import {predicateValidStatementsInProcedure} from "../Query/Parser/predicateValidStatementsInProcedure";
import {processStatement} from "../ExecutionPlan/processStatement";
import {TExecutionContext} from "../ExecutionPlan/TExecutionContext";
import {TValidStatementsInProcedure} from "../Query/Types/TValidStatementsInProcedure";
import {TParserError} from "./TParserError";
import {createNewContext} from "../ExecutionPlan/newContext";
import {checkSequence} from "../BaseParser/Predicates/checkSequence";
import {whitespace} from "../BaseParser/Predicates/whitespace";
import {predicateTComment} from "../Query/Parser/predicateTComment";
import {predicateTBeginEnd} from "../Query/Parser/predicateTBeginEnd";
import {predicateTBreak} from "../Query/Parser/predicateTBreak";
import {predicateTDebugger} from "../Query/Parser/predicateTDebugger";
import {predicateTQueryDelete} from "../Query/Parser/predicateTQueryDelete";
import {predicateTQueryDrop} from "../Query/Parser/predicateTQueryDrop";
import {predicateTExecute} from "../Query/Parser/predicateTExecute";
import {predicateTIf} from "../Query/Parser/predicateTIf";
import {predicateTQueryInsert} from "../Query/Parser/predicateTQueryInsert";
import {predicateReturnValue} from "../Query/Parser/predicateReturnValue";
import {predicateTVariableAssignment} from "../Query/Parser/predicateTVariableAssignment";
import {predicateTVariableDeclaration} from "../Query/Parser/predicateTVariableDeclaration";
import {predicateTQueryUpdate} from "../Query/Parser/predicateTQueryUpdate";
import {predicateTWhile} from "../Query/Parser/predicateTWhile";
import {predicateTQuerySelect} from "../Query/Parser/predicateTQuerySelect";

let performance = undefined;
try {
    if (window !== undefined) {
        performance = window.performance;
    } else {
        performance = require('perf_hooks').performance;
    }
} catch (e) {
    performance = require('perf_hooks').performance;
}
export class SQLStatement {

    query: string = "";
    broadcast: boolean;
    databaseHashId: string;
    ast: ParseResult | ParseError;
    context: TExecutionContext;

    constructor(statements: string, broadcast: boolean = true, databaseHashId: string = "") {
        this.query = statements;
        this.broadcast = broadcast;
        this.databaseHashId = databaseHashId;
        this.context = createNewContext("", statements, undefined);
    }

    get hasErrors():boolean {
        if (this.ast === undefined || instanceOfParseError(this.ast)) {
            return true;
        }
        return false;
    }

    setParameter(param: string, value: any, type?: TableColumnType) {
        let t: TableColumnType;
        if (type !== undefined) {
            t = type;
        } else {
            if (typeof value === "string") {
                t = TableColumnType.varchar;
            }
            if (typeof value === "number") {
                t = TableColumnType.numeric;
            }
            if (typeof value === "boolean") {
                t = TableColumnType.boolean;
            }
        }
        let exists = this.context.stack.find((p) => { return p.name === param;});
        if (exists) {
            exists.value = value;
        } else {
            this.context.stack.push({
                name: param,
                type: t,
                value: value
            });
        }
        return this;
    }

    getParserInfo(): TQueryCreateTable | TQueryInsert | TQuerySelect {
        if (this.ast === undefined) {
            return undefined;
        }
        if (instanceOfParseResult(this.ast)) {
            return this.ast.value;
        }
        return undefined;
    }
    close() {
        for (let i = 0; i < this.context.openedTempTables.length; i++) {
            SKSQL.instance.dropTable(this.context.openedTempTables[i]);
        }
    }
    runOnWebWorker(): Promise<string> {
        return new Promise<string>( (resolve, reject) => {
            SKSQL.instance.updateWorkerDB(0);
            SKSQL.instance.sendWorkerQuery(0, this, reject, resolve);

        });
    }
    private parse() {
        let callback = function () {}

        this.ast = parse(callback, function *(callback) {
            let ret: (TValidStatementsInFunction)[] = [];
            let exit: boolean = yield eof;
            while (!exit) {

                let result;

                yield maybe(atLeast1(whitespaceOrNewLine));
                let stType = yield checkAhead([oneOf([
                    checkSequence([str("--")]),
                    checkSequence([str("ALTER"), whitespaceOrNewLine]),
                    checkSequence([str("BEGIN"), whitespaceOrNewLine]),
                    checkSequence([str("BREAK"), whitespaceOrNewLine]),
                    checkSequence([str("CREATE"), whitespaceOrNewLine]),
                    checkSequence([str("DEBUGGER"), whitespaceOrNewLine]),
                    checkSequence([str("DECLARE"), whitespaceOrNewLine]),
                    checkSequence([str("DELETE"), whitespaceOrNewLine]),
                    checkSequence([str("DROP"), whitespaceOrNewLine]),
                    checkSequence([str("EXECUTE"), whitespaceOrNewLine]),
                    checkSequence([str("IF"), whitespaceOrNewLine]),
                    checkSequence([str("INSERT"), whitespaceOrNewLine]),
                    checkSequence([str("RETURN"), whitespaceOrNewLine]),
                    checkSequence([str("SELECT"), whitespaceOrNewLine]),
                    checkSequence([str("SET"), whitespaceOrNewLine]),
                    checkSequence([str("TRUNCATE"), whitespaceOrNewLine]),
                    checkSequence([str("UPDATE"), whitespaceOrNewLine]),
                    checkSequence([str("WHILE"), whitespaceOrNewLine])
                ], "")], "");
                if (stType !== undefined) {
                    switch ((stType as any[])[0]) {
                        case "--":
                            result = yield predicateTComment;
                            break;
                        case "ALTER":
                        {
                            let stAlter = yield checkAhead([checkSequence([
                                str("ALTER"),
                                atLeast1(whitespaceOrNewLine),
                                oneOf([
                                    str("TABLE"),
                                    str("FUNCTION"),
                                    str("PROCEDURE")
                                ],"")
                                ])], "");
                            if (stAlter === undefined) { yield str("ALTER TABLE, ALTER FUNCTION or ALTER PROCEDURE");}
                            if ((stAlter as any[])[2] === "TABLE") {
                                result = yield predicateTQueryCreateTable;
                            }
                            if ((stAlter as any[])[2] === "FUNCTION") {
                                result = yield predicateTQueryCreateFunction;
                            }
                            if ((stAlter as any[])[2] === "PROCEDURE") {
                                result = yield predicateTQueryCreateProcedure;
                            }
                        }
                        break;
                        case "BEGIN":
                            result = yield predicateTBeginEnd;
                            break;
                        case "BREAK":
                            result = yield predicateTBreak;
                            break;
                        case "CREATE":
                        {
                            let stCreate = yield checkAhead([checkSequence([
                                str("CREATE"),
                                atLeast1(whitespaceOrNewLine),
                                oneOf([
                                    str("TABLE"),
                                    str("FUNCTION"),
                                    str("PROCEDURE")
                                ],"")
                            ])], "");
                            if (stCreate === undefined) { yield str("CREATE TABLE, CREATE FUNCTION or CREATE PROCEDURE");}
                            if ((stCreate as any[])[2] === "TABLE") {
                                result = yield predicateTQueryCreateTable;
                            }
                            if ((stCreate as any[])[2] === "FUNCTION") {
                                result = yield predicateTQueryCreateFunction;
                            }
                            if ((stCreate as any[])[2] === "PROCEDURE") {
                                result = yield predicateTQueryCreateProcedure;
                            }
                        }
                        break;
                        case "DEBUGGER":
                            result = yield predicateTDebugger;
                            break;
                        case "DECLARE":
                            result = yield predicateTVariableDeclaration;
                            break;
                        case "DELETE":
                            result = yield predicateTQueryDelete;
                            break;
                        case "DROP":
                        {
                            let stDrop = yield checkAhead([checkSequence([
                                str("DROP"),
                                atLeast1(whitespaceOrNewLine),
                                oneOf([
                                    str("TABLE"),
                                    str("FUNCTION"),
                                    str("PROCEDURE")
                                ],"")
                            ])], "");
                            if (stDrop === undefined) { yield str("DROP TABLE, DROP FUNCTION or DROP PROCEDURE");}
                            if ((stDrop as any[])[2] === "TABLE") {
                                result = yield predicateTQueryDrop;
                            }
                            if ((stDrop as any[])[2] === "FUNCTION") {
                                result = yield predicateTQueryDrop;
                            }
                            if ((stDrop as any[])[2] === "PROCEDURE") {
                                result = yield predicateTQueryDrop;
                            }
                        }
                        break;
                        case "EXECUTE":
                            result = yield predicateTExecute;
                            break;
                        case "IF":
                            result = yield predicateTIf;
                            break;
                        case "INSERT":
                            result = yield predicateTQueryInsert;
                            break;
                        case "RETURN":
                            result = yield predicateReturnValue;
                            break;
                        case "SELECT":
                            result = yield predicateTQuerySelect;
                            break;
                        case "SET":
                            result = yield predicateTVariableAssignment;
                            break;
                        case "TRUNCATE":
                            result = yield str("TRUNCATE NOT IMPLEMENTED");
                            break;
                        case "UPDATE":
                            result = yield predicateTQueryUpdate;
                            break;
                        case "WHILE":
                            result = yield predicateTWhile;
                            break;
                    }
                }


                //let result = yield maybe(predicateValidStatementsInProcedure);
/*
                if (result === undefined) {
                    let statementType = yield checkAhead([str("CREATE"), str("ALTER")], "");
                    switch (statementType) {
                        case "CREATE":
                        case "ALTER":
                            result = yield oneOf([predicateTQueryCreateTable, predicateTQueryCreateProcedure, predicateTQueryCreateFunction], "");
                            break;
                        default:
                            yield str("a SQL statement")
                    }
                }

 */

                if (result !== undefined && typeof result !== "string") {
                    ret.push(result);
                }


                if (instanceOfParseError(result)) {
                    exit = true;
                } else {
                    exit = yield eof;
                }
            }
            yield returnPred({
                type: "TSQLStatement",
                statements: ret
            });
        }, new Stream(this.query, 0));
        this.context.parseResult = this.ast;
    }
    run(type: kResultType = kResultType.SQLResult): SQLResult[] | any[] {
        let perfs = {
            parser: 0,
            query: 0
        }
        let t0 = performance.now();
        if (this.ast === undefined) {
            this.parse();
        }
        let t1 = performance.now();
        perfs.parser = (t1 - t0);

        if (this.hasErrors) {
            if (type === kResultType.SQLResult) {
                return [{
                    error: (this.ast as ParseError).description,
                    rowCount: 0,
                    resultTableName: "",
                    perfs: perfs,
                    executionPlan: {
                        description: ""
                    }
                } as SQLResult];
            } else if (type === kResultType.JSON) {
                return [];
            }
        }

        let statements:  (TValidStatementsInProcedure | TValidStatementsInFunction)[] = [];
        if (instanceOfParseResult(this.ast)) {
            statements = this.ast.value.statements;
        } else {
            return;
        }
        let st0 = performance.now();
        for (let i = 0; i < statements.length; i++) {
            let statement = statements[i];
            processStatement(this.context, statement);
            if (this.context.rollback === true) {
                throw new TParserError(this.context.rollbackMessage);
                break;
            }
            if (this.context.exitExecution === true) {
                break;
            }
        }
        let st1 = performance.now();
        perfs.query = st1 - st0;


        if (this.broadcast && this.context.broadcastQuery) {
            let tc = SKSQL.instance.getConnectionInfoForDB(this.databaseHashId);
            if (tc !== undefined) {
                tc.socket.send(WSRSQL, {id: tc.socket.con_id, r: this.query} as TWSRSQL );
            }

        }

        if (type === kResultType.SQLResult) {
            return this.context.results;
        } else if (type === kResultType.JSON) {
            for (let i = 0; i < this.context.results.length; i++) {
                if (this.context.results[i].resultTableName !== undefined && this.context.results[i].resultTableName !== "") {
                    return readTableAsJSON(this.context.results[i].resultTableName);
                }
            }

        }

    }


}