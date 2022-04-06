import {TVacuum} from "../Types/TVacuum";


export function instanceOfTVacuum(object: any): object is TVacuum {
    return object !== undefined && object.kind === "TVacuum"
}