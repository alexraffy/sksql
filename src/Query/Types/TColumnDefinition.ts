import {TQueryExpression} from "./TQueryExpression";
import {TLiteral} from "./TLiteral";
import {TColumnType} from "./TColumnType";


export interface TColumnDefinition {
    kind: "TColumnDefinition"
    name: TLiteral;
    type: TColumnType;
    default: TQueryExpression;
}