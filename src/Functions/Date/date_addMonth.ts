
// add value number of months to a Javascript Date
export function date_addMonth(d: Date, value: number) {
    let ret = new Date(d.getTime());
    const dayOfMonth = d.getDate();
    const endOfDesiredMonth = new Date(d.getTime())
    endOfDesiredMonth.setMonth(d.getMonth() + Math.floor(value) + 1, 0);
    const daysInMonth = endOfDesiredMonth.getDate();
    if (dayOfMonth >= daysInMonth) {
        return endOfDesiredMonth;
    } else {
        ret.setFullYear(
            endOfDesiredMonth.getFullYear(),
            endOfDesiredMonth.getMonth(),
            dayOfMonth
        )
    }
}