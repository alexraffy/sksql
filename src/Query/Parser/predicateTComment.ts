import {str} from "../../BaseParser/Predicates/str";
import {anyCharacter} from "../../BaseParser/Predicates/anyCharacter";
import {returnPred} from "../../BaseParser/Predicates/ret";


export function * predicateTComment(callback) {
    let comment = "";
    comment += yield str("--");
    let cont = true;
    while (cont === true) {
        let char = yield anyCharacter;
        comment += char;
        if (char === "\r" || char === "\r\n" || char === "\n") {
            cont = false;
        }
    }
    yield returnPred({
       kind: "TComment",
       comment:  comment
    });
}