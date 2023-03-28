import { getTimezones } from "./time";

export function validateDay(month: number, input?: number): { isValid: boolean, badInput?: string } {
    if (!input) {
        return { isValid: false, badInput: "<none>" };
    }

    if (input <= daysPerMonth[month - 1]) {
        return { isValid: true };
    } else {
        return { isValid: false, badInput: input.toString() };
    }
}

const daysPerMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function validateTimezone(input?: string): { isValid: boolean, badInput?: string } {
    if (!input) {
        return { isValid: false, badInput: "<none>" };
    }

    const sanitized = input.trim();
    if (getTimezones().findIndex(tz => tz.value === sanitized) > -1) {
        return { isValid: true };
    } else {
        return { isValid: false, badInput: sanitized };
    }
}