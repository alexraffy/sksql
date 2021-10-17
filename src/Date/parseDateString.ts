import {parse, TFuncGen} from "../BaseParser/parse";
import {returnPred} from "../BaseParser/Predicates/ret";
import {instanceOfParseResult} from "../BaseParser/Guards/instanceOfParseResult";
import {Stream} from "../BaseParser/Stream";

import {predicateTDate} from "../Query/Parser/predicateTDate";


export function parseDateString(input: string) {
    let result = parse(
        () => {},
        function *(isGenerator) {
            let ret = yield predicateTDate;
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