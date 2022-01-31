import {ParseResult} from "../BaseParser/ParseResult";
import {TQueryCreateFunction} from "../Query/Types/TQueryCreateFunction";
import {SQLResult} from "../API/SQLResult";
import {instanceOfTQueryCreateFunction} from "../Query/Guards/instanceOfTQueryCreateFunction";
import {TableColumnType} from "../Table/TableColumnType";
import {typeString2TableColumnType} from "../API/typeString2TableColumnType";
import {SKSQL} from "../API/SKSQL";
import {kFunctionType} from "../Functions/kFunctionType";
import {SQLStatement} from "../API/SQLStatement";
import {kResultType} from "../API/kResultType";
import {instanceOfTQueryCreateProcedure} from "../Query/Guards/instanceOfTQueryCreateProcedure";
import {TQueryCreateProcedure} from "../Query/Types/TQueryCreateProcedure";
import {TExecutionContext} from "./TExecutionContext";


export function processCreateProcedureStatement(context: TExecutionContext, statement: TQueryCreateProcedure): SQLResult {
    if (instanceOfTQueryCreateProcedure(statement)) {
        let c: TQueryCreateProcedure = statement;


        SKSQL.instance.declareProcedure(c);

        // write function text in routines
        let sql = "SELECT true FROM master.routines WHERE name = @name AND TYPE = 'PROCEDURE'";
        let doesItExist = new SQLStatement(sql, false);
        doesItExist.setParameter("@name", c.procName);
        let exists = doesItExist.run(kResultType.JSON);
        doesItExist.close();
        if (exists.length > 0 && exists[0].true !== true) {
            let sqlUpdate = "UPDATE SET definition = @text, modified = GETUTCDATE() FROM master.routines WHERE name = @name";
            let stUpdate = new SQLStatement(sqlUpdate, false);
            stUpdate.setParameter("@text", context.query);
            stUpdate.setParameter("@name", c.procName);
            let retUpdate = stUpdate.run();
            console.dir(retUpdate);
            stUpdate.close();
        } else {
            let sqlInsert = "INSERT INTO master.routines (schema, name, type, definition, modified) VALUES (@schema, @name, 'PROCEDURE', @text, GETUTCDATE())";
            let stInsert = new SQLStatement(sqlInsert, false);
            stInsert.setParameter("@schema", 'dbo');
            stInsert.setParameter("@name", c.procName);
            stInsert.setParameter("@text", context.query);
            stInsert.run();
            stInsert.close();
        }



        context.results.push({
            resultTableName: "",
            rowCount: 0,
            executionPlan: {
                description: "CREATE PROCEDURE"
            },
            perfs: {
                parser: 0,
                query: 0
            }
        } as SQLResult);
        context.broadcastQuery = true;
        return;
    }
    context.results.push({
        error: "Misformed CREATE PROCEDURE query.",
        resultTableName: "",
        rowCount: 0,
        executionPlan: {
            description: ""
        },
        perfs: {
            parser: 0,
            query: 0
        }
    });
    context.broadcastQuery = false;

}