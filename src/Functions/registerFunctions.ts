import {kFunctionType} from "./kFunctionType";
import {TableColumnType} from "../Table/TableColumnType";
import {DBData} from "../API/DBInit";
import {date_datefromparts} from "./Date/date_datefromparts";
import {date_day} from "./Date/date_day";
import {date_getdate} from "./Date/date_getdate";
import {date_getutcdate} from "./Date/date_getutcdate";
import {date_isdate} from "./Date/date_isdate";
import {date_month} from "./Date/date_month";
import {date_year} from "./Date/date_year";
import {scalar_abs} from "./Scalar/scalar_abs";
import {scalar_power} from "./Scalar/scalar_power";
import {scalar_rand} from "./Scalar/scalar_rand";
import {scalar_round} from "./Scalar/scalar_round";
import {string_concat} from "./String/string_concat";
import {string_concat_ws} from "./String/string_concat_ws";
import {string_left} from "./String/string_left";
import {string_lower} from "./String/string_lower";
import {string_len} from "./String/string_len";
import {string_reverse} from "./String/string_reverse";
import {string_upper} from "./String/string_upper";
import {string_ltrim} from "./String/string_ltrim";
import {string_trim} from "./String/string_trim";
import {string_rtrim} from "./String/string_rtrim";
import {string_padLeft} from "./String/string_padLeft";
import {string_padRight} from "./String/string_padRight";
import {string_patindex} from "./String/string_patindex";
import {string_replace} from "./String/string_replace";
import {string_replicate} from "./String/string_replicate";
import {string_right} from "./String/string_right";
import {string_space} from "./String/string_space";
import {string_str} from "./String/string_str";
import {string_substring} from "./String/string_substring";
import {aggregate_sum} from "./Aggregate/aggregate_sum";


