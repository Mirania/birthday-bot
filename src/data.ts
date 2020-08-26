import * as db from './firebase-module';
import * as discord from "discord.js";
import * as moment from 'moment-timezone';
import * as utils from './utils';
import * as fs from 'fs';

export type Birthday = {
    day?: number, // bday day (bot's local time)
    month?: number, // bday month (bot's local time)
    tz?: string, // user's timezone
    utcStart?: number, // unix time of bday start (ms) - add editable&title roles
    utcEnd?: number, // unix time of bday end (ms) - remove title role
    utcFinalize?: number, // remove editable role
    gender?: Gender, // dictates role choice
    announced?: boolean, // whether bday was announced this year
    state: State, // dictates bday command progression
    roleState: RoleState // dictates role removal progression
}

export type Configurations = {
    enabled?: boolean, // whether bot should announce at all
    roleIds?: string[], // editable bday roles to use
    titleRoleIds?: string[], // static bday roles - birthday boy/girl/cutie
    announcement?: string, // bday message
    announcementChannelId?: string, // bday message channel
    lastCalculatedUtcYear?: number, // last year bday utcs were calculated for
    lastRoleUsedIndex?: number, // roleIds[] index of the last role attributed to someone
    serverId?: string // id of server with announcement channel
}

export enum Gender {
    Male = "Male", Female = "Female", Other = "Other"
}

export enum State {
    None, AwaitingDate, ConfirmingDate, AwaitingTime, ConfirmingTime, AwaitingGender, ConfirmingGender, Done
}

export enum RoleState {
    None, Given, TitleRemaining
}

let config: Configurations = {};
let data: { [userId: string]: Birthday } = {};
let images: string[] = [];

// while i give these timezones some offset values, these may change so i'll recalculate them anyway
const timezoneOffsets: { [timezone: string]: number } = {
    "Greenwich": 0,
    "Europe/London": 60,
    "Europe/Amsterdam": 120,
    "Europe/Moscow": 180,
    "Asia/Dubai": 240,
    "Iran": 270,
    "Asia/Tashkent": 300,
    "Asia/Calcutta": 330,
    "Asia/Katmandu": 345,
    "Asia/Dhaka": 360,
    "Asia/Yangon": 390,
    "Asia/Saigon": 420,
    "Singapore": 480,
    "Australia/Eucla": 525,
    "Japan": 540,
    "Australia/Darwin": 570,
    "Australia/Sydney": 600,
    "Australia/Lord_Howe": 630,
    "Pacific/Norfolk": 660,
    "Pacific/Auckland": 720,
    "Pacific/Chatham": 765,
    "Pacific/Apia": 780,
    "Pacific/Kiritimati": 840,
    "US/Aleutian": -540,
    "US/Alaska": -480,
    "America/New_York": -240,
    "Brazil/East": -180,
    "Canada/Central": -300,
    "America/El_Salvador": -360,
    "US/Arizona": -420,
    "Atlantic/South_Georgia": -120,
    "Canada/Newfoundland": -150,
    "Atlantic/Cape_Verde": -60,
    "US/Hawaii": -600,
    "US/Samoa": -660,
    "Etc/GMT+12": -720,
    "Pacific/Marquesas": -570
};

function fillTimezones(): void {
    for (const tz in timezoneOffsets) {
        timezoneOffsets[tz] = moment().tz(tz).utcOffset();
    }
}

export function gatherImages(): void {
    if (!fs.existsSync("assets/")) return;

    for (const image of fs.readdirSync("assets/")) {
        if (image !== "Thumbs.db") images.push(`assets/${image}`);
    }
}

export async function init(): Promise<void> {
    db.connect(process.env.FIREBASE_CREDENTIALS, process.env.FIREBASE_URL);
    await loadImmediate();
}

/**
 * Refreshes and loads everything.
 */
export async function loadImmediate(): Promise<void> {
    fillTimezones();
    gatherImages();
    config = await db.get("config/") ?? {enabled: true, lastCalculatedUtcYear: moment().year()};
    data = await db.get("data/") ?? {};
}

/**
 * Saves everything.
 */
export async function saveImmediate(): Promise<void> {
    await db.post("config/", config);
    await db.post("data/", data);
}

export async function saveUser(userId: string): Promise<void> {
    await db.post(`data/${userId}/`, data[userId]);
}

export async function saveConfig(): Promise<void> {
    await db.post("config/", config);
}

export function getConfig(): Configurations {
    return config;
}

export function getData(): { [userId: string]: Birthday } {
    return data;
}

// returns undefined if no pictures available
export function getRandomImage(): string {
    if (images.length > 0) return utils.randomElement(images);
}

export function getUser(message: discord.Message): Birthday {
    return data[message.author.id];
}

export function getTimezoneOffsets(): { [timezone: string]: number } {
    return timezoneOffsets;
}