import {TQuerySelect} from "../Query/Types/TQuerySelect";
import {TEP} from "./TEP";
import {TEPScan} from "./TEPScan";
import {SKSQL} from "../API/SKSQL";
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
import {TEPGroupBy} from "./TEPGroupBy";
import {TTable} from "../Query/Types/TTable";
import {recordSize} from "../Table/recordSize";
import {readFirst} from "../Cursor/readFirst";
import {TableColumn} from "../Table/TableColumn";
import {TEPProjection} from "./TEPProjection";
import {TColumn} from "../Query/Types/TColumn";
import {instanceOfTStar} from "../Query/Guards/instanceOfTStar";
import {TStar} from "../Query/Types/TStar";
import {instanceOfTTable} from "../Query/Guards/instanceOfTTable";
import {instanceOfTAlias} from "../Query/Guards/instanceOfTAlias";
import {getValueForAliasTableOrLiteral} from "../Query/getValueForAliasTableOrLiteral";
import {TExecutionContext} from "./TExecutionContext";
import {TQueryUpdate} from "../Query/Types/TQueryUpdate";
import {instanceOfTQuerySelect} from "../Query/Guards/instanceOfTQuerySelect";
import {instanceOfTQueryUpdate} from "../Query/Guards/instanceOfTQueryUpdate";
import {ITable} from "../Table/ITable";
import {TEPUpdate} from "./TEPUpdate";



