
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
import {TSQLResult} from "./TSQLResult";
import {whitespaceOrNewLine} from "../BaseParser/Predicates/whitespaceOrNewLine";
import {returnPred} from "../BaseParser/Predicates/ret";
import {oneOf} from "../BaseParser/Predicates/oneOf";
import {eof, isEOF} from "../BaseParser/Predicates/eof";
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
import {cloneContext} from "../ExecutionPlan/cloneContext";
import {predicateTGO} from "../Query/Parser/predicateTGO";
import {TDebugInfo} from "../Query/Types/TDebugInfo";
import {predicateVacuum} from "../Query/Parser/predicateVacuum";
import {predicateParseError} from "../BaseParser/Predicates/predicateParseError";
import {generateV4UUID} from "./generateV4UUID";
import {SQLResult} from "./SQLResult";
import {type} from "os";


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


// Prepare an SQL query and execute it
// Only Statements/Procedures that contain CREATE/UPDATE/DELETE/INSERT are broadcast
// Set broadcast to false, if the query is NOT to be sent to the remote server after running locally.

// SELECT queries and subqueries generate temp tables that must be deleted after use
// call <SQLStatement instance>.close(); after reading the data

// <SQLStatement instance>.run parses the query and executes it.
// it can THROW a TParserError If a parser error occurs or if the query breaks a constraint.

// Simple example
// let st = new SQLStatement(db, "SELECT 'Hello' as greetings FROM dual");
// let ret = st.runSync();
// const rows = ret.getRows();
// rows[0]["greetings"] === "Hello"
// // delete the result table
// ret.close();

// With a parameter
// let st = new SQLStatement(db, "SELECT FirstName FROM users WHERE Lastname = @lastname");
// st.setParameter("@lastname", "Doe");
// let ret = st.runSync();
// const rows = ret.getRows();
// rows[0]["FirstName"] === "John";
// // delete the result table
// ret.close();

// Return a typescript type
// interface Person {
//      FirstName: string;
//      Lastname: string;
// }
// let st = new SQLStatement(db, "SELECT FirstName, Lastname FROM users WHERE Lastname = @lastname");
// st.setParameter("@lastname", "Doe");
// let ret = st.runSync();
// const rows = ret.getRows<Person>();
// rows[0].FirstName === "John";
// // delete the result table
// ret.close();

// Open a cursor on the result table and loop through all records
// let st = new SQLStatement(db, "SELECT FirstName, Lastname FROM users");
// let ret = st.runSync();
// // get the result table
// if (ret.error !== undefined) { throw "Error: " + ret.error; }
// // open a cursor
// let cursor = ret.getCursor();
// // loop while we still have records
// while (!cursor.eof()) {
//  // get the row
//  let value = cursor.get("FirstName");
//  console.log(value); // John
//  // read the next row
//  cursor.next();
// }
// // delete the result table
// ret.close();

export class SQLStatement {
    id: string;
    db: SKSQL;
    query: string = "";
    broadcast: boolean;
    ast: ParseResult | ParseError;
    context: TExecutionContext;
    contextOriginal: TExecutionContext;

