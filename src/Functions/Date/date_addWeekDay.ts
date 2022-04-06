

// add value number of working days to a Javascript Date
export function date_addWeekDay(d: Date, value: number) {
    const date = new Date(d.getTime());
    const startedOnWeekend = [6,0].includes(d.getDay())
    const amount = Math.floor(value);

    if (isNaN(amount)) return new Date(NaN)

    const hours = date.getHours();
    const sign = amount < 0 ? -1 : 1;
    const fullWeeks = Math.floor(amount / 5);

    date.setDate(date.getDate() + fullWeeks * 7)

    let restDays = Math.abs(amount % 5)

    while (restDays > 0) {
        date.setDate(date.getDate() + sign)
        if (![6,0].includes(d.getDay())) restDays -= 1
    }

    if (startedOnWeekend && [6,0].includes(date.getDay()) && amount !== 0) {
        if (date.getDay() === 6) date.setDate(date.getDate() + (sign < 0 ? 2 : -1))
        if (date.getDay() === 0) date.setDate(date.getDate() + (sign < 0 ? 1 : -2))
    }

    date.setHours(hours)
    return date
}