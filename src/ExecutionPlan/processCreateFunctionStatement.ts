import {ParseResult} from "../BaseParser/ParseResult";
import {TSQLResult} from "../API/TSQLResult";
import {instanceOfTQueryCreateFunction} from "../Query/Guards/instanceOfTQueryCreateFunction";
import {TQueryCreateFunction} from "../Query/Types/TQueryCreateFunction";
import {TableColumnType} from "../Table/TableColumnType";
import {typeString2TableColumnType} from "../API/typeString2TableColumnType";
import {SKSQL} from "../API/SKSQL";
import {kFunctionType} from "../Functions/kFunctionType";
import {SQLStatement} from "../API/SQLStatement";
import {kResultType} from "../API/kResultType";
import {TExecutionContext} from "./TExecutionContext";
import {addModifiedBlocksToContext} from "./addModifiedBlocksToContext";


// Process a CREATE/ALTER FUNCTION statement
//
// The function code is saved in the routines table.


export function processCreateFunctionStatement(db: SKSQL, context: TExecutionContext, statement: TQueryCreateFunction): TSQLResult {
    if (instanceOfTQueryCreateFunction(statement)) {
        let c: TQueryCreateFunction = statement;

        let parameters: {name: string, type: TableColumnType}[] = [];
        for (let i = 0; i < c.parameters.length; i++) {
            parameters.push({name: c.parameters[i].variableName.name, type: typeString2TableColumnType(c.parameters[i].type.type)});
        }
        db.declareFunction(kFunctionType.scalar, c.functionName, parameters, typeString2TableColumnType(c.returnType.type), c);
        let text = "";
        if (context.query !== undefined && context.query !== "") {
            // @ts-ignore
            if (statement.debug !== undefined) {
                // @ts-ignore
                text = context.query.substring(statement.debug.start, statement.debug.end);
            }
        }

        // write function text in routines
        let sql = "SELECT true FROM master.routines WHERE name = @name AND TYPE = 'FUNCTION'";
        let doesItExist = new SQLStatement(db, sql, false);
        doesItExist.setParameter("@name", c.functionName);
        let exists = doesItExist.run().getRows();
        doesItExist.close();
        if (exists.length > 0 && exists[0]["true"].true !== true) {
            let sqlUpdate = "UPDATE SET definition = @text, modified = GETUTCDATE() FROM master.routines WHERE name = @name";
            let stUpdate = new SQLStatement(db, sqlUpdate, false);
            stUpdate.setParameter("@text", text);
            stUpdate.setParameter("@name", c.functionName);
            let retUpdate = stUpdate.run();
            addModifiedBlocksToContext(context, stUpdate.context);
            stUpdate.close();
        } else {
            let sqlInsert = "INSERT INTO master.routines (schema, name, type, definition, modified) VALUES (@schema, @name, 'FUNCTION', @text, GETUTCDATE())";
            let stInsert = new SQLStatement(db, sqlInsert, false);
            stInsert.setParameter("@schema", 'dbo');
            stInsert.setParameter("@name", c.functionName);
            stInsert.setParameter("@text", text);
            stInsert.run();
            addModifiedBlocksToContext(context, stInsert.context);
            stInsert.close();
        }

        context.broadcastQuery = true;
        if (context.result.messages === undefined) {
            context.result.messages = "CREATE FUNCTION";
        } else {
            context.result.messages += "\r\n" + "CREATE FUNCTION";
        }
        return;
    }
    context.broadcastQuery = false;
    context.exitExecution = false;
    if (context.result.error === undefined) {
        context.result.error = "Misformed CREATE FUNCTION query.";
    } else {
        context.result.error += "\r\n" + "Misformed CREATE FUNCTION query.";
    }


}