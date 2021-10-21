import {TQuerySelect} from "../Query/Types/TQuerySelect";
import {TEP} from "./TEP";
import {TEPScan} from "./TEPScan";
import {DBData} from "../API/DBInit";
import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {openTables} from "../API/openTables";
import {ITableDefinition} from "../Table/ITableDefinition";
import {findExpressionType} from "../API/findExpressionType";
import {instanceOfTLiteral} from "../Query/Guards/instanceOfTLiteral";
import {TableColumnType} from "../Table/TableColumnType";
import {newTable} from "../Table/newTable";
import {readTableDefinition} from "../Table/readTableDefinition";
import {TEPSelect} from "./TEPSelect";
import {TEPSortNTop} from "./TEPSortNTop";
import {TEPNestedLoop} from "./TEPNestedLoop";
import {TQueryOrderBy} from "../Query/Types/TQueryOrderBy";
import {instanceOfTColumn} from "../Query/Guards/instanceOfTColumn";
import {TQueryColumn} from "../Query/Types/TQueryColumn";


export function generateExecutionPlanFromStatement(select: TQuerySelect): TEP[] {
    let ret: TEP[] = [];


    let tables: TTableWalkInfo[] = openTables(select);
    let columnsNeeded: {tableName: string, columnName: string}[] = [];
    let i = 1;
    let returnTableName = "#query" +i;
    while (DBData.instance.getTable(returnTableName) !== undefined) {
        returnTableName = "#query" + (++i);
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
    // add invisible columns for order by clauses
    if (select.orderBy.length > 0) {
        for (let i = 0; i < select.orderBy.length; i++) {
            let o: TQueryOrderBy = select.orderBy[i];
            let colname: string;
            if (instanceOfTLiteral(o.column)) {
                colname = o.column.value;
                if (colname === "ROWID") {
                    continue;
                }
            }
            if (instanceOfTColumn(o.column)) {
                if (o.column.table !== undefined && o.column.table !== "") {
                    colname = o.column.table + "." + o.column.column
                } else {
                    colname = o.column.column;
                }
            }

            let found = false;
            for (let x = 0; x < returnTableDefinition.columns.length; x++) {
                let c = returnTableDefinition.columns[x];
                if (c.name.toUpperCase() === colname.toUpperCase()) {
                    found = true;
                }
            }
            if (found === false) {
                let type = findExpressionType(o.column, tables);
                // add the column to the select columns so they are written automatically
                select.columns.push({
                    kind: "TQueryColumn",
                    alias: undefined,
                    expression: o.column
                });
                let length = 1;
                if (type === TableColumnType.varchar) {
                    length = 255;
                }
                returnTableDefinition.columns.push({
                    name: colname,
                    type: type,
                    length: length,
                    nullable: true,
                    defaultExpression: undefined,
                    invisible: true
                });
            }
        }
    }
    let returnTable = newTable(returnTableDefinition);
    returnTableDefinition = readTableDefinition(returnTable.data, true);



    let current: TEPScan | TEPNestedLoop;
    let idx = select.tables.length -1;
    while (idx >= 0) {
        let scan: TEPScan = {
            kind: "TEPScan",
            table: select.tables[idx].tableName,
            range: undefined,
            output: select.columns,
            predicate: (idx === 0) ? select.where : select.tables[idx].joinClauses,
            result: returnTableDefinition.name
        }

        if (current !== undefined) {
            let nestedLoop: TEPNestedLoop = {
                kind: "TEPNestedLoop",
                a: scan,
                b: current,
                join: select.tables[idx].joinClauses
            }
            current = nestedLoop;
        } else {
            current = scan;
        }

        idx--;
    }

    ret.push(current);


    if (select.orderBy.length > 0) {
        if (!(instanceOfTLiteral(select.orderBy[0].column) && select.orderBy[0].column.value === "ROWID")) {
            let stepSort: TEPSortNTop = {
                kind: "TEPSortNTop",
                source: returnTableDefinition.name,
                orderBy: select.orderBy,
                top: select.top,
                dest: ""
            }
            ret.push(stepSort);

        }
    }


    let stepSelect: TEPSelect = {
        kind: "TEPSelect",
        dest: returnTableDefinition.name,
    }
    ret.push(stepSelect);

    return ret;
}