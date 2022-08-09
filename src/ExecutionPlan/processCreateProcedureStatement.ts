import {ParseResult} from "../BaseParser/ParseResult";
import {TQueryCreateFunction} from "../Query/Types/TQueryCreateFunction";
import {TSQLResult} from "../API/TSQLResult";
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
import {addModifiedBlocksToContext} from "./addModifiedBlocksToContext";
import {TParserError} from "../API/TParserError";


// Process a CREATE/ALTER PROCEDURE statement
//
// The procedure is saved in the routines table.

export function processCreateProcedureStatement(db: SKSQL, context: TExecutionContext, statement: TQueryCreateProcedure): TSQLResult {
    if (instanceOfTQueryCreateProcedure(statement)) {
        let c: TQueryCreateProcedure = statement;


        if (context.accessRights !== undefined && context.accessRights.indexOf("W") === -1) {
            throw new TParserError("CREATE PROCEDURE: NO WRITE ACCESS.");
        }

        db.declareProcedure(c);

        let text = "";
        if (context.query !== undefined && context.query !== "") {
            // @ts-ignore
            if (statement.debug !== undefined) {
                // @ts-ignore
                text = context.query.substring(statement.debug.start, statement.debug.end);
            }
        }

        // write function text in routines
        let sql = "SELECT true FROM master.routines WHERE name = @name AND TYPE = 'PROCEDURE'";
        let doesItExist = new SQLStatement(db, sql, false, "RW");
        doesItExist.setParameter("@name", c.procName);
        let exists = doesItExist.runSync().getRows();
        doesItExist.close();
        if (exists.length > 0 && exists[0]["true"].true !== true) {
            let sqlUpdate = "UPDATE SET definition = @text, modified = GETUTCDATE() FROM master.routines WHERE name = @name";
            let stUpdate = new SQLStatement(db, sqlUpdate, false, "RW");
            stUpdate.setParameter("@text", text);
            stUpdate.setParameter("@name", c.procName);
            let retUpdate = stUpdate.runSync();
            addModifiedBlocksToContext(context, stUpdate.context);
            stUpdate.close();
        } else {
            let sqlInsert = "INSERT INTO master.routines (schema, name, type, definition, modified) VALUES (@schema, @name, 'PROCEDURE', @text, GETUTCDATE())";
            let stInsert = new SQLStatement(db, sqlInsert, false, "RW");
            stInsert.setParameter("@schema", 'dbo');
            stInsert.setParameter("@name", c.procName);
            stInsert.setParameter("@text", text);
            stInsert.runSync();
            addModifiedBlocksToContext(context, stInsert.context);
            stInsert.close();
        }



        if (context.result.messages === undefined) {
            context.result.messages = "CREATE PROCEDURE";
        } else {
            context.result.messages += "\r\n" + "CREATE PROCEDURE";
        }
        context.broadcastQuery = true;
        return;
    }
    if (context.result.error === undefined) {
        context.result.error = "Misformed CREATE PROCEDURE query.";
    } else {
        context.result.error += "\r\n" + "Misformed CREATE PROCEDURE query.";
    }
    context.broadcastQuery = false;

}