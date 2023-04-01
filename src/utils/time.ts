import * as moment from 'moment-timezone';
import { Birthday } from '../database/database';

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

export function calcNextBirthday(day: number, month: number, timezone: string) {
    const now = moment.tz(timezone);
    const currentDay = now.date(), currentMonth = now.month() + 1, currentYear = now.year();

    let nextBirthdayYear: number;
    if (month < currentMonth || (month === currentMonth && day <= currentDay)) {
        nextBirthdayYear = currentYear + 1;
    } else {
        nextBirthdayYear = currentYear;
    }

    const dayString = day < 10 ? `0${day}` : day.toString();
    const monthString = month < 10 ? `0${month}` : month.toString();
    return moment.tz(`${nextBirthdayYear}-${monthString}-${dayString}T00:00:00.000`, timezone);
}

export function getReadableDateString(date: moment.Moment, includeTimezone: boolean) {
    if (includeTimezone) {
        const dateTimezone = date.tz();
        const cachedTimezone = timezones.find(tz => tz.value === dateTimezone);
        return `${date.format("MMMM Do, YYYY")} (${cachedTimezone?.printable ?? "unknown timezone"})`;
    } else {
        return date.format("MMMM Do, YYYY");
    }
}

export function getNextBirthdayFromList(birthdays: Birthday[]) {
    if (birthdays.length === 0) {
        return null;
    }

    const nowTimestamp = moment().valueOf();
    
    let next: Birthday | null = null;
    birthdays.forEach(bday => {
        if (next == null || (bday.nextBirthday >= nowTimestamp && bday.nextBirthday < next.nextBirthday)) {
            next = bday;
        }
    });

    return next;
}

export function getRelativeTimeString(past: moment.Moment, future: moment.Moment) {
    const a = moment(past), b = moment(future);

    const monthDiff = b.diff(a, "months");
    if (monthDiff > 0) {
        a.add(monthDiff, "months");
    }
    const dayDiff = b.diff(a, "days");
    if (dayDiff > 0) {
        a.add(dayDiff, "days");
    }
    const hourDiff = b.diff(a, "hours");
    if (hourDiff > 0) {
        a.add(hourDiff, "hours");
    }
    const minuteDiff = b.diff(a, "minutes");
    if (minuteDiff > 0) {
        a.add(minuteDiff, "minutes");
    }

    // could make this a lot prettier/smarter but it's easier to debug this way
    if (monthDiff > 0) {
        if (dayDiff > 0) return `${prepareTimeUnit('month', monthDiff)} and ${prepareTimeUnit('day', dayDiff)}`;
        return prepareTimeUnit('month', monthDiff);
    }
    if (dayDiff > 0) {
        if (dayDiff > 2 || (hourDiff === 0 && minuteDiff === 0)) return prepareTimeUnit('day', dayDiff);
        if (hourDiff > 0 && minuteDiff === 0) return `${prepareTimeUnit('day', dayDiff)} and ${prepareTimeUnit('hour', hourDiff)}`;
        if (hourDiff === 0 && minuteDiff > 0) return `${prepareTimeUnit('day', dayDiff)} and ${prepareTimeUnit('minute', minuteDiff)}`;
        return `${prepareTimeUnit('day', dayDiff)}, ${prepareTimeUnit('hour', hourDiff)} and ${prepareTimeUnit('minute', minuteDiff)}`;
    }
    if (hourDiff > 0) {
        if (minuteDiff > 0) return `${prepareTimeUnit('hour', hourDiff)} and ${prepareTimeUnit('minute', minuteDiff)}`;
        return prepareTimeUnit('hour', hourDiff);
    }
    if (minuteDiff > 0) {
        return prepareTimeUnit('minute', minuteDiff);
    }
    return "less than a minute";
}

function prepareTimeUnit(word: string, amount: number) {
    return `${amount} ${amount > 1 ? `${word}s` : word}`; 
}
