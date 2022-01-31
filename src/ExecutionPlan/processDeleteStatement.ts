import {instanceOfParseResult} from "../BaseParser/Guards/instanceOfParseResult";
import {SQLResult} from "../API/SQLResult";
import {ParseResult} from "../BaseParser/ParseResult";
import {TQueryUpdate} from "../Query/Types/TQueryUpdate";
import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {openTables} from "../API/openTables";
import {cursorEOF} from "../Cursor/cursorEOF";
import {evaluateWhereClause} from "../API/evaluateWhereClause";
import {evaluate} from "../API/evaluate";
import {getColumnDefinition} from "../API/getColumnDefinition";
import {writeValue} from "../BlockIO/writeValue";
import {readNext} from "../Cursor/readNext";
import {TQueryDelete} from "../Query/Types/TQueryDelete";
import {TableColumnType} from "../Table/TableColumnType";
import {kBlockHeaderField} from "../Blocks/kBlockHeaderField";
import {instanceOfTQueryDelete} from "../Query/Guards/instanceOfTQueryDelete";
import {ITable} from "../Table/ITable";
import {ITableDefinition} from "../Table/ITableDefinition";
import {instanceOfTTable} from "../Query/Guards/instanceOfTTable";
import {instanceOfTLiteral} from "../Query/Guards/instanceOfTLiteral";
import {readFirst} from "../Cursor/readFirst";
import {TLiteral} from "../Query/Types/TLiteral";
import {TTable} from "../Query/Types/TTable";
import {TAlias} from "../Query/Types/TAlias";
import {instanceOfTAlias} from "../Query/Guards/instanceOfTAlias";
import {getValueForAliasTableOrLiteral} from "../Query/getValueForAliasTableOrLiteral";
import {numeric} from "../Numeric/numeric";
import {isNumeric} from "../Numeric/isNumeric";
import {TParserError} from "../API/TParserError";
import {TExecutionContext} from "./TExecutionContext";


export function processDeleteStatement(context: TExecutionContext, statement: TQueryDelete) {
    context.openTables.push(...openTables(statement));
    let del = statement as TQueryDelete;
    let tbl: ITable;
    let def: ITableDefinition;
    let rowLength = 0;
    for (let i = 0; i < context.openTables.length; i++) {
        let name = getValueForAliasTableOrLiteral(del.tables[0].tableName)
        if (context.openTables[i].name.toUpperCase() === name.table.toUpperCase()) {
            tbl = context.openTables[i].table;
            def = context.openTables[i].def;
            rowLength = context.openTables[i].rowLength;
        }

    }
    if (tbl === undefined) {
        throw new TParserError("Table " + getValueForAliasTableOrLiteral(del.tables[0].tableName).table + " not found.");
    }

    let cursor = readFirst(tbl, def);
    let numberOfRowsModified: number = 0;
    let done = false;
    while (!done) {

        if (cursorEOF(cursor)) {
            done = true;
            break;
        }

        let b = tbl.data.blocks[cursor.blockIndex];
        let dv = new DataView(b, cursor.offset, rowLength);
        let flag = dv.getUint8(kBlockHeaderField.DataRowFlag);
        const isDeleted = (flag & (1 << 7)) === 0 ? 0 : 1;
        if (isDeleted === 1) {
            cursor = readNext(tbl, def, cursor);
            continue;
        }


        if (evaluateWhereClause(context, del.where) === true) {
            numberOfRowsModified++;
            flag = flag | (1 << 7);
            dv.setUint8(kBlockHeaderField.DataRowFlag, flag);

            if (del.top !== undefined) {
                let maxCount = evaluate(context, del.top, undefined, undefined);
                if (isNumeric(maxCount)) {
                    if (maxCount.m <= numberOfRowsModified) {
                        done = true;
                    }
                }
            }
        }


        cursor = readNext(tbl, def, cursor);
    }
    context.results.push({
        resultTableName: "",
        rowCount: numberOfRowsModified,
        executionPlan: {
            description: ""
        }
    } as SQLResult);

}