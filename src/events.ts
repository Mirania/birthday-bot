import * as discord from "discord.js";
import { getConfig, getData, Birthday, Gender, State, saveConfig, saveUser } from "./data";
import * as moment from 'moment-timezone';
import * as utils from "./utils";
import { bdayUtc } from "./dmcommands";
import { self } from ".";

export async function announceBirthdays(): Promise<void> {
    const config = getConfig();
    const data = getData();
    const nowUtc = moment().utc().valueOf();

    const channel = self().channels.find(ch => ch.id === config.announcementChannelId) as discord.TextChannel;

    for (const user in data) {
        const bday = data[user];
        if (bday.announced === false && bday.state === State.None && utils.isHavingBirthday(bday, nowUtc)) {
            let success = await giveRoleToUser(user);
            if (success) {
                bday.announced = true;
                utils.send(channel, utils.resolveBirthdayMessage(user));
            } else {
                utils.send(channel, "I was going to announce a birthday but it seems I'm missing role permissions.");
            }
        }
    }
}

export function shouldRecalculateUtcs(): boolean {
    const config = getConfig();
    const now = moment();

    if (config.lastCalculatedUtcYear >= now.year()) return false;
    return now.month() === 0 && now.date() === 1;
}

export function recalculateUtcsForThisYear(): void {
    const config = getConfig();
    const data = getData();
    const now = moment(), nowUtc = now.utc().valueOf();

    for (const user in data) {
        const bday = data[user];
        if (bday.month === undefined) continue;
        
        const utc = bdayUtc(bday);
        bday.utcStart = utc.start;
        bday.utcEnd = utc.end;
        bday.announced = utc.end < nowUtc;
    }

    config.lastCalculatedUtcYear = now.year();
    saveConfig();
}

async function giveRoleToUser(userId: string): Promise<boolean> {
    const config = getConfig();
    const data = getData();

    let roleIndex = config.lastRoleUsedIndex ?? 0;
    if (roleIndex >= config.roleIds.length) roleIndex = 0;

    try {
        const user = self().guilds.find(g => g.id === config.serverId).member(userId);
        await user.addRole(config.roleIds[roleIndex], "Birthday role.");
        user.roles.find(r => r.id === config.roleIds[roleIndex]).setName(
            getDefaultRoleName(data[userId]),
            "Default birthday role name."
        );

        config.lastRoleUsedIndex = (roleIndex + 1) % config.roleIds.length;
        saveUser(userId);
        saveConfig();
        return true;
    } catch (e) {
        return false;
    }
}

function getDefaultRoleName(bday: Birthday): string {
    switch (bday.gender) {
        case Gender.Male: return "Birthday Boy";
        case Gender.Female: return "Birthday Girl";
        case Gender.Other: return "Birthday Cutie";
    }
}