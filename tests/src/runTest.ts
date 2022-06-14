import {
    SKSQL,
    cursorEOF,
    dumpTable,
    isNumeric,
    numericCmp,
    readFirst,
    readNext,
    readValue,
    recordSize,
    rowHeaderSize,
    SQLResult,
    SQLStatement,
    TableColumnType,
    kResultType,
    numericDisplay,
    kBlockHeaderField,
    readTableDefinition
} from "sksql";



export function checkNoTempTables(db: SKSQL) {
    for (let i = 0; i < db.allTables.length; i++) {
        let def = readTableDefinition(db.allTables[i].data);
        if (def.name.startsWith("#")) {
            throw new Error("Last SQLStatement did not remove " + def.name.toUpperCase());
        }
    }
}


export function runTest(db, sql, excep: boolean, error: boolean, rowsRet: any[], colValues: { [key:string]:any } = undefined, options: {printDebug: boolean} = {printDebug: false}) {
    let throwError = "";
    let st: SQLStatement = undefined;
    try {
        st = new SQLStatement(db, sql);
        let ret: SQLResult = st.run(kResultType.SQLResult, options) as SQLResult;
        if (error === true && ret.error === undefined) {
            throwError =  sql + " should have triggered an error.";
            console.log(dumpTable(db.getTable(ret.resultTableName)));
        } else if (error === false && ret.error !== undefined) {
            throwError =  sql + " has triggered an error: " + ret.error;
        }
        if (throwError === "" && rowsRet !== undefined) {
            if (ret.resultTableName === undefined || ret.resultTableName === "") {
                throwError = sql + " did not return any data.";
                console.log(dumpTable(db.getTable(ret.resultTableName)));
            } else {
                let tblInfo = db.tableInfo.get(ret.resultTableName);
                let tbl = tblInfo.pointer;
                let def = tblInfo.def;
                let cursor = readFirst(tbl, def);
                let data = [];
                let len = recordSize(tbl.data) + rowHeaderSize;
                if (options !== undefined && options.printDebug === true) {
                    console.log("--------------------------");
                    console.log("TABLE DUMP: " + ret.resultTableName);
                    console.log(dumpTable(tbl));
                }
                let line = -1;
                let check = true;
                let totalChecked = 0;
                while (!cursorEOF(cursor)) {
                    let dv = new DataView(tbl.data.blocks[cursor.blockIndex], cursor.offset, len);
                    let flag = dv.getUint8(kBlockHeaderField.DataRowFlag);
                    const isDeleted = ((flag & kBlockHeaderField.DataRowFlag_BitDeleted) === kBlockHeaderField.DataRowFlag_BitDeleted) ? 1 : 0;
                    if (isDeleted) {
                        cursor = readNext(tbl, def, cursor);
                        continue;
                    }

                    line++;
                    let x = -1;
                    let ta: TableColumnType;
                    let tb: TableColumnType;
                    for (let i = 0; i < def.columns.length; i++) {
                        let c = def.columns[i];
                        if (c.invisible === undefined || c.invisible === false) {
                            let val = readValue(tbl, def, c, dv, 5);
                            x++;
                            totalChecked++;
                            if (typeof rowsRet[line][x] === "function") {
                                if (rowsRet[line][x](val) === false) {
                                    check = false;
                                }
                            } else {
                                if (isNumeric(val)) {
                                    ta = TableColumnType.numeric;
                                    check = check && (numericCmp(val, rowsRet[line][x]) === 0);
                                    if (options !== undefined && options.printDebug === true) {
                                        console.log("[" + numericDisplay(val) + "] = [" + numericDisplay(rowsRet[line][x]) + "]");
                                    }
                                } else if (typeof val === "string") {
                                    ta = TableColumnType.varchar;
                                    check = check && (val.localeCompare(rowsRet[line][x]) === 0);
                                    if (options !== undefined && options.printDebug === true) {
                                        console.log("[" + val + "] = [" + rowsRet[line][x] + "]");
                                    }
                                } else if (typeof val === "number") {
                                    ta = TableColumnType.int32;
                                    check = check && (val === rowsRet[line][x]);
                                    if (options !== undefined && options.printDebug === true) {
                                        console.log("[" + val + "] = [" + rowsRet[line][x] + "]");
                                    }
                                } else if (typeof val === "boolean") {
                                    ta = TableColumnType.boolean;
                                    if (options !== undefined && options.printDebug === true) {
                                        console.log("[" + val + "] = [" + rowsRet[line][x] + "]");
                                    }
                                }
                                if (isNumeric(rowsRet[line][x])) {
                                    tb = TableColumnType.numeric;
                                } else if (typeof rowsRet[line][x] === "string") {
                                    tb = TableColumnType.varchar;
                                } else if (typeof rowsRet[line][x] === "number") {
                                    tb = TableColumnType.int32;
                                } else if (typeof rowsRet[line][x] === "boolean") {
                                    tb = TableColumnType.boolean;
                                }
                                if (ta !== tb) {
                                    throwError = sql + " did not return the expected type.";
                                    break;
                                }
                            }

                        }
                    }

                    if (check === false) {
                        throwError = sql + " did not return the expected data.";
                        break;
                    }
                    cursor = readNext(tbl, def, cursor);
                }
                let totalToCheck = 0;
                for (let i = 0; i < rowsRet.length; i++) {
                    for (let j = 0; j < rowsRet[i].length; j++) {
                        totalToCheck++;
                    }
                }
                if (totalToCheck !== totalChecked) {

                    throwError = throwError + sql + " did not return the expected columns.";
                }
            }
        }


    } catch (e) {
        if (excep === false) {
            throwError = sql + " triggered an unexpected exception.";
            throwError += e.message;
            throwError += "\r\n";
            throwError += "Stack : " + e.stack;
        }
    }
    if (st !== undefined) {
        st.close();
    }
    // check for temp tables
    for (let i = 0; i < db.allTables.length; i++) {
        let def = readTableDefinition(db.allTables[i].data);
        if (def.name.startsWith("#")) {
            throwError = "Last SQLStatement did not remove " + def.name.toUpperCase();
        }
    }

    if (throwError !== "") {
        throw new Error(throwError);
    }
}