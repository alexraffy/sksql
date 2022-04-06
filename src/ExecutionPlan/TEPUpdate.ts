
import {TColumn} from "../Query/Types/TColumn";


// Update stage

export interface TEPUpdate {
    kind: "TEPUpdate";
    dest: string;
    sets: TColumn[]
}