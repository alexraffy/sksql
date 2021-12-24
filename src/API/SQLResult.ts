

export interface SQLResult {
    error?: string;
    rowCount: number;
    resultTableName: string;
    executionPlan: {
        description: string;
    }
    perfs: {
        parser: number;
        query: number;
    }
}