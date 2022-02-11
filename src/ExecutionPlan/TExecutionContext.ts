import {TableColumnType} from "../Table/TableColumnType";
import {numeric} from "../Numeric/numeric";
import {TDateTime} from "../Query/Types/TDateTime";
import {TDate} from "../Query/Types/TDate";
import {TTime} from "../Query/Types/TTime";
import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {ParseResult} from "../BaseParser/ParseResult";
import {SQLResult} from "../API/SQLResult";
import {ParseError} from "../BaseParser/ParseError";
import {TValidStatementsInProcedure} from "../Query/Types/TValidStatementsInProcedure";


export interface TExecutionContext {
    label: string;
    stack: {
        name: string;
        type: TableColumnType,
        value: string | numeric | number | boolean | bigint | TDateTime | TDate | TTime
    }[];
    returnValue: string | numeric | number | boolean | bigint | TDateTime | TDate | TTime;
    exitExecution: boolean;
    breakLoop: boolean;
    openTables: TTableWalkInfo[];
    parseResult: ParseResult | ParseError;
    broadcastQuery: boolean;
    result: SQLResult;
    query: string;
    openedTempTables: string[];
    scopedIdentity: number;
    transactionId: number;
    rollback: boolean;
    rollbackMessage: string;
    currentStatement: TValidStatementsInProcedure;
}