function addInvisibleColumnsForSorting(tables: TTableWalkInfo[],
                                       select: TQuerySelect,
                                       clause: TQueryOrderBy,
                                       def: ITableDefinition,
                                       projections: TEPProjection[],
                                       parameters: {name: string, type: TableColumnType, value: any}[]
                                       ): {projections: TEPProjection[], def: ITableDefinition} {
    let o: TQueryOrderBy = clause;
    let colname: string;
    if (instanceOfTLiteral(o.column)) {
        colname = o.column.value;
        if (colname === "ROWID") {
            return;
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
    for (let x = 0; x < def.columns.length; x++) {
        let c = def.columns[x];
        if (c.name.toUpperCase() === colname.toUpperCase()) {
            found = true;
        }
    }
    if (found === false) {
        let type = findExpressionType(o.column, tables, parameters);
        // add the column to the select columns so they are written automatically
        let tcol: TQueryColumn = {
            kind: "TQueryColumn",
            alias: undefined,
            expression: o.column
        }
        select.columns.push(tcol);
        let length = 1;
        if (type === TableColumnType.varchar) {
            length = 255;
        }
        def.columns.push({
            name: colname,
            type: type,
            length: length,
            nullable: true,
            defaultExpression: undefined,
            invisible: true
        });

        projections.push({
            columnName: colname,
            output: tcol
        });

    }
    return {projections: projections, def: def};
}


export function generateExecutionPlanFromStatement(context: TExecutionContext, select: TQuerySelect | TQueryUpdate): TEP[] {
    let ret: TEP[] = [];


    let tables: TTableWalkInfo[] = openTables(select);
    context.openTables.push(...tables);
    let columnsNeeded: {tableName: string, columnName: string}[] = [];
    let returnTableName = "";
    if (instanceOfTQuerySelect(select)) {
        let i = 1;
        returnTableName = "#query" + i;
        while (SKSQL.instance.getTable(returnTableName) !== undefined) {
            returnTableName = "#query" + (++i);
        }
    }

    let projections: TEPProjection[] = [];

    let returnTableDefinition = {
        name: returnTableName,
        columns: [],
        hasIdentity: false,
        identityColumnName: '',
        identitySeed: 1,
        identityIncrement: 1,
        constraints: [],
    } as ITableDefinition

    let hasAggregation = false;

    let recursion_callback = (o: any, key: string, value: string | number | boolean | any) => {
        if (key === "AGGREGATE" && value === true) {
            hasAggregation = true;
        }
        if (key === "AGG_COLUMN") {
            let table: string = value.table;
            let column: string = value.column;
            let coldef: TableColumn = value.def;

            let found = false;
            for (let x = 0; x < returnTableDefinition.columns.length; x++) {
                let c = returnTableDefinition.columns[x];
                if (c.name.toUpperCase() === column.toUpperCase()) {
                    found = true;
                }
            }
            if (found === false) {

                returnTableDefinition.columns.push(
                    {
                        name: column,
                        type: coldef.type,
                        length: (coldef.type === TableColumnType.varchar) ? 255 : 1,
                        nullable: true,
                        defaultExpression: "",
                        invisible: true
                    }
                );

                projections.push(
                    {
                        columnName: column,
                        output: {
                            kind: "TQueryColumn",
                            alias: undefined,
                            expression: {kind: "TColumn", table: table, column: column} as TColumn
                        }
                    }
                )


            }
        }
        return true;
    }
    let starsColumns: {table: string, index: number}[] = [];
    if (instanceOfTQuerySelect(select)) {
        for (let i = 0; i < select.columns.length; i++) {
            let col = select.columns[i];

            if (instanceOfTStar(col.expression)) {
                let star = col.expression as TStar;
                let table = "";
                if (instanceOfTTable(star.table) && star.table.table !== undefined && star.table.table !== "") {
                    table = star.table.table;
                } else {
                    table = getValueForAliasTableOrLiteral(select.tables[0].tableName).table;
                }

                starsColumns.push({table: table, index: i});
                continue;
            }

            let types = findExpressionType(col.expression, context.openTables, context.stack, recursion_callback);
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
            projections.push({
                columnName: name,
                output: col
            });
        }
    } else if (instanceOfTQueryUpdate(select)) {

    }
    for (let i = 0; i < starsColumns.length; i ++) {
        let tblWalk = context.openTables.find((t) => { return t.name.toUpperCase() === starsColumns[i].table.toUpperCase()});
        if (tblWalk) {
            let d = tblWalk.def;
            for (let x = 0; x < d.columns.length; x++) {
                let col = d.columns[x];

                let found = false;
                for (let j = 0; j < returnTableDefinition.columns.length; j++) {
                    let c = returnTableDefinition.columns[j];
                    if (c.name.toUpperCase() === col.name.toUpperCase()) {
                        if (c.invisible === true) {
                            c.invisible = false;
                        } else {
                            found = true;
                        }
                    }
                }
                if (!found) {
                    returnTableDefinition.columns.push({
                        name: col.name,
                        type: col.type,
                        length: col.length,
                        nullable: col.nullable,
                        defaultExpression: col.defaultExpression,
                        invisible: false,
                        decimal: col.decimal
                    });
                    projections.push(
                        {
                            columnName: col.name,
                            output: {
                                kind: "TQueryColumn",
                                expression: {
                                    kind: "TColumn",
                                    table: tblWalk.name,
                                    column: col.name
                                } as TColumn
                            } as TQueryColumn
                        }
                    )
                }

            }
        }
    }

    // add invisible columns for order by clauses
    if (instanceOfTQuerySelect(select)) {
        if (select.orderBy !== undefined && select.orderBy.length > 0) {
            for (let i = 0; i < select.orderBy.length; i++) {
                let temp = addInvisibleColumnsForSorting(context.openTables, select, select.orderBy[i], returnTableDefinition, projections, context.stack);
                if (temp !== undefined) {
                    returnTableDefinition = temp.def;
                    projections = temp.projections;
                }
            }
        }
        if (select.groupBy !== undefined && select.orderBy.length > 0) {
            for (let i = 0; i < select.groupBy.length; i++) {
                let temp = addInvisibleColumnsForSorting(context.openTables, select, select.groupBy[i], returnTableDefinition, projections, context.stack)
                if (temp !== undefined) {
                    returnTableDefinition = temp.def;
                    projections = temp.projections;
                }
            }
        }

        if (select.having !== undefined) {
            findExpressionType(select.having, context.openTables, context.stack, recursion_callback, {callbackOnTColumn: true});
        }
    }
    let returnTable: ITable;
    if (returnTableName !== "") {
        returnTable = newTable(returnTableDefinition);
        returnTableDefinition = readTableDefinition(returnTable.data, true);
        context.openedTempTables.push(returnTableName);
        context.openTables.push(
            {
                name: returnTableName,
                table: returnTable,
                def: returnTableDefinition,
                alias: returnTableName,
                rowLength: recordSize(returnTable.data),
                cursor: readFirst(returnTable, returnTableDefinition)
            }
        );
    }
    let currentDestName = returnTableName;
    let currentDestTable = returnTable;
    let currentDestTableDef = returnTableDefinition;

    if (instanceOfTQueryUpdate(select)) {
        let targetTable: TTableWalkInfo = undefined;
        if (select.table !== undefined) {
            targetTable = context.openTables.find((t) => { return t.name.toUpperCase() === select.table.table.toUpperCase();})
        } else {
            targetTable = context.openTables.find((t) => { return t.name.toUpperCase() === getValueForAliasTableOrLiteral(select.tables[0].tableName).table.toUpperCase();})
        }
        currentDestName = targetTable.name;
        currentDestTable = targetTable.table;
        currentDestTableDef = targetTable.def;
    }

    let current: TEPScan | TEPNestedLoop;
    let idx = select.tables.length -1;
    while (idx >= 0) {
        let scan: TEPScan = {
            kind: "TEPScan",
            table: select.tables[idx].tableName,
            range: undefined,
            projection: projections,
            predicate: (idx === 0) ? select.where : select.tables[idx].joinClauses,
            result: currentDestName
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
    if (current === undefined) {
        let scan: TEPScan = {
            kind: "TEPScan",
            table: (select as TQueryUpdate).table,
            range: undefined,
            projection: projections,
            predicate:  (select as TQueryUpdate).where,
            result: currentDestName
        }
        current = scan;

    }

    ret.push(current);
    if (instanceOfTQuerySelect(select)) {
        if (select.groupBy !== undefined && select.groupBy.length > 0) {

            let groupByResultTableName = currentDestName + "_Grouped";
            let groupByResultTableDef: ITableDefinition = JSON.parse(JSON.stringify(currentDestTableDef));
            for (let i = groupByResultTableDef.columns.length - 1; i > 0; i--) {
                if (groupByResultTableDef.columns[i].invisible === true) {
                    groupByResultTableDef.columns.splice(i, 1);
                }
            }
            groupByResultTableDef.name = groupByResultTableName;
            let groupByResultTable = newTable(groupByResultTableDef);
            groupByResultTableDef = readTableDefinition(groupByResultTable.data, true);

            context.openedTempTables.push(groupByResultTableName);
            context.openTables.push(
                {
                    name: groupByResultTableName,
                    table: groupByResultTable,
                    def: groupByResultTableDef,
                    alias: groupByResultTableName,
                    rowLength: recordSize(groupByResultTable.data),
                    cursor: readFirst(groupByResultTable, groupByResultTableDef)
                }
            );


            let stepGroupBy: TEPGroupBy = {
                kind: "TEPGroupBy",
                groupBy: select.groupBy,
                output: select.columns,
                having: select.having,
                projections: projections,
                source: {kind: "TTable", table: currentDestName, schema: "dbo"} as TTable,
                dest: {kind: "TTable", table: groupByResultTableName, schema: "dbo"} as TTable
            }
            ret.push(stepGroupBy);

            currentDestName = groupByResultTableName;


        }


        if (select.orderBy.length > 0) {
            if (!(instanceOfTLiteral(select.orderBy[0].column) && select.orderBy[0].column.value === "ROWID")) {
                let stepSort: TEPSortNTop = {
                    kind: "TEPSortNTop",
                    source: currentDestName,
                    orderBy: select.orderBy,
                    top: select.top,
                    dest: ""
                }
                ret.push(stepSort);

            }
        }
    }
    if (instanceOfTQuerySelect(select)) {
        let stepSelect: TEPSelect = {
            kind: "TEPSelect",
            dest: currentDestName,
        }
        ret.push(stepSelect);
    }
    if (instanceOfTQueryUpdate(select)) {
        let stepUpdate: TEPUpdate = {
            kind: "TEPUpdate",
            dest: currentDestName,
            sets: select.sets.map((t) => { return t.column;})
        }
        ret.push(stepUpdate);
    }

    return ret;
}