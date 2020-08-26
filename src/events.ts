import * as discord from "discord.js";
import { getConfig, getData, Gender, State, saveConfig, saveUser, getRandomImage, RoleState } from "./data";
import * as moment from 'moment-timezone';
import * as utils from "./utils";
import { bdayUtc } from "./dmcommands";
import { self } from ".";

// cleans up finished birthdays too
export async function announceBirthdays(): Promise<void> {
    const config = getConfig();
    const data = getData();
    const nowUtc = moment().utc().valueOf();

    const channel = self().channels.find(ch => ch.id === config.announcementChannelId) as discord.TextChannel;

    for (const user in data) {
        const bday = data[user];
        if (bday.state !== State.Done) continue; // configuration incomplete

        const member = self().guilds.find(g => g.id === config.serverId).member(user);
        if (!member) continue; // server member not found

        if (bday.announced === false && utils.isHavingBirthday(bday, nowUtc)) {
            // announce birthday
            let success = await giveRoleToUser(member);
            if (success) {
                bday.announced = true;
                saveUser(user);
                utils.send(channel, utils.resolveBirthdayMessage(user), getRandomImage());
            } else {
                utils.send(channel, "I was going to announce a birthday but it seems I'm missing role permissions.");
            }
        } else if (bday.roleState === RoleState.Given && bday.utcEnd < nowUtc) { 
            // remove editable role
            await removeEditableRoleFromUser(member);
            saveUser(user);
        } else if (bday.roleState === RoleState.TitleRemaining && bday.utcFinalize < nowUtc) {
            // remove title role
            await removeTitleRoleFromUser(member);
            saveUser(user);
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
        bday.utcFinalize = utc.finalize;
        bday.announced = utc.end < nowUtc;
    }

    config.lastCalculatedUtcYear = now.year();
    saveConfig();
}

async function giveRoleToUser(user: discord.GuildMember): Promise<boolean> {
    const config = getConfig();
    const data = getData();

    let roleIndex = config.lastRoleUsedIndex ?? 0;
    if (roleIndex >= config.roleIds.length) roleIndex = 0;

    try {
        // this is the static role
        const titleRoleIndex = getGenderedRoleIndex(data[user.id].gender);
        await user.addRole(config.titleRoleIds[titleRoleIndex], "Static birthday role.");

        // this is the editable role
        await user.addRole(config.roleIds[roleIndex], "Editable birthday role.");
        user.roles.find(r => r.id === config.roleIds[roleIndex]).setName(
            "Birthday Role",
            "Resetting the editable birthday role name."
        ); 

        data[user.id].roleState = RoleState.Given;
        config.lastRoleUsedIndex = (roleIndex + 1) % config.roleIds.length;
        saveConfig();
        return true;
    } catch (e) {
        return false;
    }
}

async function removeEditableRoleFromUser(user: discord.GuildMember): Promise<void> {
    const config = getConfig();
    const data = getData();

    try {
        // find the editable role
        const role = user.roles.find(r => config.roleIds.includes(r.id));
        if (role) await user.removeRole(role, "Expiration of editable birthday role.");
        data[user.id].roleState = RoleState.TitleRemaining;
    } catch (e) {
        utils.log(`Silently failed to remove editable role from user: ${e}`);
    }
}

async function removeTitleRoleFromUser(user: discord.GuildMember): Promise<void> {
    const config = getConfig();
    const data = getData();

    try {
        // find the editable role
        const role = user.roles.find(r => config.titleRoleIds.includes(r.id));
        if (role) await user.removeRole(role, "Expiration of static birthday role.");
        data[user.id].roleState = RoleState.None;
    } catch (e) {
        utils.log(`Silently failed to remove title role from user: ${e}`);
    }
}

function getGenderedRoleIndex(gender: Gender): number {
    switch (gender) {
        case Gender.Male: return 0;
        case Gender.Female: return 1;
        default: return 2;
    }
}