export function registerFunctions() {
    let db = DBData.instance;

    // AGGREGATE
    db.declareFunction(kFunctionType.aggregate, "SUM", [
        {name: "EXPRESSION", type: TableColumnType.numeric}
    ], TableColumnType.numeric, aggregate_sum);

    // DATE
    db.declareFunction(kFunctionType.scalar, "DATEFROMPARTS", [
        {name: "YEAR", type: TableColumnType.int32},
        {name: "MONTH", type: TableColumnType.uint8},
        {name: "DAY", type: TableColumnType.uint8}
    ], TableColumnType.date, date_datefromparts);
    db.declareFunction(kFunctionType.scalar, "DAY", [{name: "DATE", type: TableColumnType.date}], TableColumnType.uint8, date_day);
    db.declareFunction(kFunctionType.scalar, "GETDATE", [], TableColumnType.date, date_getdate);
    db.declareFunction(kFunctionType.scalar, "GETUTCDATE", [], TableColumnType.date, date_getutcdate);
    db.declareFunction(kFunctionType.scalar, "ISDATE", [{name: "DATE", type: TableColumnType.varchar}], TableColumnType.boolean, date_isdate);
    db.declareFunction(kFunctionType.scalar, "MONTH", [{name: "DATE", type: TableColumnType.date}], TableColumnType.uint8, date_month);
    db.declareFunction(kFunctionType.scalar, "YEAR", [{name: "DATE", type: TableColumnType.date}], TableColumnType.int32, date_year);

    // NUMERIC
    db.declareFunction(kFunctionType.scalar, "ABS", [{name: "NUMERIC", type: TableColumnType.numeric}], TableColumnType.numeric, scalar_abs);
    db.declareFunction(kFunctionType.scalar, "POWER", [{name: "BASE", type: TableColumnType.numeric}, {name: "EXP", type: TableColumnType.numeric}], TableColumnType.numeric, scalar_power );
    db.declareFunction(kFunctionType.scalar, "RAND", [], TableColumnType.numeric, scalar_rand);
    db.declareFunction(kFunctionType.scalar, "ROUND", [{name: "NUMERIC", type: TableColumnType.numeric}, {name: "DECIMALS", type: TableColumnType.uint8}], TableColumnType.numeric, scalar_round);

    // STRING
    db.declareFunction(kFunctionType.scalar, "CONCAT", [{name: "STR_A", type: TableColumnType.varchar}, {name: "STR_B", type: TableColumnType.varchar}],
        TableColumnType.varchar, string_concat);
    db.declareFunction(kFunctionType.scalar, "CONCAT_WS", [{name: "SEP", type: TableColumnType.varchar}, {name: "STR_A", type: TableColumnType.varchar}, {name: "STR_B", type: TableColumnType.varchar}],
        TableColumnType.varchar, string_concat_ws);
    db.declareFunction(kFunctionType.scalar, "LEFT", [{name: "STRING", type: TableColumnType.varchar}, {name: "LENGTH", type: TableColumnType.uint8}],
        TableColumnType.varchar, string_left);
    db.declareFunction(kFunctionType.scalar, "LEN", [{name: "STRING", type: TableColumnType.varchar}], TableColumnType.uint8, string_len);
    db.declareFunction(kFunctionType.scalar, "LOWER", [{name: "STRING", type: TableColumnType.varchar}],
        TableColumnType.varchar, string_lower);
    db.declareFunction(kFunctionType.scalar, "LTRIM", [{name: "STRING", type: TableColumnType.varchar}],
        TableColumnType.varchar, string_ltrim);
    db.declareFunction(kFunctionType.scalar, "PADLEFT", [
            {name: "INPUT", type: TableColumnType.varchar},
            {name: "PADWITH", type: TableColumnType.varchar},
            {name: "NUM", type: TableColumnType.int8}
        ],
        TableColumnType.varchar,
        string_padLeft
    );
    db.declareFunction(kFunctionType.scalar, "PADRIGHT", [
            {name: "INPUT", type: TableColumnType.varchar},
            {name: "PADWITH", type: TableColumnType.varchar},
            {name: "NUM", type: TableColumnType.int8}
        ],
        TableColumnType.varchar,
        string_padRight
    );
    db.declareFunction(kFunctionType.scalar, "PATINDEX", [{name: "STRING", type: TableColumnType.varchar}, {name: "PATTERN", type: TableColumnType.varchar}],
        TableColumnType.uint8, string_patindex);
    db.declareFunction(kFunctionType.scalar, "REPLACE", [
            {name: "STRING", type: TableColumnType.varchar},
            {name: "REPLACE", type: TableColumnType.varchar},
            {name: "WITH", type: TableColumnType.varchar}],
        TableColumnType.varchar, string_replace);
    db.declareFunction(kFunctionType.scalar, "REPLICATE", [
            {name: "STRING", type: TableColumnType.varchar},
            {name: "NUM", type: TableColumnType.uint8}],
        TableColumnType.varchar, string_replicate);
    db.declareFunction(kFunctionType.scalar, "REVERSE", [{name: "STRING", type: TableColumnType.varchar}], TableColumnType.varchar, string_reverse);
    db.declareFunction(kFunctionType.scalar, "RIGHT", [{name: "STRING", type: TableColumnType.varchar}, {name: "LENGTH", type: TableColumnType.uint8}],
        TableColumnType.varchar, string_right);
    db.declareFunction(kFunctionType.scalar, "RTRIM", [{name: "STRING", type: TableColumnType.varchar}],
        TableColumnType.varchar, string_rtrim);
    db.declareFunction(kFunctionType.scalar, "SPACE", [{name: "NUM", type: TableColumnType.uint8}], TableColumnType.varchar, string_space);
    db.declareFunction(kFunctionType.scalar, "STR", [{name: "NUMERIC", type: TableColumnType.numeric}], TableColumnType.varchar, string_str);
    db.declareFunction(kFunctionType.scalar, "SUBSTRING", [{name: "STRING", type: TableColumnType.varchar}, {name: "START", type: TableColumnType.uint8}, {name: "LENGTH", type: TableColumnType.uint8}], TableColumnType.varchar, string_substring);
    db.declareFunction(kFunctionType.scalar, "TRIM", [{name: "STRING", type: TableColumnType.varchar}],
        TableColumnType.varchar, string_trim);
    db.declareFunction(kFunctionType.scalar, "UPPER", [{name: "STRING", type: TableColumnType.varchar}],
        TableColumnType.varchar, string_upper);

}