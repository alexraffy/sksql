import {Stream} from "./Stream";


export class ParseError extends Error {
    kind: string = "ParseError";
    origin: Stream;
    errors: string[];
    abort: boolean;
    constructor(origin: Stream, error: string | string[], abort: boolean) {
        super()
        this.origin = origin;
        this.errors = [];
        if (typeof error === "string") {
            this.errors.push(error);
        } else {
            this.errors.push(...error);
        }
        this.abort = abort;
    }

    expected(str: string) {
        return new ParseError(this.origin, str, this.abort);
    }

    fatal() {
        return new ParseError(this.origin, this.errors, true);
    }

    withError(additionalError: ParseError) {
        if (this.origin.cursor < additionalError.origin.cursor) {
            return additionalError;
        }
        if (this.origin.cursor > additionalError.origin.cursor) {
            return this;
        }
        return new ParseError(this.origin, [...this.errors, ...additionalError.errors], this.abort);
    }

    get description(): string {
        let ret: string = "";
        this.errors.forEach((e) => {
            const line = 0;
            const position = this.origin.cursor;
            ret += `Error at line ${line} position ${position}: Expected ${e}\n`;
        });
        return ret;
    }




}