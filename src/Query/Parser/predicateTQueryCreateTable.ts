import {maybe} from "../../BaseParser/Predicates/maybe";
import {str} from "../../BaseParser/Predicates/str";
import {literal} from "../../BaseParser/Predicates/literal";
import {predicateTTableName} from "./predicateTTableName";
import {TTable} from "../Types/TTable";
import {predicateTColumnType} from "./predicateTColumnType";
import {predicateTQueryExpression} from "./predicateTQueryExpression";
import {TColumnDefinition} from "../Types/TColumnDefinition";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TQueryCreateTable} from "../Types/TQueryCreateTable";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {number} from "../../BaseParser/Predicates/number";
import {TTableConstraint} from "../../Table/TTableConstraint";
import {kTableConstraintType} from "../../Table/kTableConstraintType";
import {kForeignKeyOnEvent} from "../../Table/kForeignKeyOnEvent";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {exitIf} from "../../BaseParser/Predicates/exitIf";
import {predicateValidExpressions} from "./predicateValidExpressions";


/*
    tries to parse a constraint
 */
const predicateTQueryConstraint = function (table: TTable, constraints: TTableConstraint[], currentColumn: string) {
    return function *(callback) {
        //@ts-ignore
        if (callback as string === "isGenerator") {
            return;
        }
        let constraintName = undefined;
        let isConstraint = yield maybe(str("CONSTRAINT"));
        if (isConstraint === "CONSTRAINT") {
            yield atLeast1(whitespaceOrNewLine);
            constraintName = yield maybe(literal);
            if (constraintName !== undefined) {
                yield atLeast1(whitespaceOrNewLine);
            }
        }

        const columnNameOrConstraint = yield oneOf([
            str("PRIMARY KEY"), str("UNIQUE"),
            str("FOREIGN KEY"), str("CHECK")], "")


        yield maybe(atLeast1(whitespaceOrNewLine));
        if (columnNameOrConstraint.toUpperCase() === "PRIMARY KEY" || columnNameOrConstraint.toUpperCase() === "UNIQUE") {
            let columns: { name: string, ascending: boolean }[] = [];
            yield maybe(atLeast1(whitespaceOrNewLine));
            const clustering = yield maybe(oneOf([str("CLUSTERED"), str("NON CLUSTERED")], ""));
            yield maybe(atLeast1(whitespaceOrNewLine));
            yield str("(");
            let moreClusteredColumn = ",";
            while (moreClusteredColumn === ",") {
                yield maybe(atLeast1(whitespaceOrNewLine));
                const clusteredColumn = yield literal;
                yield maybe(atLeast1(whitespaceOrNewLine));
                const clustedColumnOrder = yield maybe(oneOf([str("ASC"), str("DESC")], ""));
                yield maybe(atLeast1(whitespaceOrNewLine));
                columns.push({
                    name: clusteredColumn,
                    ascending: (clustedColumnOrder !== undefined) ? (clustedColumnOrder === "ASC") : false
                })
                moreClusteredColumn = yield maybe(str(","));
            }
            yield maybe(atLeast1(whitespaceOrNewLine));
            yield str(")");

            if (constraintName === undefined) {
                constraintName = "PK_" + table.table;
                for (let x = 0; x < columns.length; x++) {
                    constraintName += "_" + columns[x].name.toUpperCase();
                }
            }


            constraints.push({
                constraintName: constraintName,
                type: kTableConstraintType.primaryKey,
                columns: columns,
                clustered: (clustering !== undefined) ? (clustering.toUpperCase() === "CLUSTERED") : false,
                foreignKeyTable: "",
                foreignKeyColumnsRef: [],
                check: undefined,
                foreignKeyOnDelete: kForeignKeyOnEvent.noAction,
                foreignKeyOnUpdate: kForeignKeyOnEvent.noAction
            });

        } else if (columnNameOrConstraint.toUpperCase() === "FOREIGN KEY") {
            yield maybe(atLeast1(whitespaceOrNewLine));
            yield str("(");
            let columns: { name: string, ascending: boolean }[] = [];
            let fkcolumns: string[] = [];
            let moreForeignKeys = ",";
            while (moreForeignKeys === ",") {
                yield maybe(atLeast1(whitespaceOrNewLine));
                let columnForeignKey = yield literal;
                yield maybe(atLeast1(whitespaceOrNewLine));
                columns.push(
                    {
                        name: columnForeignKey,
                        ascending: false
                    }
                );
                moreForeignKeys = yield maybe(str(","))
            }
            yield str(")");
            yield atLeast1(whitespaceOrNewLine);
            yield str("REFERENCES");
            yield atLeast1(whitespaceOrNewLine);

            const fkTableRef = yield literal;
            yield maybe(atLeast1(whitespaceOrNewLine));

            let hasColumns = yield maybe(str("("));
            if (hasColumns) {
                let moreFKRef = ",";
                while (moreFKRef === ",") {
                    yield maybe(atLeast1(whitespaceOrNewLine));
                    let columnFKRef = yield literal;
                    fkcolumns.push(columnFKRef);
                    yield maybe(atLeast1(whitespaceOrNewLine));
                    moreFKRef = yield maybe(str(","));
                }
                yield str(")");
            } else {
                // WE NEED TO CHECK IF THE REFERENCE COLUMN OMITTED HERE HAS THE SAME NAME OR IF WE WANT TO REFERENCE THE PRIMARY KEY INSTEAD
                // SINCE THE STATEMENTS FOR THE CREATION OF THE TABLES CAN BE IN THE SAME SCRIPT, WE HAVE TO DO THIS
                // AT RUN-TIME.

            }

            yield maybe(atLeast1(whitespaceOrNewLine));
            let onUpdate: kForeignKeyOnEvent = kForeignKeyOnEvent.noAction;
            let onDelete: kForeignKeyOnEvent = kForeignKeyOnEvent.noAction
            let hasTriggerCheck = yield maybe(oneOf([str("ON UPDATE"), str("ON DELETE")], ""));
            while (hasTriggerCheck !== undefined) {
                yield atLeast1(whitespaceOrNewLine);
                let onEventAction = yield oneOf([str("NO ACTION"), str("CASCADE"), str("SET NULL"), str("SET DEFAULT")], "");

                if (hasTriggerCheck === "ON UPDATE") {
                    switch (onEventAction.toUpperCase()) {
                        case "NO ACTION":
                            onUpdate = kForeignKeyOnEvent.noAction;
                            break;
                        case "CASCADE":
                            onUpdate = kForeignKeyOnEvent.cascade;
                            break;
                        case "SET NULL":
                            onUpdate = kForeignKeyOnEvent.setNull;
                            break;
                        case "SET DEFAULT":
                            onUpdate = kForeignKeyOnEvent.setDefault;
                            break;
                    }
                }
                if (hasTriggerCheck === "ON DELETE") {
                    switch (onEventAction.toUpperCase()) {
                        case "NO ACTION":
                            onDelete = kForeignKeyOnEvent.noAction;
                            break;
                        case "CASCADE":
                            onDelete = kForeignKeyOnEvent.cascade;
                            break;
                        case "SET NULL":
                            onDelete = kForeignKeyOnEvent.setNull;
                            break;
                        case "SET DEFAULT":
                            onDelete = kForeignKeyOnEvent.setDefault;
                            break;
                    }
                }
                yield maybe(atLeast1(whitespaceOrNewLine));
                hasTriggerCheck = yield maybe(oneOf([str("ON UPDATE"), str("ON DELETE")], ""));
            }

            if (constraintName === undefined) {
                constraintName = "FK_" + table.table + "_" + fkTableRef;
                for (let x = 0; x < columns.length; x++) {
                    constraintName += "_" + columns[x].name.toUpperCase();
                }
            }

            constraints.push(
                {
                    constraintName: constraintName,
                    type: kTableConstraintType.foreignKey,
                    columns: columns,
                    foreignKeyTable: fkTableRef,
                    foreignKeyColumnsRef: fkcolumns,
                    clustered: false,
                    check: undefined,
                    foreignKeyOnDelete: onDelete,
                    foreignKeyOnUpdate: onUpdate
                }
            )

        } else if (columnNameOrConstraint.toUpperCase() === "CHECK") {
            yield maybe(atLeast1(whitespaceOrNewLine));
            yield str("(");
            yield maybe(atLeast1(whitespaceOrNewLine));
            const checkExpression = yield predicateTQueryExpression;
            yield maybe(atLeast1(whitespaceOrNewLine));
            yield str(")")
            yield maybe(atLeast1(whitespaceOrNewLine));

            if (constraintName === undefined) {
                constraintName = "CHK_" + table.table;
            }

            constraints.push(
                {
                    constraintName: constraintName,
                    type: kTableConstraintType.check,
                    columns: [],
                    clustered: false,
                    foreignKeyTable: "",
                    foreignKeyColumnsRef: [],
                    check: checkExpression,
                    foreignKeyOnDelete: kForeignKeyOnEvent.noAction,
                    foreignKeyOnUpdate: kForeignKeyOnEvent.noAction
                }
            );
        }
        yield returnPred(columnNameOrConstraint.toUpperCase());

    }



}



