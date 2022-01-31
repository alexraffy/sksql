import {TComment} from "../Types/TComment";


export function instanceOfTComment(object: any): object is TComment {
    return object !== undefined && object.kind === "TComment";
}