import {test_numeric} from "./numeric";
import {test_parser} from "./parser";
import {test_db_university} from "./db_university";
import {test_worker} from "./worker";
import {SKSQL} from "sksql";
import * as fs from "fs";
import {test_date} from "./test_date";
import {test_insert} from "./test_insert";
import {test_groupby} from "./test_groupby";
import {test_functions} from "./test_functions";
import {update1} from "./update1";
import {test_compress} from "./test_compress";
let sksqlData = fs.readFileSync("../dist/sksql.min.js").toString();

test_parser();
let db = new SKSQL();
db.initWorkerPool(4, sksqlData);

test_compress(db);
update1(db);
test_functions(db);
test_groupby(db);
test_db_university(db);
test_insert(db);
test_date(db);
test_numeric(db);


db.updateWorkerDB(0);
test_worker(db);


