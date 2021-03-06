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
exports.isLeapYear = exports.getFileExtension = exports.randomElement = exports.serverMemberName = exports.pad = exports.log = exports.seconds = exports.minutes = exports.areConfigsSet = exports.resolveBirthdayMessage = exports.isHavingBirthday = exports.mentionChannel = exports.mentionUser = exports.isOwner = exports.isAdmin = exports.usage = exports.getIfExists = exports.sendEmbed = exports.send = void 0;
const discord = require("discord.js");
const data_1 = require("./data");
const moment = require("moment-timezone");
/**
 * Sends a discord message to the channel determined by `context`. Catches and logs the event if it fails.
 */
function send(context, content, pictureURL) {
    const channel = context instanceof discord.Message ? context.channel : context;
    const picture = pictureURL
        ? { files: [{ attachment: pictureURL, name: `image.${getFileExtension(pictureURL)}` }] }
        : undefined;
    return channel.send(content, picture).catch((reason) => {
        let location = channel instanceof discord.DMChannel ?
            `${channel.recipient}'s DMs` : `#${channel.name}`;
        log(`[!] Error sending message to ${location}. ${reason}`);
        return context;
    });
}
exports.send = send;
/**
 * Sends a discord embed to the same channel as `context`. Catches and logs the event if it fails.
 */
function sendEmbed(context, content, pictureURL) {
    const embed = pictureURL
        ? { embed: content, files: [{ attachment: pictureURL, name: `image.${getFileExtension(pictureURL)}` }] }
        : { embed: content };
    return context.channel.send(embed).catch((reason) => {
        let location = context.channel instanceof discord.DMChannel ?
            `${context.author.username}'s DMs` : `#${context.channel.name}`;
        log(`[!] Error sending message to ${location}. ${reason}`);
        return context;
    });
}
exports.sendEmbed = sendEmbed;
/**
 * New discord API is awful.
 */
function getIfExists(manager, id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield manager.fetch(id);
        }
        catch (e) { } // ignore and return undefined
    });
}
exports.getIfExists = getIfExists;
/**
 * Returns formatted text about command usage.
 */
function usage(commandName, argSyntax) {
    return `\`\`\`bash\n${process.env.COMMAND}${commandName} ${argSyntax ? argSyntax : ""}\`\`\``;
}
exports.usage = usage;
/**
 * Check if message was posted in a guild and by an admin.
 */
function isAdmin(message) {
    return message.guild && message.member.hasPermission("ADMINISTRATOR");
}
exports.isAdmin = isAdmin;
/**
 * Check if message was posted by the bot owner.
 */
function isOwner(message) {
    return [process.env.OWNER_ID, process.env.OWNER_ID2].includes(message.author.id);
}
exports.isOwner = isOwner;
/**
 * Returns a chat mention of a user.
 */
function mentionUser(userId) {
    return `<@${userId}>`;
}
exports.mentionUser = mentionUser;
/**
 * Returns a chat mention of a channel.
 */
function mentionChannel(channelId) {
    return `<#${channelId}>`;
}
exports.mentionChannel = mentionChannel;
/**
 * Checks if a moment in time happens during a birthday.
 */
function isHavingBirthday(bday, nowUtc) {
    if (bday.utcStart === undefined || bday.utcEnd === undefined)
        return false;
    return nowUtc >= bday.utcStart && nowUtc <= bday.utcEnd;
}
exports.isHavingBirthday = isHavingBirthday;
/**
 * Transforms `@user@` sequences into user mentions.
 */
function resolveBirthdayMessage(userId) {
    const config = data_1.getConfig();
    if (config.announcement !== undefined)
        return config.announcement.replace(/(@user@)/g, mentionUser(userId));
    else
        return "";
}
exports.resolveBirthdayMessage = resolveBirthdayMessage;
/**
 * Check if the mandatory configurations are set.
 */
function areConfigsSet() {
    const config = data_1.getConfig();
    return config.announcement !== undefined &&
        config.announcementChannelId !== undefined &&
        config.roleIds !== undefined;
}
exports.areConfigsSet = areConfigsSet;
/**
 * Returns an amount of minutes in ms.
 */
function minutes(amount) {
    return amount * 60 * 1000;
}
exports.minutes = minutes;
/**
 * Returns an amount of seconds in ms.
 */
function seconds(amount) {
    return amount * 1000;
}
exports.seconds = seconds;
/**
 * Prints a message to the console.
 */
function log(text) {
    console.log(`[${moment().format("DD-MM-YYYY HH:mm:ss")}] ${text}`);
}
exports.log = log;
/**
 * Pads a number for a date.
 */
function pad(value) {
    return value < 10 ? `0${value}` : value.toString();
}
exports.pad = pad;
/**
 * Returns `user#1234 (nickname)` with appropriate fallbacks in case such information is missing.
 */
function serverMemberName(member) {
    if (!member)
        return "someone unknown";
    if (!member.nickname)
        return `${member.user.username}#${member.user.discriminator}`;
    return `${member.nickname} (${member.user.username}#${member.user.discriminator})`;
}
exports.serverMemberName = serverMemberName;
/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
/**
 * Returns a random element from an array.
 */
function randomElement(array) {
    return array[randomInt(0, array.length - 1)];
}
exports.randomElement = randomElement;
/**
 * Returns the file extension of a file.
 */
function getFileExtension(filePath) {
    const split = filePath.split(".");
    return split[split.length - 1];
}
exports.getFileExtension = getFileExtension;
/**
 * Checks if it is a leap year.
 */
function isLeapYear(year) {
    return (year % 100 === 0) ? (year % 400 === 0) : (year % 4 === 0);
}
exports.isLeapYear = isLeapYear;
