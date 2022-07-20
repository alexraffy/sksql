import {TSQLResult} from "./TSQLResult";
import {ITableDefinition} from "../Table/ITableDefinition";
import {SKSQL} from "./SKSQL";
import {readTableDefinition} from "../Table/readTableDefinition";
import {ITable} from "../Table/ITable";
import {TableColumn} from "../Table/TableColumn";
import {readTableAsJSON} from "./readTableAsJSON";
import {ITableCursor} from "../Cursor/ITableCursor";
import {readFirst} from "../Cursor/readFirst";
import {Cursor} from "./Cursor";


export class SQLResult {
    private db: SKSQL;
    private result: TSQLResult;
    private table: ITable;
    private tableDef: ITableDefinition;
    private rows: any[] = undefined;

    constructor(db: SKSQL, result: TSQLResult) {
        this.db = db;
        this.result = result;
        if (this.result.error === undefined &&
            this.result.resultTableName !== undefined &&
            this.result.resultTableName !== "") {
            this.table = db.getTable(this.result.resultTableName);
            this.tableDef = readTableDefinition(this.table.data, false);
        }
    }

    get error(): string | undefined {
        if (this.result === undefined) return undefined;
        return this.result.error;
    }

    get resultTableName(): string | undefined {
        if (this.result === undefined) return undefined;
        return this.result.resultTableName;
    }

    getColumns(): TableColumn[] {
        if (this.tableDef === undefined) {
            return [];
        }
        return this.tableDef.columns;
    }

    getRows<T = any>() : T[] {
        if (this.rows !== undefined) {
            return this.rows;
        }
        if (this.result === undefined ||
            this.result.error !== undefined ||
            this.result.resultTableName === undefined ||
            this.result.resultTableName === "") {
            return [];
        }
        this.rows = readTableAsJSON(this.db, this.result.resultTableName);
        return this.rows;
    }




    getCursor(): Cursor | undefined {
        if (this.table === undefined || this.tableDef === undefined) {
            return undefined;
        }
        return new Cursor(this.db, this.table, this.tableDef);
    }

    getStruct(): TSQLResult {
        return this.result;
    }

}