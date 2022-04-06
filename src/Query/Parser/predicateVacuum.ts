
import {returnPred} from "../../BaseParser/Predicates/ret";
import {str} from "../../BaseParser/Predicates/str";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {eof} from "../../BaseParser/Predicates/eof";
import {TVacuum} from "../Types/TVacuum";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";

// parse a VACUUM op
//

export function * predicateVacuum() {

    yield str("VACUUM");
    yield oneOf([str(";"), whitespaceOrNewLine, eof], "");

    yield returnPred({
        kind: "TVacuum"
    } as TVacuum);

}