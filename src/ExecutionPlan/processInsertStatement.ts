import {TQueryInsert} from "../Query/Types/TQueryInsert";
import {addRow, rowHeaderSize} from "../Table/addRow";
import {instanceOfTLiteral} from "../Query/Guards/instanceOfTLiteral";
import {instanceOfTColumn} from "../Query/Guards/instanceOfTColumn";
import {TColumn} from "../Query/Types/TColumn";
import {evaluate} from "../API/evaluate";
import {writeValue} from "../BlockIO/writeValue";
import {ParseResult} from "../BaseParser/ParseResult";
import {SQLResult} from "../API/SQLResult";
import {updateTableIdentityValue} from "../BlockIO/updateTableIdentityValue";
import {kTableConstraintType} from "../Table/kTableConstraintType";
import {parse} from "../BaseParser/parse";
import {predicateTQueryExpression} from "../Query/Parser/predicateTQueryExpression";
import {ParseError} from "../BaseParser/ParseError";
import {Stream} from "../BaseParser/Stream";
import {instanceOfParseError} from "../BaseParser/Guards/instanceOfParseError";

import {numberOfRows} from "../Table/numberOfRows";
import {ITable} from "../Table/ITable";
import {ITableDefinition} from "../Table/ITableDefinition";
import {numeric} from "../Numeric/numeric";
import {TDate} from "../Query/Types/TDate";
import {TParserError} from "../API/TParserError";
import {getValueForAliasTableOrLiteral} from "../Query/getValueForAliasTableOrLiteral";
import {TTime} from "../Query/Types/TTime";
import {TDateTime} from "../Query/Types/TDateTime";
import {convertValue} from "../API/convertValue";
import {TExecutionContext} from "./TExecutionContext";
import {createNewContext} from "./newContext";
import {copyBytesBetweenDV} from "../BlockIO/copyBytesBetweenDV";
import {checkConstraint} from "./checkConstraint";
import {predicateValidExpressions} from "../Query/Parser/predicateValidExpressions";
import {returnPred} from "../BaseParser/Predicates/ret";
import {oneOf} from "../BaseParser/Predicates/oneOf";
import {cloneContext} from "./cloneContext";
import {SKSQL} from "../API/SKSQL";
import {instanceOfTTable} from "../Query/Guards/instanceOfTTable";
import {readFirstColumnOfTable} from "../API/readFirstColumnOfTable";
import {TTable} from "../Query/Types/TTable";
import {processSelectStatement} from "./processSelectStatement";
import {readTableDefinition} from "../Table/readTableDefinition";
import {readFirst} from "../Cursor/readFirst";
import {cursorEOF} from "../Cursor/cursorEOF";
import {readNext} from "../Cursor/readNext";
import {readTableAsJSON} from "../API/readTableAsJSON";
import {readValue} from "../BlockIO/readValue";
import {recordSize} from "../Table/recordSize";
import {dumpTable} from "../Table/dumpTable";
import {TDebugInfo} from "../Query/Types/TDebugInfo";
import {TBooleanResult} from "../API/TBooleanResult";
import {updateTableTimestamp} from "../API/updateTableTimestamp";


