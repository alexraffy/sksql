import {instanceOfParseResult} from "../BaseParser/Guards/instanceOfParseResult";
import {instanceOfTQuerySelect} from "../Query/Guards/instanceOfTQuerySelect";
import {TQuerySelect} from "../Query/Types/TQuerySelect";
import {TTableWalkInfo} from "./TTableWalkInfo";
import {instanceOfTLiteral} from "../Query/Guards/instanceOfTLiteral";
import {TLiteral} from "../Query/Types/TLiteral";
import {instanceOfTTable} from "../Query/Guards/instanceOfTTable";
import {TTable} from "../Query/Types/TTable";
import {DBData} from "./DBInit";
import {readTableDefinition} from "../Table/readTableDefinition";
import {readFirst} from "../Cursor/readFirst";
import {recordSize} from "../Table/recordSize";
import {kQueryJoin} from "../Query/Enums/kQueryJoin";
import {instanceOfTQueryComparison} from "../Query/Guards/instanceOfTQueryComparison";
import {TQueryComparison} from "../Query/Types/TQueryComparison";
import {instanceOfTQueryComparisonExpression} from "../Query/Guards/instanceOfTQueryComparisonExpression";
import {instanceOfTQueryExpression} from "../Query/Guards/instanceOfTQueryExpression";
import {instanceOfTQueryFunctionCall} from "../Query/Guards/instanceOfTQueryFunctionCall";
import {TQueryFunctionCall} from "../Query/Types/TQueryFunctionCall";
import {instanceOfTColumn} from "../Query/Guards/instanceOfTColumn";
import {ITableDefinition} from "../Table/ITableDefinition";
import {findExpressionType} from "./findExpressionType";
import {TableColumnType} from "../Table/TableColumnType";
import {newTable} from "../Table/newTable";
import {cursorEOF} from "../Cursor/cursorEOF";
import {readNext} from "../Cursor/readNext";
import {ParseResult} from "../BaseParser/ParseResult";
import {evaluateWhereClause} from "./evaluateWhereClause";
import {addRow} from "../Table/addRow";
import {evaluate} from "./evaluate";
import {writeValue} from "../BlockIO/writeValue";
import {SQLResult} from "./SQLResult";
import {findTableNameForColumn} from "./findTableNameForColumn";
import {openTables} from "./openTables";
import {kBlockHeaderField} from "../Blocks/kBlockHeaderField";
import {bubbleSort} from "../Sort/bubbleSort";


export function processSelectStatement(parseResult: ParseResult, statement: TQuerySelect, parameters: {name: string, value: any}[]): SQLResult {
    if (!instanceOfParseResult(parseResult) || !instanceOfTQuerySelect(statement)) {
        return {
            error: "Misformed Select Query.",
            resultTableName: "",
            rowCount: 0
        } as SQLResult;
    }
    let select: TQuerySelect = statement;
    let columnsNeededForWhereClause: {tableName: string, columnName: string}[] = [];
    let tables: TTableWalkInfo[] = openTables(select);


    function recursionFindColumnsInWhereClause(o: any, columns: {tableName: string, columnName: string}[]) {
        if (instanceOfTQueryComparison(o)) {
            recursionFindColumnsInWhereClause((o as TQueryComparison).left, columns);
            recursionFindColumnsInWhereClause((o as TQueryComparison).right, columns);
        }
        if (instanceOfTQueryComparisonExpression(o)) {
            recursionFindColumnsInWhereClause(o.a, columns);
            recursionFindColumnsInWhereClause(o.b, columns);
        }
        if (instanceOfTQueryExpression(o)) {
            recursionFindColumnsInWhereClause(o.value.left, columns);
            recursionFindColumnsInWhereClause(o.value.right, columns);
        }
        if (instanceOfTQueryFunctionCall(o)) {
            let fc = o as TQueryFunctionCall;
            for (let i = 0; i < fc.value.parameters.length; i++) {
                recursionFindColumnsInWhereClause(fc.value.parameters[i], columns);
            }
        }
        if (instanceOfTColumn(o)) {
            let name = o.column;
            let table = o.table;
            if (table === "") {
                let tableNames = findTableNameForColumn(name, tables);
                if (tableNames.length === 0) {
                    throw "Unknown column name " + name;
                }
                if (tableNames.length > 1) {
                    throw "Ambiguous column name " + name;
                }
                table = tableNames[0];
            }
            let t = tables.find((t) => { return t.alias === table;});
            let colDef = t.def.columns.find( (col) => { return col.name.toUpperCase() === name.toUpperCase();});

            columns.push({
                tableName: t.name,
                columnName: colDef.name
            });
        }
    }


    if (select.where !== undefined) {
        if (instanceOfTQueryComparison(select.where)) {
            recursionFindColumnsInWhereClause(select.where, columnsNeededForWhereClause);
        }
    }

    // create the return table
    // we go through the select columns
    // to find out the type expected
    let i = 1;
    let returnTableName = "query" +i;
    while (DBData.instance.getTable(returnTableName) !== undefined) {
        returnTableName = "query" + (++i);
    }


    let returnTableDefinition = {
        name: returnTableName,
        columns: [],
        hasIdentity: false,
        identityColumnName: '',
        identitySeed: 1,
        identityIncrement: 1,
        constraints: [],
    } as ITableDefinition

    for (let i = 0; i < select.columns.length; i++) {
        let col = select.columns[i];
        let types = findExpressionType(col.expression, tables);
        let name = "";
        if (instanceOfTLiteral(col.alias.alias)) {
            name = col.alias.alias.value;
        } else if (typeof col.alias.alias === "string") {
            name = col.alias.alias as string;
        }
        returnTableDefinition.columns.push(
            {
                name: name,
                type: types,
                length: (types === TableColumnType.varchar) ? 255 : 1,
                nullable: true,
                defaultExpression: ""
            }
        );
    }
    let returnTable = newTable(returnTableDefinition);
    returnTableDefinition = readTableDefinition(returnTable.data);

    let numberOfRowsAdded = 0;
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


        if (evaluateWhereClause(select.where, parameters, tables) === true) {
            numberOfRowsAdded++;
            let resultRow = addRow(returnTable.data);
            for (let i = 0; i < returnTableDefinition.columns.length; i++) {
                let value = evaluate(select.columns[i].expression, parameters, tables, returnTableDefinition.columns[i]);
                writeValue(returnTable, returnTableDefinition, returnTableDefinition.columns[i], resultRow, value, 0);
            }
            if (select.top !== undefined) {
                let maxCount = evaluate(select.top, parameters, undefined, undefined);
                if (maxCount <= numberOfRowsAdded) {
                    done = true;
                }
            }
        }

        tables[0].cursor = readNext(tables[0].table, tables[0].def, tables[0].cursor);
    }

    // order by
    if (select.orderBy.length > 0) {
        bubbleSort(returnTable, returnTableDefinition, select.orderBy);
    }


    return {
        resultTableName: returnTableName,
        rowCount: numberOfRowsAdded
    } as SQLResult

}