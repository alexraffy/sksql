import {TableColumn} from "../Table/TableColumn";
import {TEP} from "./TEP";


export interface TEPSelect extends TEP {
    kind: "TEPSelect",
    dest: string;
}