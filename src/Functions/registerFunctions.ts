import {kFunctionType} from "./kFunctionType";
import {TableColumnType} from "../Table/TableColumnType";
import {SKSQL} from "../API/SKSQL";
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
import {string_unicode} from "./String/string_unicode";
import {tests_IsNull} from "./Tests/IsNull";
import {scoped_identity} from "./scoped_identity";
import {newid} from "./newid";
import {date_dateadd} from "./Date/date_dateadd";
import {aggregate_string_agg} from "./Aggregate/aggregate_string_agg";
import {tests_exists} from "./Tests/Exists";
import {logical_least} from "./Logical/least";
import {logical_greatest} from "./Logical/greatest";
import {logical_choose} from "./Logical/choose";
import {logical_iif} from "./Logical/iif";
import {aggregate_max} from "./Aggregate/aggregate_max";
import {aggregate_min} from "./Aggregate/aggregate_min";
import {aggregate_avg} from "./Aggregate/aggregate_avg";
import {aggregate_count} from "./Aggregate/aggregate_count";
import {logical_coalesce} from "./Logical/coalesce";
import {logical_nullif} from "./Logical/nullif";


export function registerFunctions(db: SKSQL) {

    // AGGREGATE
    db.declareFunction(kFunctionType.aggregate, "SUM", [
        {name: "EXPRESSION", type: TableColumnType.any}
    ], TableColumnType.any, aggregate_sum, false, 0);

    db.declareFunction(kFunctionType.aggregate, "MAX", [{name: "EXPRESSION", type: TableColumnType.any}],
        TableColumnType.any, aggregate_max, false, 0);
    db.declareFunction(kFunctionType.aggregate, "MIN", [{name: "EXPRESSION", type: TableColumnType.any}],
        TableColumnType.any, aggregate_min, false, 0);
    db.declareFunction(kFunctionType.aggregate, "AVG", [{name: "EXPRESSION", type: TableColumnType.any}],
        TableColumnType.any, aggregate_avg, false, 0);
    db.declareFunction(kFunctionType.aggregate, "COUNT", [
        {name: "EXPRESSION", type: TableColumnType.any}
    ], TableColumnType.int32, aggregate_count);



    db.declareFunction(kFunctionType.aggregate, "STRING_AGG", [
        {name: "EXPRESSION", type: TableColumnType.varchar},
        {name: "SEPARATOR", type: TableColumnType.varchar}
    ], TableColumnType.varchar, aggregate_string_agg);

    // DATE
    db.declareFunction(kFunctionType.scalar, "DATEFROMPARTS", [
        {name: "YEAR", type: TableColumnType.int32},
        {name: "MONTH", type: TableColumnType.uint8},
        {name: "DAY", type: TableColumnType.uint8}
    ], TableColumnType.date, date_datefromparts);
    db.declareFunction(kFunctionType.scalar, "DAY", [{name: "DATE", type: TableColumnType.date}], TableColumnType.uint8, date_day);
    db.declareFunction(kFunctionType.scalar, "GETDATE", [], TableColumnType.datetime, date_getdate);
    db.declareFunction(kFunctionType.scalar, "GETUTCDATE", [], TableColumnType.datetime, date_getutcdate);
    db.declareFunction(kFunctionType.scalar, "ISDATE", [{name: "DATE", type: TableColumnType.varchar}], TableColumnType.boolean, date_isdate);
    db.declareFunction(kFunctionType.scalar, "MONTH", [{name: "DATE", type: TableColumnType.date}], TableColumnType.uint8, date_month);
    db.declareFunction(kFunctionType.scalar, "YEAR", [{name: "DATE", type: TableColumnType.date}], TableColumnType.int32, date_year);
    db.declareFunction(kFunctionType.scalar, "DATEADD", [{name: "DATEPART", type: TableColumnType.varchar},
        { name: "NUMBER", type: TableColumnType.int32}, {name: "DATE", type: TableColumnType.datetime}], TableColumnType.datetime, date_dateadd);
    // NUMERIC
    db.declareFunction(kFunctionType.scalar, "ABS", [{name: "NUMERIC", type: TableColumnType.any}], TableColumnType.any, scalar_abs, false, 0);
    db.declareFunction(kFunctionType.scalar, "POWER", [{name: "BASE", type: TableColumnType.any}, {name: "EXP", type: TableColumnType.any}], TableColumnType.any, scalar_power, false, 0 );
    db.declareFunction(kFunctionType.scalar, "RAND", [], TableColumnType.numeric, scalar_rand);
    db.declareFunction(kFunctionType.scalar, "ROUND", [{name: "NUMERIC", type: TableColumnType.any}, {name: "DECIMALS", type: TableColumnType.uint8}], TableColumnType.any, scalar_round, false, 0);

    // STRING
    db.declareFunction(kFunctionType.scalar, "CONCAT", [{name: "STR_A", type: TableColumnType.varchar}, {name: "STR_B", type: TableColumnType.varchar}],
        TableColumnType.varchar, string_concat, true);
    db.declareFunction(kFunctionType.scalar, "CONCAT_WS", [{name: "SEP", type: TableColumnType.varchar}, {name: "STR_A", type: TableColumnType.varchar}, {name: "STR_B", type: TableColumnType.varchar}],
        TableColumnType.varchar, string_concat_ws, true);
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
    db.declareFunction(kFunctionType.scalar, "UNICODE", [{name: "STRING", type: TableColumnType.varchar}],
        TableColumnType.int32, string_unicode);

    // TEST
    db.declareFunction(kFunctionType.scalar, "ISNULL", [{name: "check_expression", type: TableColumnType.any},
            {name: "replacement_value", type: TableColumnType.any}],
        TableColumnType.any, tests_IsNull, false, 0);
    db.declareFunction(kFunctionType.scalar, "EXISTS", [{name: "SUBQUERY", type: TableColumnType.any}],
        TableColumnType.boolean, tests_exists);

    // IDS
    db.declareFunction(kFunctionType.scalar, "SCOPE_IDENTITY", [], TableColumnType.uint32, scoped_identity);
    db.declareFunction(kFunctionType.scalar, "NEWID", [], TableColumnType.varchar, newid);


    // LOGICAL
    db.declareFunction(kFunctionType.scalar, "LEAST", [{name: "EXPRESSION", type: TableColumnType.any}],
        TableColumnType.any, logical_least, true, 0);
    db.declareFunction(kFunctionType.scalar, "GREATEST", [{name: "EXPRESSION", type: TableColumnType.any}],
        TableColumnType.any, logical_greatest, true, 0);
    db.declareFunction(kFunctionType.scalar, "CHOOSE", [{name: "INDEX", type: TableColumnType.uint8},
        {name: "EXPRESSION", type: TableColumnType.any}], TableColumnType.any, logical_choose, true, 1);
    db.declareFunction(kFunctionType.scalar, "IIF", [{name: "BOOLEAN EXPRESSION", type: TableColumnType.boolean},
        {name: "TRUE_VALUE", type: TableColumnType.any}, {name: "FALSE_VALUE", type: TableColumnType.any}],
        TableColumnType.any, logical_iif, false, 1);
    db.declareFunction(kFunctionType.scalar, "COALESCE", [{name: "EXPRESSION", type: TableColumnType.any}],
        TableColumnType.any, logical_coalesce, true, 1);
    db.declareFunction(kFunctionType.scalar, "NULLIF", [{name: "EXPRESSION", type: TableColumnType.any},
        {name: "EXPRESSION", type: TableColumnType.any}],
        TableColumnType.any, logical_nullif, false, 0);

}