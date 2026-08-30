import * as firebase from './firebase-module';
import * as rot from '../utils/rotcrypt';
import { log } from "../utils/misc";

export interface Birthday {
    /** discord user id */
    userId: string,
    /** birth month */
    month: number,
    /** birth day */
    day: number,
    /** birth timezone */
    tz: string,
    /** timestamp of next broadcast */
    nextBirthday: number
}

export interface Announcement {
    /** id of target channel */
    channelId: string,
    /** message */
    message: string,
    /** image */
    image: boolean
}

export type Secrets = {
    readonly BOT_ID: string;
    readonly BOT_TOKEN: string;
    readonly BOT_PERMS: string;
    readonly OWNER_TIMEZONE: string;
};

const announcements: Record<string, Announcement> = {};
const birthdays: Record<string, Record<string, Birthday>> = {};
let secrets: Secrets;

export async function init() {
    firebase.connect(process.env.FIREBASE_CREDENTIALS, process.env.FIREBASE_URL);

    const rawSecrets: any = await firebase.get("env/birthdaybot");
    secrets = {
        BOT_ID: rot.decrypt(rawSecrets.BOT_ID, rawSecrets.ROT),
        BOT_TOKEN: rot.decrypt(rawSecrets.BOT_TOKEN, rawSecrets.ROT),
        BOT_PERMS: rawSecrets.BOT_PERMS,
        OWNER_TIMEZONE: rawSecrets.OWNER_TIMEZONE
    };

    const fetched = await firebase.get("birthdays/servers");
    Object.keys(fetched).forEach(guildId => {
        announcements[guildId] = fetched[guildId].announcement;
        birthdays[guildId] = fetched[guildId].users;
    });
}

export async function configure(guildId: string, announcement: Announcement) {
    announcements[guildId] = announcement;
    await firebase.post(`birthdays/servers/${guildId}/announcement`, announcement);

    log(`Configured the announcements for guild id ${guildId}.`);
}

export async function register(guildId: string, birthday: Birthday) {
    birthdays[guildId] ??= {};
    birthdays[guildId][birthday.userId] = birthday;
    await firebase.post(`birthdays/servers/${guildId}/users/${birthday.userId}`, birthday);

    log(`Registered user id ${birthday.userId} in guild id ${guildId}.`);
}

export async function updateNextBirthday(guildId: string, userId: string, timestamp: number) {
    if (!birthdays[guildId] || !birthdays[guildId][userId]) {
        log(`User id ${userId} is not registered, cannot update.`);
        return;
    }

    if (birthdays[guildId][userId].nextBirthday >= timestamp) {
        log(`User id ${userId} already has this timestamp, no point in updating.`);
        return;
    }

    birthdays[guildId][userId].nextBirthday = timestamp;
    await firebase.update(`birthdays/servers/${guildId}/users/${userId}`, { nextBirthday: timestamp });

    log(`Updated timestamp for user id ${userId}.`);
}

export function getConfiguredServers() {
    return Object.keys(announcements);
}

export function getSecrets(): Secrets {
    return secrets;
}

export function getAnnouncement(guildId: string) {
    return announcements[guildId];
}

export function getBirthdays(guildId: string) {
    return birthdays[guildId];
}

export function userExists(guildId: string, userId: string) {
    return birthdays[guildId] && birthdays[guildId][userId];
}