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
import {openTables} from "../API/openTables";
import {createNewContext} from "./newContext";
import {copyBytesBetweenDV} from "../BlockIO/copyBytesBetweenDV";
import {checkConstraint} from "./checkConstraint";
import {predicateValidExpressions} from "../Query/Parser/predicateValidExpressions";
import {returnPred} from "../BaseParser/Predicates/ret";
import {oneOf} from "../BaseParser/Predicates/oneOf";
import {cloneContext} from "./cloneContext";
import {SKSQL} from "../API/SKSQL";


export function processInsertStatement(db: SKSQL, context: TExecutionContext, statement: TQueryInsert) {
    let insert: TQueryInsert = statement;
    let tbl: ITable;
    let def: ITableDefinition;
    let rowLength: number;
    let newContext: TExecutionContext = cloneContext(context, "insert", true, true);
    let ots = openTables(db, statement);
    for (let i = 0; i < ots.length; i++) {
        let exists = newContext.openTables.find((ot) => { return ot.name.toUpperCase() === ots[i].name.toUpperCase();});
        if (exists === undefined) {
            newContext.openTables.push(ots[i]);
        }
        if (ots[i].name.toUpperCase() === insert.table.table.toUpperCase()) {
            tbl = ots[i].table;
            def = ots[i].def;
            rowLength = ots[i].rowLength;
        }
    }

    newContext.currentStatement = insert;

    if (tbl === undefined) {
        throw new TParserError("Table " + getValueForAliasTableOrLiteral(insert.table).table + " not found.");
    }


    let newKey = 0;
    let numberOfRowsAdded = 0;
    let currentValuesIndex = 0;
    for (let currentValuesIndex = 0; currentValuesIndex < insert.values.length; currentValuesIndex++) {
        numberOfRowsAdded++;

        // write to a temp buffer
        // if no constraint errors happen,
        // we'll copy the content to a new row
        let ab = new ArrayBuffer(rowLength);
        let row = new DataView(ab, 0, rowLength);

        for (let i = 0; i < def.columns.length; i++) {
            let colDef = def.columns[i];
            let columnProcessed: boolean = false;
            let value: string | number | boolean | bigint | numeric | TDate | TTime | TDateTime = undefined;

            if (def.hasIdentity === true && def.identityColumnName.toUpperCase() === colDef.name.toUpperCase()) {
                // get last value
                if (def.identityValue === def.identitySeed && numberOfRows(tbl, def) === 0) {
                    value = def.identitySeed;
                } else {
                    value = def.identityValue + def.identityIncrement;
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
                        let val = insert.values[currentValuesIndex].values[x];
                        value = evaluate(db, newContext, val, colDef);
                        let val2Write = convertValue(value, colDef.type);
                        writeValue(tbl, def, colDef, row, val2Write, rowHeaderSize);
                    }
                }
            } else {
                columnProcessed = true;
                let val = insert.values[currentValuesIndex].values[i];
                value = evaluate(db, newContext, val, colDef);
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
                    value = evaluate(db, newContext, res.value, colDef);
                    let val2Write = convertValue(value, colDef.type);
                    writeValue(tbl, def, colDef, row, val2Write, rowHeaderSize);
                    columnProcessed = true;
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

    }


    // update the identity if we have it.
    if (def.hasIdentity) {
        updateTableIdentityValue(tbl, newKey);
    }
    context.broadcastQuery = true;
    context.result.rowsInserted += numberOfRowsAdded;



}