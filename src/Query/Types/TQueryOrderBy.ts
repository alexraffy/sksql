import {TColumn} from "./TColumn";
import {TLiteral} from "./TLiteral";
import {kOrder} from "../Enums/kOrder";
import {TQueryExpression} from "./TQueryExpression";
import {TQueryColumn} from "./TQueryColumn";

export interface TQueryOrderBy
{
    column: TQueryColumn;
    order: kOrder;
}