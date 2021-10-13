import {ITableCursor} from "../Cursor/ITableCursor";
import {ITableDefinition} from "../Table/ITableDefinition";
import {readTableDefinition} from "../Table/readTableDefinition";
import {DBData} from "./DBInit";
import {ITable} from "../Table/ITable";
import {cursorEOF} from "../Cursor/cursorEOF";
import {readValue} from "../BlockIO/readValue";
import {columnTypeIsInteger} from "../Table/columnTypeIsInteger";
import {writeValue} from "../BlockIO/writeValue";
import {readStringFromUtf8Array} from "../BlockIO/readStringFromUtf8Array";
import {writeStringToUtf8ByteArray} from "../BlockIO/writeStringToUtf8ByteArray";
import {columnTypeIsString} from "../Table/columnTypeIsString";
import {columnTypeIsBoolean} from "../Table/columnTypeIsBoolean";
import {readFirst} from "../Cursor/readFirst";
import {recordSize} from "../Table/recordSize";
import {readNext} from "../Cursor/readNext";


export class CTable {
    private tableName: string;
    private cursor: ITableCursor;
    private tableRef: ITable;
    private tableDefinitionRef: ITableDefinition;
    private currentRow: DataView;

    constructor(tableName: string) {
        this.tableName = tableName;
        this.tableRef = DBData.instance.getTable(tableName);
        this.tableDefinitionRef = readTableDefinition(this.tableRef.data);
    }

    get EOF(): boolean {
        return cursorEOF(this.cursor);
    }

    getInteger(columnName: string): number | bigint {
        if (cursorEOF(this.cursor)) {
            return undefined;
        }
        let c = this.tableDefinitionRef.columns.find((col) => { return col.name === columnName;});
        if (c === undefined) return undefined;
        return readValue(this.tableRef, this.tableDefinitionRef, c, this.currentRow) as number;
    }

    setInteger(columnName: string, value: number | bigint) {
        if (cursorEOF(this.cursor)) {
            return undefined;
        }
        let c = this.tableDefinitionRef.columns.find((col) => { return col.name === columnName;});
        if (c === undefined) return undefined;
        writeValue(this.tableRef, this.tableDefinitionRef, c, this.currentRow, value);
    }

    getString(columnName: string): string {
        if (cursorEOF(this.cursor)) {
            return undefined;
        }
        let c = this.tableDefinitionRef.columns.find((col) => { return col.name === columnName;});
        if (c === undefined) return undefined;
        return readStringFromUtf8Array(this.currentRow, c.offset + 5, c.length);
    }

    setString(columnName: string, value: string) {
        if (cursorEOF(this.cursor)) {
            return undefined;
        }
        let c = this.tableDefinitionRef.columns.find((col) => { return col.name === columnName;});
        if (c === undefined) return undefined;
        writeStringToUtf8ByteArray(this.currentRow, c.offset + 5, value, c.length);
    }

    getBoolean(columnName: string): boolean {
        if (cursorEOF(this.cursor)) {
            return undefined;
        }
        let c = this.tableDefinitionRef.columns.find((col) => { return col.name === columnName;});
        if (c === undefined) return undefined;
        return readValue(this.tableRef, this.tableDefinitionRef, c, this.currentRow) as boolean;
    }

    setBoolean(columnName: string, value: boolean) {
        if (cursorEOF(this.cursor)) {
            return undefined;
        }
        let c = this.tableDefinitionRef.columns.find((col) => { return col.name === columnName;});
        if (c === undefined) return undefined;
        writeValue(this.tableRef, this.tableDefinitionRef, c, this.currentRow, value);
    }

    first() {
        this.cursor = readFirst(this.tableRef, this.tableDefinitionRef);
        this.currentRow = undefined;
        if (!cursorEOF(this.cursor)) {
            this.currentRow = new DataView(this.tableRef.data.blocks[this.cursor.blockIndex], this.cursor.offset, recordSize(this.tableRef.data) + 5 );
        }
    }

    next() {
        this.cursor = readNext(this.tableRef, this.tableDefinitionRef, this.cursor);
        this.currentRow = undefined;
        if (!cursorEOF(this.cursor)) {
            this.currentRow = new DataView(this.tableRef.data.blocks[this.cursor.blockIndex], this.cursor.offset, recordSize(this.tableRef.data) + 5);
        }
    }



}