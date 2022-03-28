import {TQuerySelect} from "../Query/Types/TQuerySelect";
import {TEP} from "./TEP";
import {TEPScan} from "./TEPScan";
import {SKSQL} from "../API/SKSQL";
import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {openTable} from "../API/openTables";
import {ITableDefinition} from "../Table/ITableDefinition";
import {findExpressionType} from "../API/findExpressionType";
import {instanceOfTLiteral} from "../Query/Guards/instanceOfTLiteral";
import {TableColumnType} from "../Table/TableColumnType";
import {newTable} from "../Table/newTable";
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
import {getValueForAliasTableOrLiteral} from "../Query/getValueForAliasTableOrLiteral";
import {TExecutionContext} from "./TExecutionContext";
import {TQueryUpdate} from "../Query/Types/TQueryUpdate";
import {instanceOfTQuerySelect} from "../Query/Guards/instanceOfTQuerySelect";
import {instanceOfTQueryUpdate} from "../Query/Guards/instanceOfTQueryUpdate";
import {ITable} from "../Table/ITable";
import {TEPUpdate} from "./TEPUpdate";
import {instanceOfTVariable} from "../Query/Guards/instanceOfTVariable";
import {instanceOfTString} from "../Query/Guards/instanceOfTString";
import {kQueryComparison} from "../Query/Enums/kQueryComparison";
import {TQueryComparisonColumnEqualsString} from "../Query/Types/TQueryComparisonColumnEqualsString";
import {findTableNameForColumn} from "../API/findTableNameForColumn";
import {TParserError} from "../API/TParserError";
import {processSelectStatement} from "./processSelectStatement";
import {instanceOfTAlias} from "../Query/Guards/instanceOfTAlias";
import {TAlias} from "../Query/Types/TAlias";
import {TLiteral} from "../Query/Types/TLiteral";
import {createNewContext} from "./newContext";
import {TQueryExpression} from "../Query/Types/TQueryExpression";
import {TNumber} from "../Query/Types/TNumber";
import {kOrder} from "../Query/Enums/kOrder";
import {generateV4UUID} from "../API/generateV4UUID";
import {instanceOfTQueryColumn} from "../Query/Guards/instanceOfTQueryColumn";
import {contextTables} from "./contextTables";
import {findWalkTable} from "./findWalkTable";
import {instanceOfTQueryFunctionCall} from "../Query/Guards/instanceOfTQueryFunctionCall";
import {TQueryFunctionCall} from "../Query/Types/TQueryFunctionCall";
import {kSysColumns} from "../Table/kSysColumns";
import {expressionContainsAggregateFunction} from "./expressionContainsAggregateFunction";
import {walkTree} from "./walkTree";


