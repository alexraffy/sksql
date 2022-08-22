import {ITableDefinition} from "../Table/ITableDefinition";
import {ITableCursor} from "../Cursor/ITableCursor";
import {SKSQL} from "./SKSQL";
import {cursorEOF} from "../Cursor/cursorEOF";
import {readFirst} from "../Cursor/readFirst";
import {ITable} from "../Table/ITable";
import {readNext} from "../Cursor/readNext";
import {readLast} from "../Cursor/readLast";
import {readPrevious} from "../Cursor/readPrevious";
import {TableColumnType} from "../Table/TableColumnType";
import {readValue} from "../BlockIO/readValue";
import {rowHeaderSize} from "../Table/addRow";
import {numeric} from "../Numeric/numeric";
import {TDate} from "../Query/Types/TDate";
import {TTime} from "../Query/Types/TTime";
import {TDateTime} from "../Query/Types/TDateTime";
import {TableColumn} from "../Table/TableColumn";
import {offs} from "../Blocks/kBlockHeaderField";



export class Cursor {
    private db: SKSQL;
    private cursor: ITableCursor;
    private table: ITable;
    private tableDef: ITableDefinition;
    private fullRow: DataView;
    constructor(db: SKSQL, table: ITable, tableDef: ITableDefinition) {
        this.db = db;
        this.table = table;
        this.tableDef = tableDef;
        this.cursor = readFirst(this.table, this.tableDef);
        this.openRow();
    }

    private openRow() {
        this.fullRow = undefined;
        if (this.eof() == false) {
            this.fullRow = new DataView(this.table.data.blocks[this.cursor.blockIndex], this.cursor.offset, this.cursor.rowLength + rowHeaderSize);
        }
    }

    eof() {
        return cursorEOF(this.cursor);
    }

    first() {
        this.cursor = readFirst(this.table, this.tableDef);
        this.openRow();
    }

    next() {
        this.cursor = readNext(this.table, this.tableDef, this.cursor);
        this.openRow();
    }

    prev() {
        this.cursor = readPrevious(this.table, this.tableDef, this.cursor);
        this.openRow();
    }

    last() {
        this.cursor = readLast(this.table, this.tableDef, this.cursor);
        this.openRow();
    }

    columnType(column: string): TableColumnType | undefined {
        let col = this.tableDef.columns.find( (c) => {
           return c.name.toUpperCase() === column.toUpperCase();
        });
        if (col === undefined) { return undefined;}
        return col.type;
    }

    get<T = string | number | boolean | bigint | numeric | TDate | TTime | TDateTime | any | undefined>(column: string, col: TableColumn = undefined): T {
        if (this.fullRow === undefined) {
            return undefined;
        }
        if (col === undefined) {
            col = this.tableDef.columns.find((c) => {
                return c.name.toUpperCase() === column.toUpperCase();
            });
        }
        if (col === undefined) { return undefined;}
        return readValue(this.table, this.tableDef, col, this.fullRow, rowHeaderSize) as any as T;
    }

    isRowDeleted() {
        if (this.fullRow === undefined) {
            return true;
        }
        let flag = this.fullRow.getUint8(offs().DataRowFlag);
        return ((flag & offs().DataRowFlag_BitDeleted) === offs().DataRowFlag_BitDeleted) ? true : false;
    }


}