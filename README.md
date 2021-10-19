Title: readme
Author: 

SKSQL is a SQL database for the web and node.js written in Typescript.


It uses as storage on the client, Shared Array Buffers. Allowing for fast communication between the main web page and web workers.
[SharedArrayBuffer - JavaScript | MDN (mozilla.org) ]

It supports persistence and replication through web-socket. 
A client can connect to a SKSQL Server and all INSERT, UPDATE and DELETE statements are then sent to the server, written to disk and broadcasted to other connected clients.


Sandbox: https://sksql.com/sandbox 
Multiplayer chat: https://sksql.com/chat

Quick Example

pirates.sql
	
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
	
	let pirates = new sksql.SQLStatement(require("pirates.sql"));
	pirates.run();
	
	let st = new sksql.SQLStatement("SELECT name, country FROM pirates WHERE country IN ('Wales', 'Ireland')");
	let result = st.run(sksql.kResultType.JSON);
	
	// result = [{name: "Anne Bonny", country: "Ireland"}, {name: "Bartholomew Roberts", country: "Wales"}]
	


Webworker

Example: 
	
	let st = new sksql.SQLStatement("SELECT name, country FROM pirates WHERE country IN ('Wales', 'Ireland')");
	st.runOnWebWorker().then((tempTable: string) => {
		let result = sksql.readTableAsJSON(tempTable);
		
	});




Installation

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