/*
    tries to parse a create statement
    CREATE TABLE {TABLENAME} (
    COLUMN_DEF
    CONSTRAINT_DEF
    )
    COLUMN_DEF = {COLUMNNAME} TYPE [NULL | NOT NULL] [IDENTITY] [DEFAULT] [CONSTRAINT]
    CONSTRAINT_DEF = CONSTRAINT
 */
export const predicateTQueryCreateTable = function *(callback) {
    //@ts-ignore
    if (callback as string === "isGenerator") {
        return;
    }
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield str("CREATE");
    yield atLeast1(whitespaceOrNewLine);
    yield str("TABLE");
    yield atLeast1(whitespaceOrNewLine);
    const table: TTable = yield predicateTTableName
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield str("(");

    let constraints: TTableConstraint[] = [];

    let hasIdentity: boolean = false;
    let identityColumnName: string = "";
    let identitySeed: number = 1;
    let identityIncrement: number = 1;

    let columns: TColumnDefinition[] = [];

    let gotMore = ",";
    while (gotMore === ",") {
        yield maybe(atLeast1(whitespaceOrNewLine));

        let isConstraint = yield maybe(str("CONSTRAINT"));
        if (isConstraint === "CONSTRAINT") {
            yield atLeast1(whitespaceOrNewLine);
        }

        const columnNameOrConstraint = yield oneOf([predicateTQueryConstraint(table, constraints, ""), literal], "")


        if (["PRIMARY KEY", "UNIQUE", "FOREIGN KEY", "CHECK"].includes(columnNameOrConstraint.toUpperCase())) {

        } else {
            yield atLeast1(whitespaceOrNewLine);
            const columnType = yield predicateTColumnType;
            yield maybe(atLeast1(whitespaceOrNewLine));
            const isIdentity = yield maybe(str("IDENTITY"));
            if (isIdentity === "IDENTITY") {
                hasIdentity = true;
                yield maybe(atLeast1(whitespaceOrNewLine));
                yield str("(");
                yield maybe(atLeast1(whitespaceOrNewLine));
                identityColumnName = columnNameOrConstraint;
                identitySeed = yield number;
                yield maybe(atLeast1(whitespaceOrNewLine));
                yield maybe(str(","));
                yield maybe(atLeast1(whitespaceOrNewLine));
                identityIncrement = yield number;
                yield maybe(atLeast1(whitespaceOrNewLine));
                yield str(")");
                yield maybe(atLeast1(whitespaceOrNewLine));

            }
            let hasColumnConstraint = yield exitIf(oneOf([str("UNIQUE"), str("PRIMARY KEY"), str("CHECK")], ""));
            if (hasColumnConstraint === true) {
                yield maybe(predicateTQueryConstraint(table, constraints, columnNameOrConstraint));
                yield maybe(atLeast1(whitespaceOrNewLine));
            }

            const hasDefault = yield maybe(str("DEFAULT"));
            let defaultValue = undefined;
            if (hasDefault === "DEFAULT") {
                yield atLeast1(whitespaceOrNewLine);
                defaultValue = yield oneOf([predicateTQueryExpression, predicateValidExpressions], "");
                yield maybe(atLeast1(whitespaceOrNewLine))
            }





            columns.push({
                kind: "TColumnDefinition",
                name: columnNameOrConstraint,
                type: columnType,
                default: defaultValue
            } as TColumnDefinition)
        }

        gotMore = yield maybe(str(","));
    }
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield str(")");
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield maybe(str(";"));

    yield maybe(atLeast1(whitespaceOrNewLine));

    yield returnPred({
        kind: "TQueryCreateTable",
        name: table,
        columns: columns,
        hasIdentity: hasIdentity,
        identityColumnName: identityColumnName,
        identitySeed: identitySeed,
        identityIncrement: identityIncrement,
        constraints: constraints
    } as TQueryCreateTable)


}