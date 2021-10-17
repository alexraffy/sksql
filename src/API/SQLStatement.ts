import {instanceOfTQueryCreateTable} from "../Query/Guards/instanceOfTQueryCreateTable";
import {instanceOfParseResult} from "../BaseParser/Guards/instanceOfParseResult";
import {parse} from "../BaseParser/parse";
import {predicateTQueryCreateTable} from "../Query/Parser/predicateTQueryCreateTable";
import {TQueryCreateTable} from "../Query/Types/TQueryCreateTable";
import {Stream} from "../BaseParser/Stream";
import {TQueryInsert} from "../Query/Types/TQueryInsert";
import {predicateTQueryInsert} from "../Query/Parser/predicateTQueryInsert";
import {ParseResult} from "../BaseParser/ParseResult";
import {ParseError} from "../BaseParser/ParseError";
import {instanceOfParseError} from "../BaseParser/Guards/instanceOfParseError";
import {instanceOfTQueryInsert} from "../Query/Guards/instanceOfTQueryInsert";
import {DBData} from "./DBInit";
import {readTableDefinition} from "../Table/readTableDefinition";
import {instanceOfTQuerySelect} from "../Query/Guards/instanceOfTQuerySelect";
import {TQuerySelect} from "../Query/Types/TQuerySelect";
import {recordSize} from "../Table/recordSize";
import {TTableWalkInfo} from "./TTableWalkInfo";
import {processCreateStatement} from "./processCreateStatement";
import {processInsertStatement} from "./processInsertStatement";
import {processSelectStatement} from "./processSelectStatement";
import {predicateTQuerySelect} from "../Query/Parser/predicateTQuerySelect";
import {SQLResult} from "./SQLResult";
import {predicateTQueryDelete} from "../Query/Parser/predicateTQueryDelete";
import {instanceOfTQueryDelete} from "../Query/Guards/instanceOfTQueryDelete";
import {processDeleteStatement} from "./processDeleteStatement";
import {predicateTQueryUpdate} from "../Query/Parser/predicateTQueryUpdate";
import {instanceOfTQueryUpdate} from "../Query/Guards/instanceOfTQueryUpdate";
import {processUpdateStatement} from "./processUpdateStatement";
import {whitespaceOrNewLine} from "../BaseParser/Predicates/whitespaceOrNewLine";
import {returnPred} from "../BaseParser/Predicates/ret";
import {TQueryUpdate} from "../Query/Types/TQueryUpdate";
import {TQueryDelete} from "../Query/Types/TQueryDelete";
import {oneOf} from "../BaseParser/Predicates/oneOf";
import {eof} from "../BaseParser/Predicates/eof";
import {str} from "../BaseParser/Predicates/str";
import {kResultType} from "./kResultType";
import {readTableAsJSON} from "./readTableAsJSON";



export class SQLStatement {

    query: string = "";
    parameters: {name: string, value: any}[] = [];

    ast: ParseResult | ParseError;

    constructor(st: string) {
        this.query = st;


    }

    get hasErrors():boolean {
        if (this.ast === undefined || instanceOfParseError(this.ast)) {
            return true;
        }
        return false;
    }

    setParameter(param: string, value: any) {
        let exists = this.parameters.find((p) => { return p.name === param;});
        if (exists) {
            exists.value = value;
        } else {
            this.parameters.push({
                name: param,
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

    runOnWebWorker(): Promise<string> {
        return new Promise<string>( (resolve, reject) => {
            DBData.instance.updateWorkerDB(0);
            DBData.instance.sendWorkerQuery(0, this, reject, resolve);

        });
    }
    private parse() {
        let callback = function () {}

        this.ast = parse(callback, function *(callback) {
            let ret: (TQueryCreateTable | TQueryInsert | TQuerySelect | TQueryUpdate | TQueryDelete | string)[] = [];
            let result: TQueryCreateTable | TQueryInsert | TQuerySelect | TQueryUpdate | TQueryDelete | string | undefined = "";
            let exit = yield eof;
            while (!exit) {
                result = yield oneOf([predicateTQueryCreateTable, predicateTQueryInsert, predicateTQuerySelect, predicateTQueryUpdate, predicateTQueryDelete, whitespaceOrNewLine, str("")],"");
                if (result !== undefined && typeof result !== "string") {
                    ret.push(result);
                }
                exit = yield eof;
            }

            yield returnPred({
                type: "TSQLStatement",
                statements: ret
            });
        }, new Stream(this.query, 0));
    }
    run(type: kResultType = kResultType.SQLResult): SQLResult[] | any[] {
        if (this.ast === undefined) {
            this.parse();
        }
        let ret: SQLResult[] = [];
        if (this.hasErrors) {
            if (type === kResultType.SQLResult) {
                return [{
                    error: (this.ast as ParseError).description,
                    rowCount: 0,
                    resultTableName: ""
                } as SQLResult];
            } else if (type === kResultType.JSON) {
                return [];
            }
        }
        let walk : TTableWalkInfo[] = [];
        for (let i = 0; i < DBData.instance.allTables.length; i++) {
            let t = DBData.instance.allTables[i];
            let def = readTableDefinition(t.data);
            walk.push(
                {
                    name: def.name,
                    table: t,
                    def: def,
                    rowLength: recordSize(t.data),
                    cursor: {tableIndex: i, offset: 0, blockIndex: 0, rowLength: 0},
                    alias: ""
                }
            );
        }

        let statements:  (TQueryCreateTable | TQueryInsert | TQuerySelect | TQueryUpdate | TQueryDelete)[] = [];
        if (instanceOfParseResult(this.ast)) {
            statements = this.ast.value.statements;
        } else {
            return;
        }
        for (let i = 0; i < statements.length; i++) {
            let statement = statements[i];
            // console.log(statement);
            if (instanceOfTQueryCreateTable(statement)) {
                ret.push(processCreateStatement(this.ast, statement));
                if (i < statements.length) {
                    // the next statement may need info about this table
                    let tt = DBData.instance.getTableDataAndIndex(statement.name.table);
                    let def = readTableDefinition(tt.table.data);
                    walk.push(
                        {
                            name: def.name,
                            table: tt.table,
                            def: def,
                            rowLength: recordSize(tt.table.data),
                            cursor: {tableIndex: tt.index, offset: 0, blockIndex: 0, rowLength: 0},
                            alias: ""
                        }
                    );
                }
            }
            if (instanceOfTQueryInsert(statement)) {
                ret.push(processInsertStatement(this.ast, statement, this.parameters, walk));
            }
            if (instanceOfTQueryUpdate(statement)) {
                ret.push(processUpdateStatement(this.ast, statement, this.parameters));
            }
            if (instanceOfTQuerySelect(statement)) {
                ret.push(processSelectStatement(this.ast, statement, this.parameters));
            }
            if (instanceOfTQueryDelete(statement)) {
                ret.push(processDeleteStatement(this.ast, statement, this.parameters, walk));
            }
        }
        if (type === kResultType.SQLResult) {
            return ret;
        } else if (type === kResultType.JSON) {
            for (let i = 0; i < ret.length; i++) {
                if (ret[i].resultTableName !== undefined && ret[i].resultTableName !== "") {
                    return readTableAsJSON(ret[i].resultTableName);
                }
            }

        }

    }


}