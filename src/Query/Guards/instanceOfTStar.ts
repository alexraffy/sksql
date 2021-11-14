import {TStar} from "../Types/TStar";


export function InstanceOfTStar(object: any): object is TStar {
    return object !== undefined && object.kind === "TStar";
}