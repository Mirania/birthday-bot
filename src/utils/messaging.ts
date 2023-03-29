import * as fs from "fs";
import { getRandomInt } from "./misc";

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