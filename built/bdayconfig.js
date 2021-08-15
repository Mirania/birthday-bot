"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.genderConfirmer = exports.genderParser = exports.timeConfirmer = exports.bdayUtc = exports.timeParser = exports.dateConfirmer = exports.dateParser = void 0;
const utils = require("./utils");
const data_1 = require("./data");
const moment = require("moment-timezone");
function dateParser(message) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = data_1.getUser(message);
        const dm = yield message.author.createDM();
        const parsed = parseDate(message.content);
        if (!parsed.valid) {
            utils.send(dm, "Sorry, I didn't quite understand that. Could you please try again?");
            return;
        }
        user.day = parsed.day;
        user.month = parsed.month;
        utils.send(dm, `Okay, so it's ${numberToMonth(parsed.month)} ${parsed.day}?` +
            "\n" +
            "Please answer yes or no to confirm.");
        user.state = data_1.State.ConfirmingDate;
    });
}
exports.dateParser = dateParser;
function dateConfirmer(message) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = data_1.getUser(message);
        const dm = yield message.author.createDM();
        const parsed = parseYesNo(message.content);
        if (!parsed.valid) {
            utils.send(dm, "Sorry, I didn't quite understand that. Could you please try again?");
            return;
        }
        if (parsed.answer) {
            utils.send(dm, "Good! Now, I need to know your timezone.\n" +
                "What time is it **right now** where you live?\n" +
                "\n" +
                "Please answer in a format like `14:25` or `5:40 pm`.");
            user.state = data_1.State.AwaitingTime;
        }
        else {
            utils.send(dm, "What's your birth **day** and **month**?\n" +
                "\n" +
                "Please answer in a format like `30/1` or `July 20`.");
            user.state = data_1.State.AwaitingDate;
        }
    });
}
exports.dateConfirmer = dateConfirmer;
function timeParser(message) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = data_1.getUser(message);
        const dm = yield message.author.createDM();
        const parsed = parseTime(message.content);
        if (!parsed.valid) {
            utils.send(dm, "Sorry, I didn't quite understand that. Could you please try again?");
            return;
        }
        const userTime = moment.tz(parsed.tz).format(parsed.ampm ? "h:mm A" : "H:mm");
        user.tz = parsed.tz.replace(/_/g, " ");
        const utc = bdayUtc(user);
        user.utcStart = utc.start;
        user.utcEnd = utc.end;
        utils.send(dm, `It seems you're in the **${user.tz}** timezone. It's ${userTime} there right now.` +
            "\n" +
            "Please answer yes or no to confirm.");
        user.state = data_1.State.ConfirmingTime;
    });
}
exports.timeParser = timeParser;
/**
 * Gets the unix time of a birthday for the current year.
 */
