import {ParseResult} from "../BaseParser/ParseResult";
import {SQLResult} from "../API/SQLResult";
import {instanceOfTQueryCreateFunction} from "../Query/Guards/instanceOfTQueryCreateFunction";
import {TQueryCreateFunction} from "../Query/Types/TQueryCreateFunction";
import {TableColumnType} from "../Table/TableColumnType";
import {typeString2TableColumnType} from "../API/typeString2TableColumnType";
import {SKSQL} from "../API/SKSQL";
import {kFunctionType} from "../Functions/kFunctionType";
import {SQLStatement} from "../API/SQLStatement";
import {kResultType} from "../API/kResultType";
import {TExecutionContext} from "./TExecutionContext";


export function processCreateFunctionStatement(context: TExecutionContext, statement: TQueryCreateFunction): SQLResult {
    if (instanceOfTQueryCreateFunction(statement)) {
        let c: TQueryCreateFunction = statement;

        let parameters: {name: string, type: TableColumnType}[] = [];
        for (let i = 0; i < c.parameters.length; i++) {
            parameters.push({name: c.parameters[i].variableName.name, type: typeString2TableColumnType(c.parameters[i].type.type)});
        }
        SKSQL.instance.declareFunction(kFunctionType.scalar, c.functionName, parameters, typeString2TableColumnType(c.returnType.type), c);


        // write function text in routines
        let sql = "SELECT true FROM master.routines WHERE name = @name AND TYPE = 'FUNCTION'";
        let doesItExist = new SQLStatement(sql, false);
        doesItExist.setParameter("@name", c.functionName);
        let exists = doesItExist.run(kResultType.JSON);
        doesItExist.close();
        if (exists.length > 0 && exists[0].true !== true) {
            let sqlUpdate = "UPDATE SET definition = @text, modified = GETUTCDATE() FROM master.routines WHERE name = @name";
            let stUpdate = new SQLStatement(sqlUpdate, false);
            stUpdate.setParameter("@text", context.query);
            stUpdate.setParameter("@name", c.functionName);
            let retUpdate = stUpdate.run();
            console.dir(retUpdate);
            stUpdate.close();
        } else {
            let sqlInsert = "INSERT INTO master.routines (schema, name, type, definition, modified) VALUES (@schema, @name, 'FUNCTION', @text, GETUTCDATE())";
            let stInsert = new SQLStatement(sqlInsert, false);
            stInsert.setParameter("@schema", 'dbo');
            stInsert.setParameter("@name", c.functionName);
            stInsert.setParameter("@text", context.query);
            stInsert.run();
            stInsert.close();
        }

        context.broadcastQuery = true;
        context.results.push({
            resultTableName: "",
            rowCount: 0,
            executionPlan: {
                description: "CREATE FUNCTION"
            },
            perfs: {
                parser: 0,
                query: 0
            }
        } as SQLResult);
        return;
    }
    context.broadcastQuery = false;
    context.exitExecution = true;
    context.results.push({
        error: "Misformed CREATE FUNCTION query.",
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

}