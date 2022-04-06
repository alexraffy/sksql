import {TableColumn} from "../Table/TableColumn";
import {TEP} from "./TEP";

// Final stage in a select
// returns table dest

export interface TEPSelect extends TEP {
    kind: "TEPSelect",
    dest: string;
}