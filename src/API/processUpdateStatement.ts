import {TQueryUpdate} from "../Query/Types/TQueryUpdate";
import {TTableWalkInfo} from "./TTableWalkInfo";
import {instanceOfParseResult} from "../BaseParser/Guards/instanceOfParseResult";
import {ParseResult} from "../BaseParser/ParseResult";
import {instanceOfTQueryUpdate} from "../Query/Guards/instanceOfTQueryUpdate";
import {SQLResult} from "./SQLResult";
import {openTables} from "./openTables";
import {cursorEOF} from "../Cursor/cursorEOF";
import {readNext} from "../Cursor/readNext";
import {evaluateWhereClause} from "./evaluateWhereClause";
import {evaluate} from "./evaluate";
import {writeValue} from "../BlockIO/writeValue";
import {getColumnDefinition} from "./getColumnDefinition";
import {kBlockHeaderField} from "../Blocks/kBlockHeaderField";


export function processUpdateStatement(parseResult: ParseResult, statement: TQueryUpdate, parameters: {name: string, value: any}[]): SQLResult {
    if (!instanceOfParseResult(parseResult) || !instanceOfTQueryUpdate(statement)) {
        return {
            error: "Misformed update query.",
            resultTableName: "",
            rowCount: 0
        } as SQLResult
    }

    let update = statement as TQueryUpdate;
    let tables: TTableWalkInfo[] = openTables(update);

    let numberOfRowsModified: number = 0;
    let done = false;
    while (!done) {
        let curs = tables[0].cursor;

        if (cursorEOF(tables[0].cursor)) {
            done = true;
            break;
        }

        let b = tables[0].table.data.blocks[curs.blockIndex];
        let dv = new DataView(b, curs.offset, tables[0].rowLength);

        let flag = dv.getUint8(kBlockHeaderField.DataRowFlag);
        const isDeleted = (flag & (1 << 7)) === 0 ? 0 : 1;
        if (isDeleted === 1) {
            tables[0].cursor = readNext(tables[0].table, tables[0].def, tables[0].cursor);
            continue;
        }


        if (evaluateWhereClause(update.where, parameters, tables) === true) {
            numberOfRowsModified++;
            for (let i = 0; i < update.sets.length; i++) {
                let col = update.sets[i].column

                let colDef = getColumnDefinition(col, tables);
                if (colDef === undefined) {
                    throw "Unknown column " + col.column;
                }
                let value = evaluate(update.sets[i].value, parameters, tables, colDef);
                writeValue(tables[0].table, tables[0].def, colDef, dv, value);
            }
            if (update.top !== undefined) {
                let maxCount = evaluate(update.top, parameters, undefined, undefined);
                if (maxCount <= numberOfRowsModified) {
                    done = true;
                }
            }
        }


        tables[0].cursor = readNext(tables[0].table, tables[0].def, tables[0].cursor);
    }

    return {
        resultTableName: "",
        rowCount: numberOfRowsModified
    } as SQLResult

}