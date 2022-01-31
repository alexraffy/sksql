import {TBeginEnd} from "../Types/TBeginEnd";


export function instanceOfTBeginEnd(object: any): object is TBeginEnd {
    return object !== undefined && object.kind === "TBeginEnd";
}