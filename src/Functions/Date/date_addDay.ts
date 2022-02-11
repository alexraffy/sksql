


export function date_addDay(d: Date, value: number) {
    let ret = new Date(d.getTime());
    ret.setDate(ret.getDate() + Math.floor(value));
    return ret;
}