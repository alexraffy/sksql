import {SKSQL, TAuthSession, TDBEventsDelegate} from "sksql";
import {runTest} from "./runTest";


let expectDisconnection = false;
let currentStep = 1;
export function remote1(db: SKSQL, next:()=>void) {
    console.log("TESTING REMOTE...");
    const delegate: TDBEventsDelegate = {
        authRequired(db: SKSQL, databaseHashId: string): TAuthSession {
            return { token: "", name: "SKSQL Test Suite", valid: true};
        },
        connectionLost(db: SKSQL, dbHashId: string) {
            if (expectDisconnection === false) {
                throw "SKSQL Remote Connection WAS LOST.";
            }
            expectDisconnection = false;
        },
        connectionError(db: SKSQL, dbHashId: string, error: string) {
            console.log("SKSQL Remote Connection ERROR: " + error);
            throw "SKSQL Remote Connection ERROR: " + error;
        },
        ready(db: SKSQL, dbHashId: string) {
            if (currentStep === 1) {
                remoteTest1(db, dbHashId, next);
            } else {
                remoteTest2(db, dbHashId, next);
            }
        }
    }
    db.connectToDatabase("W8eykmOAgBqN", delegate);
}

function remoteTest1(db: SKSQL, dbHashId: string, next: ()=> void) {
    runTest(db, "DROP TABLE test1; CREATE TABLE test1(x INTEGER, y INTEGER); INSERT INTO test1 VALUES(10, 30); INSERT INTO test1 VALUES(20, 40);", false, false, undefined);

    expectDisconnection = true;
    db.disconnect(dbHashId);
    currentStep = 2;
    runTest(db, "DROP TABLE test1;", false, false, undefined);
    remote1(db, next);
}

function remoteTest2(db: SKSQL, dbHashId: string, next: ()=> void) {
    runTest(db, "SELECT * FROM test1", false, false, [[10, 30], [20, 40]]);
    expectDisconnection = true;
    db.disconnect(dbHashId);
    runTest(db, "DROP TABLE test1;", false, false, undefined);
    next();
}
