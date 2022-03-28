



export function numericMulOverflow(x: number, y: number): boolean {
    let xHi, xLo, yHi, yLo : number;
    xHi = x>>32 >>> 0;
    yHi = y>>32 >>> 0;
    // if( xHi*yHi > 1 ) return true;
    xLo = x & 0xffffffff;
    yLo = y & 0xffffffff;
    if( (xHi*yLo + yHi*xLo + (xLo*yLo>>32>>>0))>0xffffffff ) return true;
    return false;
}