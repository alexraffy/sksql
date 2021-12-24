import {instanceOfParseResult} from "../BaseParser/Guards/instanceOfParseResult";
import {instanceOfTQueryInsert} from "../Query/Guards/instanceOfTQueryInsert";
import {TQueryInsert} from "../Query/Types/TQueryInsert";
import {DBData} from "./DBInit";
import {readTableDefinition} from "../Table/readTableDefinition";
import {addRow} from "../Table/addRow";
import {instanceOfTLiteral} from "../Query/Guards/instanceOfTLiteral";
import {instanceOfTColumn} from "../Query/Guards/instanceOfTColumn";
import {TColumn} from "../Query/Types/TColumn";
import {evaluate} from "./evaluate";
import {writeValue} from "../BlockIO/writeValue";
import {ParseResult} from "../BaseParser/ParseResult";
import {SQLResult} from "./SQLResult";
import {updateTableIdentityValue} from "../BlockIO/updateTableIdentityValue";
import {kTableConstraintType} from "../Table/kTableConstraintType";
import {parse} from "../BaseParser/parse";
import {predicateTQueryExpression} from "../Query/Parser/predicateTQueryExpression";
import {ParseError} from "../BaseParser/ParseError";
import {Stream} from "../BaseParser/Stream";
import {instanceOfParseError} from "../BaseParser/Guards/instanceOfParseError";
import {evaluateBooleanClauseWithRow} from "./evaluateBooleanClauseWithRow";
import {numberOfRows} from "../Table/numberOfRows";
import {TTableWalkInfo} from "./TTableWalkInfo";
import {ITable} from "../Table/ITable";
import {ITableDefinition} from "../Table/ITableDefinition";
import {numeric} from "../Numeric/numeric";
import {TDate} from "../Query/Types/TDate";
import {TParserError} from "./TParserError";
import {getValueForAliasTableOrLiteral} from "../Query/getValueForAliasTableOrLiteral";


export function processInsertStatement(parseResult: ParseResult, statement: TQueryInsert, parameters: {name: string, value: any}[], walk: TTableWalkInfo[]): SQLResult {
    if (!instanceOfParseResult(parseResult) || !instanceOfTQueryInsert(statement)) {
        return {
            error: "Misformed Insert Query.",
            resultTableName: "",
            rowCount: 0,
            executionPlan: {
                description: ""
            }
        } as SQLResult;
    }
    let insert: TQueryInsert = statement;
    let tbl: ITable;
    let def: ITableDefinition;
    for (let i = 0; i < walk.length; i++) {
        if (walk[i].name.toUpperCase() === insert.table.table.toUpperCase()) {
            tbl = walk[i].table;
            def = walk[i].def;
            break;
        }
    }
    if (tbl === undefined) {
        throw new TParserError("Table " + getValueForAliasTableOrLiteral(insert.table).table + " not found.");
    }


    let newKey = 0;
    let numberOfRowsAdded = 0;
    let currentValuesIndex = 0;
    for (let currentValuesIndex = 0; currentValuesIndex < insert.values.length; currentValuesIndex++) {
        numberOfRowsAdded++;
        let row = addRow(tbl.data, 4096);

        for (let i = 0; i < def.columns.length; i++) {
            let colDef = def.columns[i];
            let columnProcessed: boolean = false;
            let value: string | number | boolean | bigint | numeric | TDate = undefined;

            if (def.hasIdentity === true && def.identityColumnName.toUpperCase() === colDef.name.toUpperCase()) {
                // get last value
                if (def.identityValue === def.identitySeed && numberOfRows(tbl, def) === 0) {
                    value = def.identitySeed;
                } else {
                    value = def.identityValue + def.identityIncrement;
                }
                newKey = value;
                def.identityValue = value;
                writeValue(tbl, def, colDef, row, value, 0);
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
                        value = evaluate(val, parameters, undefined, colDef);
                        writeValue(tbl, def, colDef, row, value, 0);
                    }
                }
            } else {
                columnProcessed = true;
                let val = insert.values[currentValuesIndex].values[i];
                value = evaluate(val, parameters, undefined, colDef);
                writeValue(tbl, def, colDef, row, value, 0);
            }
            if (!columnProcessed) {
                if (colDef.defaultExpression !== undefined && colDef.defaultExpression !== "") {
                    let res: ParseResult | ParseError = parse((name, value) => {
                    }, predicateTQueryExpression, new Stream(colDef.defaultExpression, 0));
                    if (instanceOfParseError(res)) {
                        return {
                            error: "Error: Default Value for column " + colDef.name.toUpperCase() + " could not be computed.",
                            rowCount: 0,
                            resultTableName: "",
                            executionPlan: {
                                description: ""
                            }
                        } as SQLResult;
                    }
                    value = evaluate(res.value, [], [], colDef);
                    writeValue(tbl, def, colDef, row, value, 0);
                    columnProcessed = true;
                }
            }

            // Check if there's a NOT NULL constraint
            if (colDef.nullable === false && (value === undefined || value === null)) {
                return {
                    error: "Error: Column " + colDef.name.toUpperCase() + " must not be NULL.",
                    rowCount: 0,
                    resultTableName: "",
                    executionPlan: {
                        description: ""
                    }
                } as SQLResult;
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
            switch (constraint.type) {
                case kTableConstraintType.check:
                    let value = evaluateBooleanClauseWithRow(constraint.check, tbl, def, row, 0);
                    if (value === false) {
                        return {
                            error: "Error: Insert statement does not fulfill constraint " + constraint.constraintName + "\nStatement: " + parseResult.start.input,
                            rowCount: 0,
                            resultTableName: "",
                            executionPlan: {
                                description: ""
                            }
                        } as SQLResult
                    }
                    break;
            }
        }

    }






    // update the identity if we have it.
    if (def.hasIdentity) {
        updateTableIdentityValue(tbl, newKey);
    }



    return {
        resultTableName: "",
        rowCount: numberOfRowsAdded,
        executionPlan: {
            description: ""
        }
    } as SQLResult

}