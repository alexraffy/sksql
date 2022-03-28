import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {kSysColumns} from "../Table/kSysColumns";
import {TColumn} from "../Query/Types/TColumn";
import {TQueryColumn} from "../Query/Types/TQueryColumn";
import {ITableDefinition} from "../Table/ITableDefinition";
import {TEPProjection} from "./TEPProjection";


export function addAllColumnsForTable (tblWalk: TTableWalkInfo, returnTableDefinition: ITableDefinition, groupByResultTableDef: ITableDefinition, projections: TEPProjection[], projectionsGroupBy: TEPProjection[] ) {
    if (tblWalk) {
        let d = tblWalk.def;
        let newColIdx = 0;
        for (let x = 0; x < d.columns.length; x++) {
            let col = d.columns[x];

            let found = false;
            for (let j = 0; j < returnTableDefinition.columns.length; j++) {
                let c = returnTableDefinition.columns[j];
                if (c.name.toUpperCase() === col.name.toUpperCase()) {
                    if (c.invisible === true) {
                        c.invisible = false;
                    } else {
                        found = true;
                    }
                }
            }
            found = false;
            if (!found && col.name.toUpperCase() !== kSysColumns.change_xdes_id.toUpperCase()) {

                let colIndex = 0;
                let baseName = col.name;
                if (baseName === "") {
                    baseName = "column"
                }
                let name = col.name;
                let columnNameExists = returnTableDefinition.columns.find((c) => { return c.name.toUpperCase() === name.toUpperCase();});
                while (columnNameExists !== undefined) {
                    colIndex++;
                    name = baseName + colIndex;
                    columnNameExists = returnTableDefinition.columns.find((c) => { return c.name.toUpperCase() === name.toUpperCase();});
                }

                returnTableDefinition.columns.push({
                    name: name,
                    type: col.type,
                    length: col.length,
                    nullable: col.nullable,
                    defaultExpression: col.defaultExpression,
                    invisible: false,
                    decimal: col.decimal
                });

                groupByResultTableDef.columns.push({
                    name: name,
                    type: col.type,
                    length: col.length,
                    nullable: col.nullable,
                    defaultExpression: col.defaultExpression,
                    invisible: false,
                    decimal: col.decimal
                });

                projections.push(
                    {
                        columnName: name,
                        output: {
                            kind: "TQueryColumn",
                            expression: {
                                kind: "TColumn",
                                table: tblWalk.name.toUpperCase(),
                                column: col.name
                            } as TColumn
                        } as TQueryColumn
                    }
                );
                projectionsGroupBy.push({
                    columnName: name,
                    output: {
                        kind: "TQueryColumn",
                        expression: {
                            kind: "TColumn",
                            table: "",
                            column: col.name
                        } as TColumn
                    } as TQueryColumn
                })

            }

        }
    }
}