function bdayUtc(user) {
    const bdayStr = `${moment().year()}-${pad(user.month)}-${pad(user.day)} 00:00`;
    const bdayDate = moment.tz(bdayStr, user.tz.replace(/ /g, "_"));
    return { start: bdayDate.utc().valueOf(), end: bdayDate.add(1, "day").utc().valueOf() };
}
exports.bdayUtc = bdayUtc;
function timeConfirmer(message) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = data_1.getUser(message);
        const dm = yield message.author.createDM();
        const parsed = parseYesNo(message.content);
        if (!parsed.valid) {
            utils.send(dm, "Sorry, I didn't quite understand that. Could you please try again?");
            return;
        }
        if (parsed.answer) {
            utils.send(dm, "Finally, what's your gender?\n" +
                "I accept the answers **male**, **female** and **other**.\n");
            user.state = data_1.State.AwaitingGender;
        }
        else {
            utils.send(dm, "I need to know your timezone.\n" +
                "\n" +
                "Please answer in a format like `14:25` or `5:40 pm`.");
            user.state = data_1.State.AwaitingTime;
        }
    });
}
exports.timeConfirmer = timeConfirmer;
function genderParser(message) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = data_1.getUser(message);
        const dm = yield message.author.createDM();
        const parsed = parseGender(message.content);
        if (!parsed.valid) {
            utils.send(dm, "Sorry, I didn't quite understand that. Could you please try again?");
            return;
        }
        user.gender = parsed.gender;
        utils.send(dm, `Okay, so your gender is ${parsed.gender}?` +
            "\n" +
            "Please answer yes or no to confirm.");
        user.state = data_1.State.ConfirmingGender;
    });
}
exports.genderParser = genderParser;
function genderConfirmer(message) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = data_1.getUser(message);
        const dm = yield message.author.createDM();
        const parsed = parseYesNo(message.content);
        if (!parsed.valid) {
            utils.send(dm, "Sorry, I didn't quite understand that. Could you please try again?");
            return;
        }
        if (parsed.answer) {
            utils.send(dm, "You're all set! I'll try to notify everyone when it's your birthday.");
            user.state = data_1.State.None;
        }
        else {
            utils.send(dm, "What's your gender?\n" +
                "I accept the answers **male**, **female** and **other**.\n");
            user.state = data_1.State.AwaitingGender;
        }
    });
}
exports.genderConfirmer = genderConfirmer;
// valid formats: 30/1, Jan 30, January 30, January 30th
function parseDate(rawText) {
    let text = rawText.trim().toLowerCase();
    let day, month;
    if (text.includes("/")) {
        let split = text.split("/").map(Number);
        if (split.length !== 2)
            return { valid: false };
        day = split[0];
        month = split[1];
    }
    else {
        let split = text.split(" ").filter(s => s !== " ");
        if (split.length !== 2)
            return { valid: false };
        day = Number(split[1].replace(/(st|nd|rd|th)/g, ""));
        month = monthToNumber(split[0]);
    }
    if (isNaN(day) || isNaN(month))
        return { valid: false };
    if (day < 1 || month < 1 || month > 12 || day > daysInMonth(month))
        return { valid: false };
    return { valid: true, day, month };
}
// valid formats: 12:34, 5:40 pm
function parseTime(rawText) {
    let text = rawText.trim().toLowerCase();
    let hour, minute, ampm;
    if (text.includes("pm") || text.includes("am")) {
        const isPM = text.includes("pm");
        let split = text.replace(/( |am|pm)/g, "").split(":").map(s => Math.floor(Number(s)));
        if (split.length !== 2)
            return { valid: false };
        hour = ampmTo24Hours(split[0], isPM);
        minute = split[1];
        ampm = true;
    }
    else {
        let split = text.replace(/ /g, "").split(":").map(s => Math.floor(Number(s)));
        if (split.length !== 2)
            return { valid: false };
        hour = split[0];
        minute = split[1];
        ampm = false;
    }
    if (isNaN(hour) || isNaN(minute))
        return { valid: false };
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59)
        return { valid: false };
    const tz = getClosestTimezone(hour, minute);
    return { valid: true, tz, ampm };
}
const pad = (value) => value < 10 ? `0${value}` : value.toString();
const isSameDay = (now, hour, minute) => Math.abs((now.hour() + now.minute() / 60) - (hour + minute / 60)) < 12;
function getClosestTimezone(hour, minute) {
    const now = moment(), nowUtc = now.utc().valueOf();
    const dateStr = `${now.year()}-${pad(now.month() + 1)}-${pad(now.date())} ${pad(hour)}:${pad(minute)}`;
    let closestTz, closestUtc = Infinity;
    for (const tz in data_1.getTimezoneOffsets()) {
        let date = moment.tz(dateStr, tz);
        if (!isSameDay(now, hour, minute)) { // cannot compare the same day
            if (hour > now.hour())
                date = date.subtract(1, "day"); // they are in the previous day
            else
                date = date.add(1, "day"); // they are in the next day
        }
        let utc = date.utc().valueOf();
        let diff = Math.abs(nowUtc - utc);
        if (diff < closestUtc) {
            closestUtc = diff;
            closestTz = tz;
        }
    }
    return closestTz;
}
// valid formats: anything goes lol
function parseGender(rawText) {
    let text = rawText.trim().toLowerCase();
    switch (text) {
        case "male":
        case "m": return { valid: true, gender: data_1.Gender.Male };
        case "female":
        case "f": return { valid: true, gender: data_1.Gender.Female };
        default: return { valid: true, gender: data_1.Gender.Other };
    }
}
function parseYesNo(rawText) {
    let text = rawText.trim().toLowerCase();
    switch (text) {
        case "yes":
        case "y": return { valid: true, answer: true };
        case "no":
        case "n": return { valid: true, answer: false };
        default: return { valid: false };
    }
}
function ampmTo24Hours(hour, isPM) {
    if (hour === 0)
        return undefined;
    if (hour === 12)
        return isPM ? 12 : 0;
    return isPM ? hour - 12 : hour;
}
function monthToNumber(month) {
    switch (month) {
        case "january":
        case "jan": return 1;
        case "february":
        case "feb": return 2;
        case "march":
        case "mar": return 3;
        case "april":
        case "apr": return 4;
        case "may": return 5;
        case "june":
        case "jun": return 6;
        case "july":
        case "jul": return 7;
        case "august":
        case "aug": return 8;
        case "september":
        case "sept":
        case "sep": return 9;
        case "october":
        case "oct": return 10;
        case "november":
        case "nov": return 11;
        case "december":
        case "dec": return 12;
    }
}
// 1-12
function numberToMonth(number) {
    switch (number) {
        case 1: return "January";
        case 2: return "February";
        case 3: return "March";
        case 4: return "April";
        case 5: return "May";
        case 6: return "June";
        case 7: return "July";
        case 8: return "August";
        case 9: return "September";
        case 10: return "October";
        case 11: return "November";
        case 12: return "December";
    }
}
function daysInMonth(month) {
    switch (month) {
        case 1:
        case 3:
        case 5:
        case 7:
        case 8:
        case 10:
        case 12: return 31;
        case 4:
        case 6:
        case 9:
        case 11: return 30;
        case 2: return 29;
    }
}
