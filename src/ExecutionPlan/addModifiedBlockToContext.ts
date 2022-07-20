import {kModifiedBlockType, TExecutionContext} from "./TExecutionContext";


export function addModifiedBlockToContext(context: TExecutionContext, type: kModifiedBlockType, name: string, blockIndex: number) {
    let exists = context.modifiedBlocks.find((mb) => {
        return mb.type === type && mb.name.toUpperCase() === name.toUpperCase() && mb.blockIndex === blockIndex;
    });
    if (exists === undefined) {
        context.modifiedBlocks.push(
            {
                type: type,
                name: name,
                blockIndex: blockIndex
            }
        );
    }
}