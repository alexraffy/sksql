import {TExecutionContext} from "./TExecutionContext";
import {TQuerySelect} from "../Query/Types/TQuerySelect";
import {instanceOfTQuerySelect} from "../Query/Guards/instanceOfTQuerySelect";
import {TTable} from "../Query/Types/TTable";
import {TAlias} from "../Query/Types/TAlias";
import {SKSQL} from "../API/SKSQL";
import {instanceOfTTable} from "../Query/Guards/instanceOfTTable";
import {instanceOfTAlias} from "../Query/Guards/instanceOfTAlias";
import {instanceOfTLiteral} from "../Query/Guards/instanceOfTLiteral";
import {TLiteral} from "../Query/Types/TLiteral";
import {recordSize} from "../Table/recordSize";
import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {readFirst} from "../Cursor/readFirst";
import {instanceOfTQueryColumn} from "../Query/Guards/instanceOfTQueryColumn";
import {TQueryColumn} from "../Query/Types/TQueryColumn";
import {instanceOfTQueryExpression} from "../Query/Guards/instanceOfTQueryExpression";
import {TQueryExpression} from "../Query/Types/TQueryExpression";
import {instanceOfTCast} from "../Query/Guards/instanceOfTCast";
import {TCast} from "../Query/Types/TCast";
import {instanceOfTQueryFunctionCall} from "../Query/Guards/instanceOfTQueryFunctionCall";
import {TQueryFunctionCall} from "../Query/Types/TQueryFunctionCall";
import {instanceOfTArray} from "../Query/Guards/instanceOfTArray";
import {TArray} from "../Query/Types/TArray";
import {instanceOfTBetween} from "../Query/Guards/instanceOfTBetween";
import {TBetween} from "../Query/Types/TBetween";
import {instanceOfTColumn} from "../Query/Guards/instanceOfTColumn";
import {TColumn} from "../Query/Types/TColumn";
import {findTableNameForColumn} from "../API/findTableNameForColumn";
import {TQueryDelete} from "../Query/Types/TQueryDelete";
import {TQueryUpdate} from "../Query/Types/TQueryUpdate";
import {TParserError} from "../API/TParserError";
import {TValidExpressions} from "../Query/Types/TValidExpressions";
import {TQueryAnyType} from "../Query/Types/TQueryAnyType";
import {instanceOfTStar} from "../Query/Guards/instanceOfTStar";
import {instanceOfTQueryUpdate} from "../Query/Guards/instanceOfTQueryUpdate";
import {instanceOfTQueryDelete} from "../Query/Guards/instanceOfTQueryDelete";
import {rowHeaderSize} from "../Table/addRow";


// Walk an SQL statement AST tree for Tables and add them to a list.


export function addTable2Context(db, context, tableName: string, alias: TAlias) {
    let a = "";
    if (alias === undefined || (typeof alias !== "string" && !instanceOfTAlias(alias))) {
        a = tableName;
    } else {
        if (typeof alias === "string") {
            a = alias;
        } else if (instanceOfTAlias(alias)) {
            if (typeof (alias as TAlias).alias === "string") {
                a = (alias as TAlias).alias as string;
            } else if (instanceOfTLiteral((alias as TAlias).alias)) {
                a = ((alias as TAlias).alias as TLiteral).value;
            }
        }
    }
    if (a === "") {
        a = tableName.toUpperCase();
    }
    let tableInfo = db.tableInfo.get(tableName);
    let table = tableInfo.pointer;
    let def = tableInfo.def;
    let len = recordSize(table.data);
    let exists = context.tables.find((t) => {
        if (t.name == tableName && (t.alias !== "" && a!== "" && t.alias === a) || (t.alias === "" && a === "")) {
            return true;
        }
        return false;
    });
    //if (!exists) {
        context.tables.push({
            table: table,
            def: def,
            cursor: readFirst(table, def),
            alias: a.toUpperCase(),
            name: tableName.toUpperCase(),
            rowLength: len + rowHeaderSize
        } as TTableWalkInfo);
    //}
}


