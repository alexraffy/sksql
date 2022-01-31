
import {TColumn} from "../Query/Types/TColumn";


export interface TEPUpdate {
    kind: "TEPUpdate";
    dest: string;
    sets: TColumn[]
}