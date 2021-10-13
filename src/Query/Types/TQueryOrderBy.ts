import {TColumn} from "./TColumn";
import {TLiteral} from "./TLiteral";
import {kOrder} from "../Enums/kOrder";

export interface TQueryOrderBy
{
    column: TColumn | TLiteral;
    order: kOrder;
}