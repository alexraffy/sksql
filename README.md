
SKSQL is a database engine for the web and node.js written in Typescript.

It has a T-SQL inspired syntax with support for functions and procedures. 

It uses as storage on the client, Shared Array Buffers. Allowing for fast communication between the main web page and web workers.

It can be used stand-alone as a SQL engine or with a server allowing for persistence and replication to other connected clients.



## What is it for
- Single Page Applications
- Single tenant small databases 10-100MB
- Storing session data
- Do small calculations on a web worker
- Store the document/data the user is editing
- Facilitate “multiplayer” feature by broadcasting the queries the web app is running. 

## Data closer to the code
Connected clients receive the whole database for fast selection.

SQL or T-SQL queries that modify data are sent after execution to the server and dispatched to other connected clients. 

The server runs in a container for that specific document and shutdowns automatically after a set amount of minutes of inactivity.

Server repo: https://github.com/alexraffy/skserver

Sandbox: https://sksql.com/sandbox/local

### Quick Example

SQL_STRING = 
	
	CREATE TABLE pirates (
		id uint32 IDENTITY(1,1),
		name VARCHAR(255),
		country VARCHAR(50),
		dob date,
		death date,
		bounty numeric(12,0)
	);
	INSERT INTO pirates (name, country, dob, death, bounty) VALUES
	('Calico Jack John Rackham', 'England', '1682-12-26', '1720-11-18', 125000),
	('Anne Bonny', 'Ireland', '1697-03-08', '1721-04-00', 80000),
	('Bartholomew Roberts', 'Wales', '1682-05-17', '1722-02-10', 800000),
	('Blackbeard (Edward Teach)', 'England', '1680-00-00', '1718-11-22', 900000);



Typescript
	
	import * as sksql from "sksql";
	let db = new sksql.SKSQL();
	let pirates = new sksql.SQLStatement(db, SQL_STRING);
	pirates.runSync();
	
	let st = new sksql.SQLStatement(db, "SELECT name, country FROM pirates WHERE country IN ('Wales', 'Ireland')");
	let res = st.runSync();
	
	interface IPirateInfo {
		name: string;
		country: string;
	}
	let result = res.getRows<IPirateInfo>();
	// result = [{name: "Anne Bonny", country: "Ireland"}, {name: "Bartholomew Roberts", country: "Wales"}]
	


### Webworker
 
	
	import {SKSQL, SQLStatement} from "sksql";
	import * as fs from "fs";
	
	let db = new SKSQL();
	let sksqlData = fs.readFileSync("../dist/sksql.min.js").toString();
	db.initWorkerPool(4, sksqlData);
	
	let st = new SQLStatement(db, "SELECT name, country FROM pirates WHERE country IN ('Wales', 'Ireland')");
	st.runOnWebWorker().then((result: SQLResult) => {
		let rows = result.getRows();
		
	});

### Spawn a test server (see skserver https://github.com/alexraffy/skserver)
    podman run --detach --rm=true --network="host" --volume=PATH:/data --env SKWORKER_PORT=32000 skeletapp/skserver:latest node build/main.js
    
    or with docker

    docker run --detach --rm=true --network="host" --volume=PATH:/data --env SKWORKER_PORT=32000 skeletapp/skserver:latest node build/main.js

### Connect to server:
	
	import {SKSQL, SQLStatement} from "sksql";

	// node-js only
	import {WebSocket} from 'ws';
	//@ts-ignore
	global["WebSocket"] = WebSocket;

	let db = new SKSQL();
	let token = "";
	let ok = await db.connectAsync("ws://localhost:32000", token, "ClientRW");
    // we have received the data, we can select data locally
	let sql = new SQLStatement(db, "SELECT * from table");
	let result = sql.runSync();	
	
	// this command will be executed locally and then sent to the server and to all connected clients
	let sql2 = new SQLStatement(db, "INSERT INTO table(a) VALUES(@a);");
	sql2.setParameter("@a", "Hello");
	sql2.runSync();

# Installation

NodeJS:

	npm install sksql

Building from source:
	
	git clone https://github.com/alexraffy/sksql.git sksql
	cd sksql
	npm run sk-00-runall
	

COLUMN TYPES SUPPORTED

Integers:
	INT, UINT8, UINT16, UINT32, UINT64, INT8, INT16, INT32, INT64
Numeric:
	NUMERIC(PRECISION, SCALE)
Boolean:
	BOOL
UTF-8 Strings:
	VARCHAR(DIMENSION)

SUPPORTED SQL STATEMENTS

SQL statements supported
 - CREATE TABLE:
    COLUMN_DEF IDENTITY (SEED, INCREMENT),
    COLUMN_DEF NOT NULL/NULL
    COLUMN_DEF DEFAULT EXPRESSION
    PRIMARY KEY [CONSTRAINT_NAME] (COLUMN,...)
    FOREIGN KEY [CONSTRAINT_NAME] (COLUMN ASC|DESC, ...) REFERENCES 		{TABLENAME} (FOREIGN_COLUMN,...)
    CHECK [CONSTRAINT_NAME] (BOOLEAN EXPRESSION)

 - INSERT:
    INSERT INTO {TABLE} (COLUMNS) VALUES (...),...
    INSERT INTO {TABLE} VALUES(COLUMN...),...

 - UPDATE:
    UPDATE [TOP(EXPRESSION)] SET COLUMN = EXPRESSION FROM {TABLE} [WHERE CLAUSE]

 - DELETE:
    DELETE [TOP(EXPRESSION)] FROM {TABLE} [WHERE CLAUSE]

 - SELECT:
    SELECT  
        COLUMN | EXPRESSION [AS ALIAS],...
    FROM
        TABLE1, [JOIN | LEFT JOIN | RIGHT JOIN] TABLE2...
    [WHERE BOOLEAN_EXPRESSION]
    [ORDER BY COLUMN_A ASC | DESC, ...]
    [GROUP BY COLUMN_A ASC | DESC, ...]
    [HAVING EXPRESSION]

T-SQL Statements
 - CREATE PROCEDURE
 - CREATE FUNCTION
 - DECLARE
 - IF, WHILE
 - SET
 - EXECUTE
 - RETURN