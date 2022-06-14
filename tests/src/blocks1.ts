


import {SQLStatement, dumpTable, SQLResult, SKSQL, numericLoad, writeStringToUtf8ByteArray, readStringFromUtf8Array} from "sksql";
import {checkNoTempTables, runTest} from "./runTest";
import * as assert from "assert";
import {test_parser} from "./parser";

export function blocks1(db: SKSQL, next:()=>void) {
    console.log("TESTING BLOCKS...");

    let ab = new ArrayBuffer(50);
    let dv = new DataView(ab, 0, 50);
    for (let i = 0; i < 50; i++) {
        dv.setUint8(i, 255);
    }
    writeStringToUtf8ByteArray(dv, 0, "Hello", 50);
    let str = readStringFromUtf8Array(dv, 0, -1);
    assert((str.length === 5 && str === "Hello"), "Writing/Reading to AB failed.");
    checkNoTempTables(db);
    next();
}