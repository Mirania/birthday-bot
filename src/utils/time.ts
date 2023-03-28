import * as moment from 'moment-timezone';

const timezones = moment.tz.names().map(name => {
    const printable = name.replace(/\//g, " / ").replace(/_/g, " ");
    return { value: name, printable, lowercased: printable.toLowerCase() };
});

export function getTimezones() {
    return timezones;
}

export function getCurrentYear() {
    return new Date().getFullYear();
}

export function getNextBirthday(day: number, month: number, timezone: string) {
    const dayString = day < 10 ? `0${day}` : day.toString();
    const monthString = month < 10 ? `0${month}` : month.toString();
    return moment.tz(`${getCurrentYear() + 1}-${monthString}-${dayString}T00:00:00.000`, timezone);
}

export function getReadableDateString(date: moment.Moment) {
    const dateTimezone = date.tz();
    const cachedTimezone = timezones.find(tz => tz.value === dateTimezone);
    return `${date.format("MMMM Do, YYYY")} (${cachedTimezone?.printable ?? "unknown timezone"})`;
}
