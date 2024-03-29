import {TableColumnType} from "../Table/TableColumnType";
import {numeric} from "../Numeric/numeric";
import {TDateTime} from "../Query/Types/TDateTime";
import {TDate} from "../Query/Types/TDate";
import {TTime} from "../Query/Types/TTime";
import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {ParseResult} from "../BaseParser/ParseResult";
import {TSQLResult} from "../API/TSQLResult";
import {ParseError} from "../BaseParser/ParseError";
import {TValidStatementsInProcedure} from "../Query/Types/TValidStatementsInProcedure";

// Execution context
// keep track of variables, open tables, loop flow, return value...

export enum kModifiedBlockType {
    tableHeader = "TABLEHEADER",
    tableBlock = "TABLEBLOCK",
    indexHeader = "INDEXHEADER",
    indexBlock = "INDEXBLOCK"
}

export interface TExecutionContext {
    label: string;
    stack: {
        name: string;
        type: TableColumnType,
        value: string | numeric | number | boolean | bigint | TDateTime | TDate | TTime
    }[]; // variables
    returnValue: string | numeric | number | boolean | bigint | TDateTime | TDate | TTime; // return value of a function
    exitExecution: boolean; // stop execution and return
    breakLoop: boolean; // if true, we will exit the current loop
    parseResult: ParseResult | ParseError;
    broadcastQuery: boolean; // set to true if the query modify any records
    result: TSQLResult;
    query: string;
    tables: TTableWalkInfo[]; // tables needed to fulfill the query.
    openedTempTables: string[]; // temp tables that will have to be dropped after the final result is read.
    scopedIdentity: number; // the last identity generated by an INSERT statement
    transactionId: number;
    rollback: boolean;
    rollbackMessage: string;
    currentStatement: TValidStatementsInProcedure;
    accessRights: string | "RW" | "R" | "W" | "N";
    modifiedBlocks: {
        type: kModifiedBlockType,
        name: string;
        blockIndex: number;
    }[];
}