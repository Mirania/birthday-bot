import * as fs from "fs";

const images = fs.readdirSync("assets/").filter(file => !file.endsWith(".db"));

export function getRandomImageLink() {
    return `assets/${images[getRandomInt(0, images.length)]}`;
}

export function prepareBirthdayMessage(message: string, targetUserId: string) {
    return message.replace(/<user>/g, prepareUserMention(targetUserId));
}

export function prepareUserMention(userId: string) {
    return `<@${userId}>`;
}

export function prepareChannelMention(channelId: string) {
    return `<#${channelId}>`;
}

/**
 * Returns a random integer between min (inclusive) and max (exclusive).
 */
export function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max - 1);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
