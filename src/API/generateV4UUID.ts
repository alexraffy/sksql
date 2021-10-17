


export function generateV4UUID(){
    let d = new Date().getTime();
    // @ts-ignore
    if (global["window"] !== undefined) {
        // @ts-ignore
        if (window.performance && typeof window.performance.now === "function") {
            // @ts-ignore
            d += window.performance.now(); //use high-precision timer if available
        }
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}