function insertRow(db: SKSQL, context: TExecutionContext, newContext: TExecutionContext, insert: TQueryInsert, rowLength: number, tbl: ITable, def: ITableDefinition, rowData: any[]) {
    let newKey = -1;

    // write to a temp buffer
    // if no constraint errors happen,
    // we'll copy the content to a new row
    let ab = new ArrayBuffer(rowLength);
    let row = new DataView(ab, 0, rowLength);

    for (let i = 0; i < def.columns.length; i++) {
        let colDef = def.columns[i];
        let columnProcessed: boolean = false;
        let value: string | number | boolean | bigint | numeric | TDate | TTime | TDateTime | TTable | TBooleanResult = undefined;

        if (def.hasIdentity === true && def.identityColumnName.toUpperCase() === colDef.name.toUpperCase()) {
            // get last value
            if (def.identityValue === def.identitySeed && numberOfRows(tbl, def) === 0) {
                value = def.identitySeed;
            } else {
                value = ((def.identityValue===undefined) ? 0 : def.identityValue) + def.identityIncrement;
            }
            newKey = value;
            def.identityValue = value;
            writeValue(tbl, def, colDef, row, value, rowHeaderSize);
            context.scopedIdentity = value;
            columnProcessed = true;
        }

        if (insert.columns.length > 0) {
            for (let x = 0; x < insert.columns.length; x++) {
                let colName = "";
                let col = insert.columns[x];
                if (instanceOfTLiteral(col)) {
                    colName = col.value;
                } else if (instanceOfTColumn(col)) {
                    colName = (col as TColumn).column
                }
                if (colDef.name.toUpperCase() === colName.toUpperCase()) {
                    columnProcessed = true;
                    let val = rowData[x];
                    value = evaluate(db, newContext, val,  [], colDef);
                    if (instanceOfTTable(value)) {
                        value = readFirstColumnOfTable(db, newContext, value);
                    }
                    let val2Write = convertValue(value, colDef.type);
                    writeValue(tbl, def, colDef, row, val2Write, rowHeaderSize);
                }
            }
        } else {
            columnProcessed = true;
            let val = rowData[i];
            value = evaluate(db, newContext, val,  [], colDef);
            if (instanceOfTTable(value)) {
                value = readFirstColumnOfTable(db, newContext, value);
            }
            let val2Write = convertValue(value, colDef.type);
            writeValue(tbl, def, colDef, row, val2Write, rowHeaderSize);
        }
        if (!columnProcessed) {
            if (colDef.defaultExpression !== undefined && colDef.defaultExpression !== "") {
                let res: ParseResult | ParseError = parse((name, value) => {
                }, function *() {
                    let ret = yield oneOf([predicateTQueryExpression, predicateValidExpressions], "");
                    yield returnPred(ret);
                }, new Stream(colDef.defaultExpression, 0));
                if (instanceOfParseError(res)) {
                    throw new TParserError("Error: Default Value for column " + colDef.name.toUpperCase() + " could not be computed.");
                }
                let newContext: TExecutionContext = createNewContext("", context.query, undefined);
                value = evaluate(db, newContext, res.value,  [], colDef);
                if (instanceOfTTable(value)) {
                    value = readFirstColumnOfTable(db, newContext, value);
                }
                let val2Write = convertValue(value, colDef.type);
                writeValue(tbl, def, colDef, row, val2Write, rowHeaderSize);
                columnProcessed = true;
            } else {
                writeValue(tbl, def, colDef, row, undefined, rowHeaderSize);
            }
        }

        // Check if there's a NOT NULL constraint
        if (colDef.nullable === false && (value === undefined || value === null)) {
            throw new TParserError("Error: Column " + colDef.name.toUpperCase() + " must not be NULL.");
        }

        for (let i = 0; i < def.constraints.length; i++) {
            let constraint = def.constraints[i];

            switch (constraint.type) {
                case kTableConstraintType.unique:
                    break;
                case kTableConstraintType.primaryKey:
                    break;
                case kTableConstraintType.foreignKey:
                    break;
            }
        }

    }

    for (let i = 0; i < def.constraints.length; i++) {
        let constraint = def.constraints[i];
        checkConstraint(db, context, tbl, def, constraint, row, rowLength);
    }

    // we write the row to the block
    let newRow = addRow(tbl.data, 655360);
    copyBytesBetweenDV(rowLength - rowHeaderSize, row, newRow, rowHeaderSize, rowHeaderSize);

    return newKey;
}


