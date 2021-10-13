import {Stream} from "./Stream";


export class ParseResult {
    kind: string = "ParseResult";
    value: any;
    next: Stream;
    start: Stream;
    matched: string;

    constructor(value: any, next: Stream, start: Stream, matched: string) {
        this.value = value;
        this.next = next;
        this.start = start;
        this.matched = matched;
        Object.freeze(this);
    }
}