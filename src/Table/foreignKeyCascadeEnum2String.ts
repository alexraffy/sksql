import {kForeignKeyOnEvent} from "./kForeignKeyOnEvent";


export function foreignKeyCascadeEnum2String(c: kForeignKeyOnEvent): string {
    switch (c) {
        case kForeignKeyOnEvent.noAction:
            return "NO ACTION";
        case kForeignKeyOnEvent.cascade:
            return "CASCADE";
        case kForeignKeyOnEvent.setDefault:
            return "SET DEFAULT";
        case kForeignKeyOnEvent.setNull:
            return "SET NULL";
    }
    return "";
}