

import {rowHeaderSize, readTableDefinition, createNewContext, SKSQL, evaluate, ITableCursor,
    readFirst, TTableWalkInfo, kQueryExpressionOp, TBooleanResult, kBooleanResult, TQueryExpression} from "sksql";
import * as assert from "assert";
import {checkNoTempTables, runTest} from "./runTest";



export function evaluate1(db: SKSQL, next:()=>void) {
    console.log("TESTING EVALUATE...");

    let context = createNewContext("", "", undefined);
    assert(1 === evaluate(db, context, {kind: "TNumber", value: "1"} , [], undefined), "TNumber evaluate failure");
    assert(-1 === evaluate(db, context, {kind: "TNumber", value: "-1"} , [], undefined), "TNumber evaluate failure");
    assert(true === evaluate(db, context, {kind: "TBoolValue", value: true} , [], undefined), "TBoolValue evaluate failure");
    assert(false === evaluate(db, context, {kind: "TBoolValue", value: false} , [], undefined), "TBoolValue evaluate failure");
    assert("Hello" === evaluate(db, context, {kind: "TString", value: "'Hello'"} , [], undefined), "TString evaluate failure");
    assert(undefined === evaluate(db, context, {kind: "TNull"} , [], undefined), "TNull evaluate failure");

    runTest(db, "DROP TABLE t1; CREATE TABLE t1(a int, b VARCHAR(50));", false, false, undefined );
    runTest(db, "INSERT INTO t1(a, b) VALUES (10, 'Hello');", false, false, undefined);

    let t1 = db.getTable("t1");
    let t1Def = readTableDefinition(t1.data);
    let eofCursor: ITableCursor = { rowLength: 0, blockIndex: -1, tableIndex: -1, offset: -1};
    let firstRow = readFirst(t1, t1Def);

    let bUnknownColumnThrow = false;
    try {
        evaluate(db, context, {kind: "TColumn", column: "a", table: "t1"}, [], undefined);
    } catch (e) {
        bUnknownColumnThrow = true;
    }
    assert(true === bUnknownColumnThrow, "evaluate unknown TColumn should throw" );

    let walkInfo : TTableWalkInfo = {
        table: t1,
        name: "t1",
        alias: "t1",
        rowLength: firstRow.rowLength + rowHeaderSize,
        cursor: eofCursor,
        def: t1Def
    }
    assert(undefined === evaluate(db, context, {kind: "TColumn", column: "a", table: "t1"}, [walkInfo], undefined), "evaluate TColumn with a EOF cursor should return undefined");

    walkInfo.cursor = firstRow;
    assert(10 === evaluate(db, context, {kind: "TColumn", column: "a", table: "t1"}, [walkInfo], undefined), "evaluate TColumn with a valid cursor should return a value");

    assert(2 === evaluate(db, context, {kind: "TQueryExpression", value: {
            op: kQueryExpressionOp.add,
            left: {kind: "TNumber", value: "1"},
            right: {kind: "TNumber", value: "1"}
        }
    }, [walkInfo], undefined), "evaluate TQueryExpression fail");

    assert(0 === evaluate(db, context, {kind: "TQueryExpression", value: {
            op: kQueryExpressionOp.minus,
            left: {kind: "TNumber", value: "1"},
            right: {kind: "TNumber", value: "1"}
        }
    }, [walkInfo], undefined), "evaluate TQueryExpression fail");

    assert(100 === evaluate(db, context, {kind: "TQueryExpression", value: {
            op: kQueryExpressionOp.mul,
            left: {kind: "TNumber", value: "10"},
            right: {kind: "TNumber", value: "10"}
        }
    }, [walkInfo], undefined), "evaluate TQueryExpression fail");

    assert(3 === evaluate(db, context, {kind: "TQueryExpression", value: {
            op: kQueryExpressionOp.div,
            left: {kind: "TNumber", value: "9"},
            right: {kind: "TNumber", value: "3"}
        }
    }, [walkInfo], undefined), "evaluate TQueryExpression fail");

    assert(0 === evaluate(db, context, {kind: "TQueryExpression", value: {
            op: kQueryExpressionOp.modulo,
            left: {kind: "TNumber", value: "10"},
            right: {kind: "TNumber", value: "5"}
        }
    }, [walkInfo], undefined), "evaluate TQueryExpression fail");

    assert(kBooleanResult.isTrue === (evaluate(db, context, {kind: "TQueryExpression", value: {
            op: kQueryExpressionOp.eq,
            left: {kind: "TNumber", value: "10"},
            right: {kind: "TNumber", value: "10"}
        }
    }, [walkInfo], undefined) as TBooleanResult).value, "evaluate TQueryExpression fail");

    assert(kBooleanResult.isFalse === (evaluate(db, context, {kind: "TQueryExpression", value: {
            op: kQueryExpressionOp.dif,
            left: {kind: "TNumber", value: "10"},
            right: {kind: "TNumber", value: "10"}
        }
    }, [walkInfo], undefined) as TBooleanResult).value, "evaluate TQueryExpression fail");

    assert(kBooleanResult.isTrue === (evaluate(db, context, {kind: "TQueryExpression", value: {
            op: kQueryExpressionOp.inf,
            left: {kind: "TNumber", value: "5"},
            right: {kind: "TNumber", value: "10"}
        }
    }, [walkInfo], undefined) as TBooleanResult).value, "evaluate TQueryExpression fail");

    assert(kBooleanResult.isFalse === (evaluate(db, context, {kind: "TQueryExpression", value: {
            op: kQueryExpressionOp.inf,
            left: {kind: "TNumber", value: "10"},
            right: {kind: "TNumber", value: "10"}
        }
    }, [walkInfo], undefined) as TBooleanResult).value, "evaluate TQueryExpression fail");

    assert(kBooleanResult.isTrue === (evaluate(db, context, {kind: "TQueryExpression", value: {
            op: kQueryExpressionOp.infEq,
            left: {kind: "TNumber", value: "5"},
            right: {kind: "TNumber", value: "10"}
        }
    }, [walkInfo], undefined) as TBooleanResult).value, "evaluate TQueryExpression fail");

    assert(kBooleanResult.isTrue === (evaluate(db, context, {kind: "TQueryExpression", value: {
            op: kQueryExpressionOp.infEq,
            left: {kind: "TNumber", value: "10"},
            right: {kind: "TNumber", value: "10"}
        }
    }, [walkInfo], undefined) as TBooleanResult).value, "evaluate TQueryExpression fail");

    assert(kBooleanResult.isFalse === (evaluate(db, context, {kind: "TQueryExpression", value: {
            op: kQueryExpressionOp.infEq,
            left: {kind: "TNumber", value: "12"},
            right: {kind: "TNumber", value: "10"}
        }
    }, [walkInfo], undefined) as TBooleanResult).value, "evaluate TQueryExpression fail");

    let true_and_true: TQueryExpression = {
        kind: "TQueryExpression",
        value: {
            op: kQueryExpressionOp.boolAnd,
            left: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TNumber", value: "1"},
                    right: {kind: "TNumber", value: "1"}
                }
            } as TQueryExpression,
            right: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TNumber", value: "1"},
                    right: {kind: "TNumber", value: "1"}
                }
            }
        }
    };

    assert(kBooleanResult.isTrue === (evaluate(db, context, true_and_true, [walkInfo], undefined) as TBooleanResult).value, "evaluate TQueryExpression fail");

    let true_and_false: TQueryExpression = {
        kind: "TQueryExpression",
        value: {
            op: kQueryExpressionOp.boolAnd,
            left: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TNumber", value: "1"},
                    right: {kind: "TNumber", value: "1"}
                }
            } as TQueryExpression,
            right: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TNumber", value: "1"},
                    right: {kind: "TNumber", value: "2"}
                }
            }
        }
    };

    assert(kBooleanResult.isFalse === (evaluate(db, context, true_and_false, [walkInfo], undefined) as TBooleanResult).value, "evaluate TQueryExpression fail");


    let false_and_true: TQueryExpression = {
        kind: "TQueryExpression",
        value: {
            op: kQueryExpressionOp.boolAnd,
            left: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TNumber", value: "1"},
                    right: {kind: "TNumber", value: "2"}
                }
            } as TQueryExpression,
            right: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TNumber", value: "1"},
                    right: {kind: "TNumber", value: "1"}
                }
            }
        }
    };

    assert(kBooleanResult.isFalse === (evaluate(db, context, false_and_true, [walkInfo], undefined) as TBooleanResult).value, "evaluate TQueryExpression fail");


    let false_and_false: TQueryExpression = {
        kind: "TQueryExpression",
        value: {
            op: kQueryExpressionOp.boolAnd,
            left: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TNumber", value: "2"},
                    right: {kind: "TNumber", value: "1"}
                }
            } as TQueryExpression,
            right: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TNumber", value: "1"},
                    right: {kind: "TNumber", value: "2"}
                }
            }
        }
    };

    assert(kBooleanResult.isFalse === (evaluate(db, context, false_and_false, [walkInfo], undefined) as TBooleanResult).value, "evaluate TQueryExpression fail");

    walkInfo.cursor = eofCursor;
    let true_and_unknown: TQueryExpression = {
        kind: "TQueryExpression",
        value: {
            op: kQueryExpressionOp.boolAnd,
            left: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TNumber", value: "1"},
                    right: {kind: "TNumber", value: "1"}
                }
            } as TQueryExpression,
            right: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TColumn", column: "a", table: "t1"},
                    right: {kind: "TNumber", value: "2"}
                }
            }
        }
    };

    assert(kBooleanResult.isUnknown === (evaluate(db, context, true_and_unknown, [walkInfo], undefined) as TBooleanResult).value, "evaluate TQueryExpression fail");

    let unknown_and_true: TQueryExpression = {
        kind: "TQueryExpression",
        value: {
            op: kQueryExpressionOp.boolAnd,
            left: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TColumn", column: "a", table: "t1"},
                    right: {kind: "TNumber", value: "1"}
                }
            } as TQueryExpression,
            right: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TNumber", value: "2"},
                    right: {kind: "TNumber", value: "2"}
                }
            }
        }
    };

    assert(kBooleanResult.isUnknown === (evaluate(db, context, unknown_and_true, [walkInfo], undefined) as TBooleanResult).value, "evaluate TQueryExpression fail");

    let false_and_unknown: TQueryExpression = {
        kind: "TQueryExpression",
        value: {
            op: kQueryExpressionOp.boolAnd,
            left: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TNumber", value: "2"},
                    right: {kind: "TNumber", value: "1"}
                }
            } as TQueryExpression,
            right: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TColumn", column: "a", table: "t1"},
                    right: {kind: "TNumber", value: "2"}
                }
            }
        }
    };

    assert(kBooleanResult.isFalse === (evaluate(db, context, false_and_unknown, [walkInfo], undefined) as TBooleanResult).value, "evaluate TQueryExpression fail");


    let unknown_and_false: TQueryExpression = {
        kind: "TQueryExpression",
        value: {
            op: kQueryExpressionOp.boolAnd,
            left: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TColumn", column: "a", table: "t1"},
                    right: {kind: "TNumber", value: "1"}
                }
            } as TQueryExpression,
            right: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TNumber", value: "2"},
                    right: {kind: "TNumber", value: "1"}
                }
            }
        }
    };

    assert(kBooleanResult.isFalse === (evaluate(db, context, unknown_and_false, [walkInfo], undefined) as TBooleanResult).value, "evaluate TQueryExpression fail");



    let true_or_true: TQueryExpression = {
        kind: "TQueryExpression",
        value: {
            op: kQueryExpressionOp.boolOR,
            left: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TNumber", value: "1"},
                    right: {kind: "TNumber", value: "1"}
                }
            } as TQueryExpression,
            right: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TNumber", value: "1"},
                    right: {kind: "TNumber", value: "1"}
                }
            }
        }
    };

    assert(kBooleanResult.isTrue === (evaluate(db, context, true_or_true, [walkInfo], undefined) as TBooleanResult).value, "evaluate TQueryExpression fail");


    let true_or_false: TQueryExpression = {
        kind: "TQueryExpression",
        value: {
            op: kQueryExpressionOp.boolOR,
            left: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TNumber", value: "1"},
                    right: {kind: "TNumber", value: "1"}
                }
            } as TQueryExpression,
            right: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TNumber", value: "1"},
                    right: {kind: "TNumber", value: "2"}
                }
            }
        }
    };

    assert(kBooleanResult.isTrue === (evaluate(db, context, true_or_false, [walkInfo], undefined) as TBooleanResult).value, "evaluate TQueryExpression fail");


    let false_or_true: TQueryExpression = {
        kind: "TQueryExpression",
        value: {
            op: kQueryExpressionOp.boolOR,
            left: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TNumber", value: "2"},
                    right: {kind: "TNumber", value: "1"}
                }
            } as TQueryExpression,
            right: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TNumber", value: "1"},
                    right: {kind: "TNumber", value: "1"}
                }
            }
        }
    };

    assert(kBooleanResult.isTrue === (evaluate(db, context, false_or_true, [walkInfo], undefined) as TBooleanResult).value, "evaluate TQueryExpression fail");


    let true_or_unknown: TQueryExpression = {
        kind: "TQueryExpression",
        value: {
            op: kQueryExpressionOp.boolOR,
            left: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TNumber", value: "1"},
                    right: {kind: "TNumber", value: "1"}
                }
            } as TQueryExpression,
            right: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TColumn", column: "a", table: "t1"},
                    right: {kind: "TNumber", value: "2"}
                }
            }
        }
    };

    assert(kBooleanResult.isTrue === (evaluate(db, context, true_or_unknown, [walkInfo], undefined) as TBooleanResult).value, "evaluate TQueryExpression fail");



    let unknown_or_true: TQueryExpression = {
        kind: "TQueryExpression",
        value: {
            op: kQueryExpressionOp.boolOR,
            left: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TColumn", column: "a", table: "t1"},
                    right: {kind: "TNumber", value: "1"}
                }
            } as TQueryExpression,
            right: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TNumber", value: "2"},
                    right: {kind: "TNumber", value: "2"}
                }
            }
        }
    };

    assert(kBooleanResult.isTrue === (evaluate(db, context, unknown_or_true, [walkInfo], undefined) as TBooleanResult).value, "evaluate TQueryExpression fail");


    let false_or_unknown: TQueryExpression = {
        kind: "TQueryExpression",
        value: {
            op: kQueryExpressionOp.boolOR,
            left: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TNumber", value: "2"},
                    right: {kind: "TNumber", value: "1"}
                }
            } as TQueryExpression,
            right: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TColumn", column: "a", table: "t1"},
                    right: {kind: "TNumber", value: "2"}
                }
            }
        }
    };

    assert(kBooleanResult.isUnknown === (evaluate(db, context, false_or_unknown, [walkInfo], undefined) as TBooleanResult).value, "evaluate TQueryExpression fail");


    let unknown_or_false: TQueryExpression = {
        kind: "TQueryExpression",
        value: {
            op: kQueryExpressionOp.boolOR,
            left: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TColumn", column: "a", table: "t1"},
                    right: {kind: "TNumber", value: "1"}
                }
            } as TQueryExpression,
            right: {
                kind: "TQueryExpression",
                value: {
                    op: kQueryExpressionOp.eq,
                    left: {kind: "TNumber", value: "2"},
                    right: {kind: "TNumber", value: "1"}
                }
            }
        }
    };

    assert(kBooleanResult.isUnknown === (evaluate(db, context, unknown_or_false, [walkInfo], undefined) as TBooleanResult).value, "evaluate TQueryExpression fail");

    checkNoTempTables(db);

    next();
}