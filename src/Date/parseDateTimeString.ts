import {parse} from "../BaseParser/parse";
import {predicateTTime} from "../Query/Parser/predicateTTime";
import {returnPred} from "../BaseParser/Predicates/ret";
import {Stream} from "../BaseParser/Stream";
import {instanceOfParseResult} from "../BaseParser/Guards/instanceOfParseResult";
import {TDateTime} from "../Query/Types/TDateTime";
import {predicateTDateTime} from "../Query/Parser/predicateTDateTime";


export function parseDateTimeString(input: string): TDateTime {
    let result = parse(
        () => {},
        function *(isGenerator) {
            let ret = yield predicateTDateTime;
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