export function contextTables(db: SKSQL,
                              context: TExecutionContext,
                              st: TQuerySelect | TQueryUpdate | TQueryExpression| TTable | TQueryAnyType | TAlias | TValidExpressions,
                              alias: TAlias,
                              initialStatement: TQuerySelect | TQueryUpdate | TQueryDelete) {

    if (instanceOfTColumn(st)) {
        let stt = st as TColumn;
        if (stt.table === "") {
            let tablesAvailable = findTableNameForColumn(stt.column, context.tables, initialStatement);
            if (tablesAvailable.length > 1) {
                throw new TParserError("Ambiguous column name " + stt.column);
            } else if (tablesAvailable.length === 0) {
                throw new TParserError("Unknown column name " + stt.column);
            }
            stt.table = tablesAvailable[0];
        } else {
            stt.table = stt.table.toUpperCase();
        }
        return;
    } else if (instanceOfTQuerySelect(st)) {
        for (let i = 0; i < st.tables.length; i++) {
            contextTables(db, context, st.tables[i].tableName, undefined, initialStatement);
        }
        for (let i = 0; i < st.columns.length; i++) {
            contextTables(db, context, st.columns[i], undefined, initialStatement);
        }
        if (st.where !== undefined) {
            contextTables(db, context, st.where, undefined, initialStatement);
        }
        if (st.orderBy !== undefined && st.orderBy.length > 0) {
            for (let i = 0; i < st.orderBy.length; i++) {
                contextTables(db, context, st.orderBy[i].column, undefined, initialStatement);
            }
        }
    } else if (instanceOfTQueryUpdate(st)) {
        if (st.table !== undefined) {
            contextTables(db, context, st.table, undefined, st);
        }
        for (let i = 0; i < st.tables.length; i++) {
            contextTables(db, context, st.tables[i].tableName, undefined, st);
        }
        for (let i = 0; i < st.sets.length; i++) {
            contextTables(db, context, st.sets[i].column, undefined, st);
            contextTables(db, context, st.sets[i].value, undefined, st);
        }
        if (st.where !== undefined) {
            contextTables(db, context, st.where, undefined, st);
        }
        return;
    } else if (instanceOfTQueryDelete(st)) {
        for (let i = 0; i < st.tables.length; i++) {
            contextTables(db, context, st.tables[i].tableName, undefined, st);
        }
        if (st.where !== undefined) {
            contextTables(db, context, st.where, undefined, st);
        }
    } else if (instanceOfTTable(st)) {
        return addTable2Context(db, context, st.table.toUpperCase(), alias);
    } else if (instanceOfTAlias(st)) {
        let stt = st as TAlias;
        if (instanceOfTTable(stt.name)) {
            return contextTables(db, context, stt.name, stt, initialStatement);
        }

    } else if (instanceOfTQueryColumn(st)) {
        let stt = st as TQueryColumn;
        return contextTables(db, context, stt.expression, alias, initialStatement);
    } else if (instanceOfTQueryExpression(st)) {
        let stt = st as TQueryExpression;
        contextTables(db, context, stt.value.left, alias, initialStatement);
        return contextTables(db, context, stt.value.right, alias, initialStatement);
    } else if (instanceOfTCast(st)) {
        let stt = st as TCast;
        return contextTables(db, context, stt.exp, alias, initialStatement);
    } else if (instanceOfTQueryFunctionCall(st)) {
        let stt = st as TQueryFunctionCall;
        if (db.getFunctionNamed(stt.value.name) === undefined) {
            throw new TParserError("Unknown function named " + stt.value.name);
        }
        for (let i = 0; i < stt.value.parameters.length; i++) {
            contextTables(db, context, stt.value.parameters[i], alias, initialStatement);
        }
        return;
    } else if (instanceOfTArray(st)) {
        let stt = st as TArray;
        for (let i = 0; i < stt.array.length; i++) {
            contextTables(db, context, stt.array[i], alias, initialStatement);
        }
        return;
    } else if (instanceOfTBetween(st)) {
        let stt = st as TBetween;
        contextTables(db, context, stt.a, alias, initialStatement);
        contextTables(db, context, stt.b, alias, initialStatement);
        return;
    } else if (instanceOfTStar(st)) {

    }


}