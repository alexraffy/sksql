import {TValidStatementsInFunction} from "./TValidStatementsInFunction";
import {TValidExpressions} from "./TValidExpressions";
import {TQueryCreateProcedure} from "./TQueryCreateProcedure";
import {TQueryCreateFunction} from "./TQueryCreateFunction";
import {TQueryCreateTable} from "./TQueryCreateTable";
import {TQueryInsert} from "./TQueryInsert";
import {TQueryUpdate} from "./TQueryUpdate";
import {TQuerySelect} from "./TQuerySelect";
import {TQueryDelete} from "./TQueryDelete";


export type TValidStatementsInProcedure = TValidStatementsInFunction | TValidExpressions | TQueryCreateProcedure | TQueryCreateFunction | TQueryCreateTable |
        TQueryInsert | TQueryUpdate | TQuerySelect | TQueryDelete;