function addInvisibleColumnsForSorting(db: SKSQL,
                                       tables: TTableWalkInfo[],
                                       select: TQuerySelect,
                                       clause: TQueryOrderBy,
                                       def: ITableDefinition,
                                       projections: TEPProjection[],
                                       parameters: {name: string, type: TableColumnType, value: any}[]
                                       ): {projections: TEPProjection[], def: ITableDefinition} {
    let o: TQueryColumn = clause.column;
    let colname: string = generateV4UUID();
    if (instanceOfTAlias(o.alias) && typeof o.alias.alias === "string") {
        colname = o.alias.alias;
    }

    let found = false;
    for (let x = 0; x < def.columns.length; x++) {
        let c = def.columns[x];
        if (c.name.toUpperCase() === colname.toUpperCase()) {
            found = true;
        }
    }
    if (found === false) {
        let type = findExpressionType(db, o.expression, select, tables, parameters);
        // add the column to the select columns so they are written automatically
        let tcol: TQueryColumn = {
            kind: "TQueryColumn",
            alias: {kind: "TAlias", alias: colname, name: colname},
            expression: o.expression
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

/*
export function generateExecutionPlanFromStatementDEPREC(db: SKSQL, context: TExecutionContext, select: TQuerySelect | TQueryUpdate): TEP[] {
    let ret: TEP[] = [];

    // process sub-queries
    if (instanceOfTQuerySelect(select)) {
        for (let i = 0; i < select.tables.length; i++) {
            let newC = createNewContext("subQuery " + i, "", undefined );
            if (instanceOfTQuerySelect(select.tables[i].tableName)) {
                let subQuery = select.tables[i].tableName as TQuerySelect;
                let rt = processSelectStatement(db, newC, subQuery, true);
                select.tables[i].tableName = rt;
                context.openedTempTables.push(rt.table);
            } else if (instanceOfTAlias(select.tables[i].tableName) && instanceOfTQuerySelect((select.tables[i].tableName as TAlias).name)) {
                let subQuery = (select.tables[i].tableName as TAlias).name as TQuerySelect;
                let rt = processSelectStatement(db, newC, subQuery, true);
                (select.tables[i].tableName as TAlias).name = rt;
                context.openedTempTables.push(rt.table);
            }
        }
    }

    contextTables(db, context, select, undefined, select);
    let columnsNeeded: {tableName: string, columnName: string}[] = [];
    let returnTableName = "";
    let projections: TEPProjection[] = [];
    let hasAggregation = false;
    let starsColumns: {table: string, index: number}[] = [];

    if (instanceOfTQuerySelect(select)) {
        let i = 1;
        returnTableName = "#query" + i;
        while (db.tableInfo.get(returnTableName) !== undefined) {
            returnTableName = "#query" + (++i);
        }
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

    let groupByResultTableDef: ITableDefinition = {
        name: "",
        columns: [],
        hasIdentity: false,
        identityColumnName: '',
        identitySeed: 1,
        identityIncrement: 1,
        constraints: []
    } as ITableDefinition;
    let projectionsGroupBy: TEPProjection[] = [];

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
                if (column === "") {
                    column = "column";
                }
                let baseIdx = 0;
                let baseName = column;
                let name = baseName;
                let alreadyExists = returnTableDefinition.columns.find((c) => { return c.name.toUpperCase() === name.toUpperCase();});
                while (alreadyExists !== undefined) {
                    baseIdx++;
                    name = baseName + baseIdx;
                    alreadyExists = returnTableDefinition.columns.find((c) => { return c.name.toUpperCase() === name.toUpperCase();});
                }
                returnTableDefinition.columns.push(
                    {
                        name: name,
                        type: coldef.type,
                        length: (coldef.type === TableColumnType.varchar) ? 4096 : 1,
                        nullable: true,
                        defaultExpression: "",
                        invisible: true
                    }
                );

                projections.push(
                    {
                        columnName: name,
                        output: {
                            kind: "TQueryColumn",
                            alias: undefined,
                            expression: {kind: "TColumn", table: "", column: column} as TColumn
                        }
                    }
                )


            }
        }
        return true;
    }

    if (instanceOfTQuerySelect(select)) {
        for (let i = 0; i < select.columns.length; i++) {
            let col = select.columns[i];
            let hasAggregateInExpression = false;
            if (instanceOfTStar(col.expression)) {
                let star = col.expression as TStar;
                let table = "";

                let addAllColumnsForTable = (tblWalk: TTableWalkInfo) => {
                    if (tblWalk) {
                        let d = tblWalk.def;
                        let newColIdx = 0;
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
                            found = false;
                            if (!found && col.name.toUpperCase() !== kSysColumns.change_xdes_id.toUpperCase()) {

                                let colIndex = 0;
                                let baseName = col.name;
                                if (baseName === "") {
                                    baseName = "column"
                                }
                                let name = col.name;
                                let columnNameExists = returnTableDefinition.columns.find((c) => { return c.name.toUpperCase() === name.toUpperCase();});
                                while (columnNameExists !== undefined) {
                                    colIndex++;
                                    name = baseName + colIndex;
                                    columnNameExists = returnTableDefinition.columns.find((c) => { return c.name.toUpperCase() === name.toUpperCase();});
                                }

                                returnTableDefinition.columns.push({
                                    name: name,
                                    type: col.type,
                                    length: col.length,
                                    nullable: col.nullable,
                                    defaultExpression: col.defaultExpression,
                                    invisible: false,
                                    decimal: col.decimal
                                });

                                groupByResultTableDef.columns.push({
                                    name: name,
                                    type: col.type,
                                    length: col.length,
                                    nullable: col.nullable,
                                    defaultExpression: col.defaultExpression,
                                    invisible: false,
                                    decimal: col.decimal
                                });

                                projections.push(
                                    {
                                        columnName: name,
                                        output: {
                                            kind: "TQueryColumn",
                                            expression: {
                                                kind: "TColumn",
                                                table: tblWalk.name.toUpperCase(),
                                                column: col.name
                                            } as TColumn
                                        } as TQueryColumn
                                    }
                                );
                                projectionsGroupBy.push({
                                    columnName: name,
                                    output: {
                                        kind: "TQueryColumn",
                                        expression: {
                                            kind: "TColumn",
                                            table: "",
                                            column: col.name
                                        } as TColumn
                                    } as TQueryColumn
                                })

                            }

                        }
                    }
                }



                if (instanceOfTTable(star.table) && star.table.table !== undefined && star.table.table !== "") {
                    table = star.table.table;
                    let tblWalk: TTableWalkInfo;
                    tblWalk = context.tables.find((t) => { return t.name.toUpperCase() === table.toUpperCase()});
                    addAllColumnsForTable(tblWalk);
                } else {
                    for (let x = 0; x < select.tables.length; x++) {
                        table = getValueForAliasTableOrLiteral(select.tables[x].tableName as (string | TAlias | TLiteral | TTable)).table;
                        let tblWalk: TTableWalkInfo;
                        tblWalk = context.tables.find((t) => { return t.name.toUpperCase() === table.toUpperCase()});
                        addAllColumnsForTable(tblWalk);
                    }
                }
                starsColumns.push({table: table, index: i});

                continue;
            }
            if (expressionContainsAggregateFunction(db, context, select, context.tables, context.stack, col.expression)) {
                hasAggregateInExpression = true;
                hasAggregation = true;
            }

            let types = findExpressionType(db, col.expression, select, context.tables, context.stack, recursion_callback);
            let length = 4096;
            if (instanceOfTColumn(col.expression)) {
                let name = col.expression.column;
                let table = col.expression.table;
                // fix no table
                if (table === undefined || table === "") {
                    let tableNames = findTableNameForColumn(name, context.tables, select);
                    if (tableNames.length > 1) {
                        throw new TParserError("Ambiguous column name " + name);
                    }
                    if (tableNames.length === 0) {
                        throw new TParserError("Unknown column name " + name);
                    }
                    table = tableNames[0];
                }
                let t: TTableWalkInfo;

                t = context.tables.find((t) => {
                    if (t.name === table) {
                        return true;
                    }
                    if (typeof t.alias === "string") {
                        if (t.alias === table) {
                            return true;
                        }
                    } else if (instanceOfTAlias(t.alias)) {
                        let val = getValueForAliasTableOrLiteral(t.alias);
                        if (val.table === table || val.alias === table) {
                            return true;
                        }
                    }
                    return false;
                });


                if (t === undefined) {
                    throw new TParserError("Could not find table for column " + name + " from TColumn " + JSON.stringify(col.expression));
                }
                let colDef = t.def.columns.find( (col) => { return col.name.toUpperCase() === name.toUpperCase();});
                if (colDef !== undefined) {
                    length = colDef.length;
                }
            }
            let name = "";
            if (instanceOfTLiteral(col.alias.alias)) {
                name = col.alias.alias.value;
            } else if (typeof col.alias.alias === "string") {
                name = col.alias.alias as string;
            }

            let colIndex = 0;
            let baseName = name;
            if (baseName === "") {
                baseName = "column"
            }
            name = baseName;
            if (hasAggregateInExpression === false) {
                let columnNameExists = returnTableDefinition.columns.find((c) => {
                    return c.name.toUpperCase() === name.toUpperCase();
                });
                while (columnNameExists !== undefined) {
                    colIndex++;
                    name = baseName + colIndex;
                    columnNameExists = returnTableDefinition.columns.find((c) => {
                        return c.name.toUpperCase() === name.toUpperCase();
                    });
                }

                returnTableDefinition.columns.push(
                    {
                        name: name,
                        type: types,
                        length: (types === TableColumnType.varchar) ? length : 1,
                        nullable: true,
                        defaultExpression: ""
                    }
                );
                projections.push({
                    columnName: name,
                    output: col
                });
            }
            groupByResultTableDef.columns.push({
                name: name,
                    type: types,
                length: (types === TableColumnType.varchar) ? length : 1,
                nullable: true,
                defaultExpression: ""
            });
            projectionsGroupBy.push({
                columnName: name,
                output: col
            })
        }
    } else if (instanceOfTQueryUpdate(select)) {

    }


    // add invisible columns for order by clauses
    if (instanceOfTQuerySelect(select)) {
        if (select.orderBy !== undefined && select.orderBy.length > 0) {
            for (let i = 0; i < select.orderBy.length; i++) {
                let temp = addInvisibleColumnsForSorting(db, context.tables, select, select.orderBy[i], returnTableDefinition, projections, context.stack);
                if (temp !== undefined) {
                    returnTableDefinition = temp.def;
                    projections = temp.projections;
                }
            }
        }

        if (hasAggregation && (select.groupBy === undefined || select.groupBy.length === 0)) {
            let groupByColumnName = generateV4UUID();
            select.groupBy.push({
                column: { kind: "TQueryColumn", expression: {kind: "TNumber", value: "1"} as TNumber, alias: {kind: "TAlias", alias:groupByColumnName } as TAlias } as TQueryColumn,
                order: kOrder.asc
            });
        }

        if (select.groupBy !== undefined && select.groupBy.length > 0) { // && select.orderBy.length > 0) {
            for (let i = 0; i < select.groupBy.length; i++) {
                let temp = addInvisibleColumnsForSorting(db, context.tables, select, select.groupBy[i], returnTableDefinition, projections, context.stack)
                if (temp !== undefined) {
                    returnTableDefinition = temp.def;
                    projections = temp.projections;
                }
            }
        }

        if (select.having !== undefined) {
            findExpressionType(db, select.having, select,  context.tables, context.stack, recursion_callback, {callbackOnTColumn: true});
        }


        if (select.where !== undefined) {

            let recur = function (st: TQueryComparison | TQueryComparisonExpression | TQueryComparisonColumnEqualsString)
            {
                if (instanceOfTQueryComparison(st)) {
                    if (st.comp.value === kQueryComparison.equal && instanceOfTColumn(st.left) &&
                        (instanceOfTString(st.right) || instanceOfTVariable(st.right))) {
                        // possible optimisation
                        // if we need to test column = stringValue
                        // instead of reading the full column and then comparing it with the other value
                        // we can read the column and compare it byte by byte with the other value and abort as soon as possible.
                        let name = "";
                        let table = "";
                        name = (st.left as TColumn).column;
                        table = st.left.table;
                        if (table === "") {

                            let tablesMatch = findTableNameForColumn(name, context.tables, context.currentStatement, undefined);
                            if (tablesMatch.length !== 1) {
                                if (tablesMatch.length === 0) {
                                    throw new TParserError("Unknown column name " + name);
                                }
                                if (tablesMatch.length > 1) {
                                    throw new TParserError("Ambiguous column name " + name);
                                }
                            }
                            table = tablesMatch[0];
                        }
                        let tableInfo: TTableWalkInfo;
                        tableInfo = context.tables.find((t) => {
                                return t.name.toUpperCase() === table.toUpperCase()
                        });

                        if (tableInfo === undefined) {
                            throw new TParserError("Unknown column " + name);
                        }
                        let columnDef = tableInfo.def.columns.find((c) => {
                            return c.name.toUpperCase() === name.toUpperCase();
                        });
                        if (columnDef === undefined) {
                            throw new TParserError("Unknown column " + name + ". Could not find column definition in table " + table);
                        }
                        if (columnDef.type === TableColumnType.varchar) {

                            let newValue: TQueryComparisonColumnEqualsString = {
                                kind: "TQueryComparisonColumnEqualsString",
                                column: st.left,
                                value: st.right
                            };
                            return newValue;
                        }
                    }
                    return st;
                } else if (instanceOfTQueryComparisonExpression(st)) {
                    let newA = recur(st.a);
                    st.a = newA;
                    let newB = recur(st.b);
                    st.b = newB;
                    return st;
                } else {
                    return st;
                }

            }
            select.where = recur(select.where);


        }


    }
    let returnTable: ITable;
    if (returnTableName !== "") {
        returnTable = newTable(db, returnTableDefinition);
        returnTableDefinition = db.tableInfo.get(returnTableDefinition.name).def;
        context.openedTempTables.push(returnTableName);
        context.tables.push(
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
        let targetTable: TTableWalkInfo;
        if (select.table !== undefined) {
            targetTable = findWalkTable(context.tables, select.table);
        } else {
            if (instanceOfTQuerySelect(select.tables[0].tableName)) {
                throw new TParserError("UPDATE TABLE FROM SUBQUERY NOT SUPPORTED.");
            } else {
                targetTable = findWalkTable(context.tables, select.tables[0].tableName);
            }
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
            table: select.tables[idx].tableName as (TTable | TAlias),
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
            //let groupByResultTableDef: ITableDefinition = JSON.parse(JSON.stringify(currentDestTableDef));
            for (let i = groupByResultTableDef.columns.length - 1; i > 0; i--) {
                if (groupByResultTableDef.columns[i].invisible === true) {
                    groupByResultTableDef.columns.splice(i, 1);
                }
            }
            groupByResultTableDef.name = groupByResultTableName;
            let groupByResultTable = newTable(db, groupByResultTableDef);
            groupByResultTableDef = db.tableInfo.get(groupByResultTableName).def;

            context.openedTempTables.push(groupByResultTableName);

            context.tables.push(
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
                projections: projectionsGroupBy,
                source: {kind: "TTable", table: currentDestName, schema: "dbo"} as TTable,
                dest: {kind: "TTable", table: groupByResultTableName, schema: "dbo"} as TTable,
                aggregateFunctions: []
            }
            ret.push(stepGroupBy);

            currentDestName = groupByResultTableName;


        }


        if (select.orderBy.length > 0) {

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

 */