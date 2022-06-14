import {SKSQL, compressAB, decompress} from "sksql";
import assert = require("assert");
import {checkNoTempTables} from "./runTest";



export function test_compress(db: SKSQL, next: ()=>void) {
    console.log("TESTING 0 COMPRESSION...")
    let tb = db.getTable("dual");
    console.log("Test compression");
    console.log("dual header is " + tb.data.tableDef.byteLength );
    let compressed = compressAB(tb.data.tableDef);
    console.log("compressed header is " + compressed.byteLength);
    let decompressed = decompress(compressed, false);
    console.log("decompressed header is " + decompressed.byteLength);

    let dv = new DataView(tb.data.tableDef);
    let dvd = new DataView(decompressed);
    assert(dv.byteLength === dvd.byteLength, "compress/decompress size mismatch.")
    for (let i = 0; i < dv.byteLength; i++) {
        let a = dv.getUint8(i);
        let b = dvd.getUint8(i);
        assert(a === b, "compress/decompress does not return the same data! " + i);
    }
    checkNoTempTables(db);
    next();
}