import {parse} from "../BaseParser/parse";
import {predicateTDate} from "../Query/Parser/predicateTDate";
import {returnPred} from "../BaseParser/Predicates/ret";
import {Stream} from "../BaseParser/Stream";
import {instanceOfParseResult} from "../BaseParser/Guards/instanceOfParseResult";
import {predicateTTime} from "../Query/Parser/predicateTTime";
import {TTime} from "../Query/Types/TTime";

// Attempt to parse a string as a time

export function parseTimeString(input: string): TTime {
    let result = parse(
        () => {},
        function *(isGenerator) {
            let ret = yield predicateTTime;
            if (ret !== undefined) {
                yield returnPred(ret);
            }
        },
        new Stream(input, 0));
    if (!instanceOfParseResult(result)) {
        return undefined;
    }
    return result.value;
}