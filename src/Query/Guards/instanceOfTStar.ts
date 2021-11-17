import {TStar} from "../Types/TStar";


export function instanceOfTStar(object: any): object is TStar {
    return object !== undefined && object.kind === "TStar";
}