export function processInsertStatement(db: SKSQL, context: TExecutionContext, statement: TQueryInsert) {
    let insert: TQueryInsert = statement;
    let tbl: ITable;
    let def: ITableDefinition;
    let rowLength: number;
    let newContext: TExecutionContext = cloneContext(context, "insert", true, true);
    let tblInfo = db.tableInfo.get(insert.table.table);
    tbl = tblInfo.pointer;
    def = tblInfo.def;
    rowLength = recordSize(tbl.data) + rowHeaderSize;

    newContext.currentStatement = insert;

    if (tbl === undefined) {
        throw new TParserError("Table " + getValueForAliasTableOrLiteral(insert.table).table + " not found.");
    }
    let numColumns = def.columns.filter((c) => { return c.invisible === undefined || c.invisible === false;}).length;

    // check that we have the right number of columns
    if (insert.columns === undefined || insert.columns.length === 0) {
        if (insert.values !== undefined) {
            for (let i = 0; i < insert.values.length; i++) {
                if (insert.values[i].values.length !== numColumns) {
                    throw new TParserError("Values in INSERT statement must have the same number of columns.");
                }
            }
        } else {
            if (insert.selectStatement !== undefined && insert.selectStatement.columns.length !== numColumns) {
                throw new TParserError("Values in SELECT statement must have the same number of columns than the INSERT target.");
            }
        }
    } else {
        let numColumnsSpecified = insert.columns.length;
        // check that the columns exist
        for (let i = 0; i < insert.columns.length; i++) {
            if (def.columns.find((c) => { return c.name.toUpperCase() === insert.columns[i].value.toUpperCase();}) === undefined) {
                throw new TParserError("Column not found " + insert.columns[i].value);
            }
        }

        if (insert.values !== undefined) {
            let numColInValues = undefined;
            for (let i = 0; i < insert.values.length;i++) {
                if (numColInValues === undefined) {
                    numColInValues = insert.values[i].values.length;
                    if (numColInValues !== numColumnsSpecified) {
                        throw new TParserError("Values in INSERT statement must have the same number of columns.");
                    }
                } else {
                    if (insert.values[i].values.length !== numColInValues) {
                        throw new TParserError("Values in INSERT statement must have the same number of columns.");
                    }
                }
            }
        } else {
            if (insert.selectStatement !== undefined && insert.columns.length !== numColumnsSpecified) {
                throw new TParserError("Values in SELECT statement must have the same number of columns than the INSERT target.");
            }
        }


    }



    let newKey = 0;
    let numberOfRowsAdded = 0;
    let currentValuesIndex = 0;
    if (insert.values !== undefined) {
        for (let currentValuesIndex = 0; currentValuesIndex < insert.values.length; currentValuesIndex++) {
            newKey = insertRow(db, context, newContext, insert, rowLength, tbl, def, insert.values[currentValuesIndex].values);
            numberOfRowsAdded++;

        }
    }
    if (insert.selectStatement !== undefined) {
        let selectResultTable: TTable;
        let q = "";
        if (context.query !== "" && (insert.selectStatement as TDebugInfo).debug !== undefined) {
            q = context.query; //.substring((insert.selectStatement as TDebugInfo).debug.start, (insert.selectStatement as TDebugInfo).debug.end);
        }
        let selectContext = createNewContext("select", q, context.parseResult as ParseResult);
        selectResultTable = processSelectStatement(db, selectContext, insert.selectStatement, true);
        let selectTableInfo = db.tableInfo.get(selectResultTable.table);

        //console.log("INSERT INTO SELECT");
        //console.log(dumpTable(selectTableInfo.pointer));

        let selectTable = selectTableInfo.pointer;
        let selectDef = selectTableInfo.def;
        let selectCursor = readFirst(selectTable, selectDef);
        while (!cursorEOF(selectCursor)) {
            let rows = [];
            for (let x = 0; x < selectDef.columns.length; x++) {
                let fullRow = new DataView(selectTable.data.blocks[selectCursor.blockIndex], selectCursor.offset, selectCursor.rowLength + rowHeaderSize);
                rows.push(readValue(selectTable, selectDef, selectDef.columns[x], fullRow, rowHeaderSize));
            }
            newKey = insertRow(db, context, newContext, insert, rowLength, tbl, def, rows);
            numberOfRowsAdded++;
            selectCursor = readNext(selectTable, selectDef, selectCursor);
        }

    }

    // update the identity if we have it.
    if (def.hasIdentity) {
        updateTableIdentityValue(tbl, newKey);
    }
    if (numberOfRowsAdded > 0) {
        updateTableTimestamp(db, def.name.toUpperCase());
    }

    context.broadcastQuery = true;
    context.result.rowsInserted += numberOfRowsAdded;



}