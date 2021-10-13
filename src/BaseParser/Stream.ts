


export class Stream {
    kind: string = "ParseStream";

    cursor: number = -1;

    input: string;

    constructor(buffer: string, cursor: number) {
        this.input = buffer;
        this.cursor = cursor;
        Object.freeze(this);
    }

    next(): Stream {
        return new Stream(this.input, this.cursor+1);
    }

    get() {
        if (this.EOF) {
            throw "Stream EOF";
        }
        return this.input[this.cursor];
    }

    get EOF(): boolean {
        return this.cursor >= this.input.length;
    }

    debug() {
        let str = "";
        for (let i = 0; i <= this.cursor; i++) {
            if (i < this.input.length) {
                str += this.input[i];
            } else {
                str += "[EOF]";
            }
        }
        str += "<";
        return str;
    }

}