    constructor(db: SKSQL, statements: string, broadcast: boolean = true) {
        this.id = generateV4UUID();
        this.db = db;
        this.query = statements;
        this.broadcast = broadcast;
        this.context = createNewContext("", statements, undefined);
        this.contextOriginal = cloneContext(this.context, "", false, false);
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
            this.contextOriginal.stack.push({
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
            this.db.dropTable(this.context.openedTempTables[i]);
        }
    }
    async runOnWebWorker(): Promise<SQLResult> {
        return new Promise<SQLResult>( (resolve: (SQLResult) => void) => {
            this.db.updateWorkerDB(0);
            this.db.sendWorkerQuery(0, this, resolve);
        });
    }
    private parse() {
        let callback = function () {}

        let endOfStatement = oneOf([whitespaceOrNewLine, str(";"), eof], "");

        this.ast = parse(callback, function *(callback) {
            let ret: (TValidStatementsInFunction)[] = [];
            let exit: boolean = yield isEOF;
            while (!exit) {

                let result;

                yield maybe(atLeast1(whitespaceOrNewLine));
                let stType = yield maybe(checkAhead([oneOf([
                    checkSequence([str("--")]),
                    checkSequence([str("ALTER"), whitespaceOrNewLine]),
                    checkSequence([str("BEGIN"), whitespaceOrNewLine]),
                    checkSequence([str("BREAK"), endOfStatement]),
                    checkSequence([str("CREATE"), whitespaceOrNewLine]),
                    checkSequence([str("DEBUGGER"), endOfStatement]),
                    checkSequence([str("DECLARE"), whitespaceOrNewLine]),
                    checkSequence([str("DELETE"), whitespaceOrNewLine]),
                    checkSequence([str("DROP"), whitespaceOrNewLine]),
                    checkSequence([str("EXECUTE"), whitespaceOrNewLine]),
                    checkSequence([str("EXEC"), whitespaceOrNewLine]),
                    checkSequence([str("GO"), endOfStatement]),
                    checkSequence([str("IF"), whitespaceOrNewLine]),
                    checkSequence([str("INSERT"), whitespaceOrNewLine]),
                    checkSequence([str("RETURN"), endOfStatement]),
                    checkSequence([str("SELECT"), whitespaceOrNewLine]),
                    checkSequence([str("SET"), whitespaceOrNewLine]),
                    checkSequence([str("TRUNCATE"), whitespaceOrNewLine]),
                    checkSequence([str("UPDATE"), whitespaceOrNewLine]),
                    checkSequence([str("WHILE"), whitespaceOrNewLine]),
                    checkSequence([str("VACUUM"), endOfStatement])
                ], "")], ""));

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
                        case "EXEC":
                            result = yield predicateTExecute;
                            break;
                        case "GO":
                            result = yield predicateTGO;
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
                        case "VACUUM":
                            result = yield predicateVacuum;
                            break;
                    }
                } else {
                    let error = yield predicateParseError("A VALID STATEMENT");
                }


                if (result !== undefined && typeof result !== "string") {
                    ret.push(result);
                }


                if (instanceOfParseError(result)) {
                    exit = true;
                } else {
                    yield maybe(atLeast1(whitespaceOrNewLine));
                    yield maybe(atLeast1(str(";")));
                    yield maybe(atLeast1(whitespaceOrNewLine));
                    exit = yield isEOF;
                }
            }
            yield returnPred({
                type: "TSQLStatement",
                statements: ret
            });
        }, new Stream(this.query, 0));
        this.context.parseResult = this.ast;
    }


    async runRemote(returnResult: boolean = true, broadcastResult: boolean = false): Promise<SQLResult> {
        return new Promise<SQLResult>( (resolve) => {
            this.db.sendRemoteDatabaseQuery(this, this.context, returnResult, broadcastResult, resolve);
        });
    }

    runAsync(options: {printDebug: boolean} = {printDebug: false}): Promise<SQLResult> {
        return new Promise<SQLResult>((resolve) => {
            let opts = {
                printDebug: options.printDebug,
                remoteCallback: resolve
            };
            let ret = this.runSync(options);
            resolve(ret);
        });
    }

    runSync(options: {printDebug: boolean, remoteCallback?: (SQLResult) => void} = {printDebug: false, remoteCallback: undefined}): SQLResult {
        if (options !== undefined && options.printDebug === true) {
            console.log("****************************************");
            console.log("DEBUG INFO");
            console.log("FOR STATEMENT " + this.query);
        }
        let perfs = {
            parser: 0,
            query: 0
        }
        let t0 = 0;
        if (performance !== undefined) {
            t0 = performance.now();
        }
        if (this.ast === undefined) {
            this.parse();
        } else {
            // clear the temp tables if we run again
            this.close();
        }
        if (performance !== undefined) {
            let t1 = performance.now();
            perfs.parser = (t1 - t0);
        }
        if (options !== undefined && options.printDebug === true) {
            console.log("--------------------------");
            console.log("PARSED TREE:");
            console.dir(this.ast);
        }

        if (this.hasErrors) {

            if (options !== undefined && options.printDebug === true) {
                console.log("--------------------------");
                console.log("ERROR: " + (this.ast as ParseError).description);
            }
            return new SQLResult(this.db, {
                error: (this.ast as ParseError).description,
                rowCount: 0,
                rowsDeleted: 0,
                rowsModified: 0,
                rowsInserted: 0,
                queries: [],
                resultTableName: "",
                totalRuntime: 0,
                parserTime: perfs.parser
            } as TSQLResult);

        }

        this.context.result = {
            messages: "",
            queries: [],
            totalRuntime: 0,
            resultTableName: "",
            parserTime: perfs.parser,
            rowsInserted: 0,
            rowsModified: 0,
            rowsDeleted: 0,
            rowCount: 0
        } as TSQLResult

        let statements:  (TValidStatementsInProcedure | TValidStatementsInFunction)[] = [];
        if (instanceOfParseResult(this.ast)) {
            statements = this.ast.value.statements;
        } else {
            this.context.result.error = (this.ast as ParseError).description;
            return new SQLResult(this.db, this.context.result);
        }

        // is the connection read-only?
        if (this.db.isReadOnly === true && this.ast)

        // if the connection is remote only, we don't execute the query but send it to the server.
        if (this.db.isRemoteOnly === true && this.broadcast === true) {
            this.db.sendRemoteDatabaseQuery(this, this.contextOriginal, false, false, options.remoteCallback);
            return new SQLResult(this.db, this.context.result);
        } else if (this.db.isRemoteOnly === true && this.broadcast === false) {
            this.context.result.resultTableName = "";
            this.context.result.error = "CONNECTION IS SET TO REMOTE ONLY BUT QUERY BROADCAST IS SET TO FALSE";
            return new SQLResult(this.db, this.context.result);
        }


        let st0 = 0;
        if (performance !== undefined) {
            st0 = performance.now();
        }
        for (let i = 0; i < statements.length; i++) {
            let statement = statements[i];
            processStatement(this.db, this.context, statement, options);
            if (this.context.rollback === true) {
                throw new TParserError(this.context.rollbackMessage);
                break;
            }
            if (this.context.exitExecution === true) {
                break;
            }
        }
        if (performance !== undefined) {
            let st1 = performance.now();
            perfs.query = st1 - st0;
        }
        this.context.result.totalRuntime = perfs.query;

        for (let i = 0; i < this.context.openedTempTables.length; i++) {
            if (this.context.result.resultTableName === undefined || (this.context.openedTempTables[i].toUpperCase() !== this.context.result.resultTableName.toUpperCase())) {
                this.db.dropTable(this.context.openedTempTables[i]);
            }
        }


        if (this.broadcast && this.context.broadcastQuery && this.db.connections.length > 0) {
            this.db.sendRemoteDatabaseQuery(this, this.contextOriginal, false, true, options.remoteCallback);
        }

        return new SQLResult(this.db, this.context.result);

    }


}