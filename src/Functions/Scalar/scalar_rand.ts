import {numericLoad} from "../../Numeric/numericLoad";


export function scalar_rand() {
    return numericLoad(Math.random().toString());
}