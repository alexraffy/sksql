import {TExecutionContext} from "./TExecutionContext";


export function addModifiedBlocksToContext(toContext: TExecutionContext, fromContext: TExecutionContext) {
    for (let i = 0; i < fromContext.modifiedBlocks.length; i++) {
        const fmb = fromContext.modifiedBlocks[i];
        let exists = toContext.modifiedBlocks.find((mb) => {
            return mb.type === fmb.type && mb.name.toUpperCase() === fmb.name.toUpperCase() && mb.blockIndex === fmb.blockIndex;
        });
        if (exists === undefined) {
            toContext.modifiedBlocks.push(
                {
                    type: fmb.type,
                    name: fmb.name,
                    blockIndex: fmb.blockIndex
                }
            );
        }
    }
}