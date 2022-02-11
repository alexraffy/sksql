



export function date_addMillisecond(d: Date, value: number) {
    return new Date(d.getTime() + Math.floor(value));
}