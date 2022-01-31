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
let sksqlData = fs.readFileSync("../dist/sksql.min.js").toString();

test_parser();

SKSQL.instance.initWorkerPool(4, sksqlData);

update1();
test_functions();
test_groupby();
test_db_university();
test_insert();
test_date();
test_numeric();


SKSQL.instance.updateWorkerDB(0);
test_worker();


