import {TDebugger} from "../Types/TDebugger";


export function instanceOfTDebugger(object: any): object is TDebugger {
    return object !== undefined && object.kind === "TDebugger";
}