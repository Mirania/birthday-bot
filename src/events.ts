import * as discord from "discord.js";
import { getConfig, getData, Gender, State, saveConfig, saveUser, getRandomImage, RoleState, getReminders, saveReminders, Reminder } from "./data";
import * as moment from 'moment-timezone';
import * as utils from "./utils";
import { bdayUtc } from "./dmcommands";
import { self } from ".";

// cleans up finished birthdays too
export async function announceBirthdays(): Promise<void> {
    const config = getConfig();
    const data = getData();
    const nowUtc = moment().utc().valueOf();

    const channel = await self().channels.fetch(config.announcementChannelId) as discord.TextChannel;

    for (const user in data) {
        const bday = data[user];
        if (bday.state !== State.Done) continue; // configuration incomplete

        const guild = await self().guilds.fetch(config.serverId);
        const member = await utils.getIfExists(guild.members, user);

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
            // remove title role
            await removeTitleRoleFromUser(member);
            saveUser(user);
        } else if (bday.roleState === RoleState.EditableRemaining && bday.utcFinalize < nowUtc) {
            // remove editable role
            await removeEditableRoleFromUser(member);
            saveUser(user);
        }
    }
}

export async function announceReminders(): Promise<void> {
    const reminders = getReminders();
    const nowUtc = moment().utc().valueOf();
    const bot = self();

    for (const key in reminders) {
        const reminder = reminders[key];

        if (reminder.timestamp > nowUtc) continue;

        const channel = await utils.getIfExists(bot.channels, reminder.channelId) as discord.TextChannel;

        if (!channel) {
            // this can't be announced anymore
            delete reminders[key];
            continue;
        }

        await utils.send(channel, `${utils.mentionUser(reminder.authorId)} says: ${reminder.text}`);
        reminder.isPeriodic ? renewReminder(reminder) : delete reminders[key];
    }

    saveReminders(reminders);
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

function renewReminder(reminder: Reminder): void {
    const date = moment();

    for (const unit in reminder.timeValues) {
        const value = reminder.timeValues[unit];
        switch (unit) {
            case "year": case "y": date.add(value, "year"); break;
            case "month": case "mo": date.add(value, "month"); break;
            case "day": case "d": date.add(value, "day"); break;
            case "hour": case "h": date.add(value, "hour"); break;
            case "minute": case "m": date.add(value, "minute"); break;
        }
    }

    date.subtract(5, "second");
    reminder.timestamp = date.utc().valueOf();
}

async function giveRoleToUser(user: discord.GuildMember): Promise<boolean> {
    const config = getConfig();
    const data = getData();

    let roleIndex = config.lastRoleUsedIndex ?? 0;
    if (roleIndex >= config.roleIds.length) roleIndex = 0;

    try {
        // this is the static role
        const titleRoleIndex = getGenderedRoleIndex(data[user.id].gender);
        const titleRole = await user.guild.roles.fetch(config.titleRoleIds[titleRoleIndex]);
        await user.roles.add(titleRole, "Static birthday role.");

        // this is the editable role
        const editableRole = await user.guild.roles.fetch(config.roleIds[roleIndex]);
        await user.roles.add(editableRole, "Editable birthday role.");
        editableRole.setName("Birthday Role", "Resetting the editable birthday role name.");

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
        const editableRole = user.roles.cache.find(r => config.roleIds.includes(r.id));
        if (editableRole) await user.roles.remove(editableRole, "Expiration of editable birthday role.");
        data[user.id].roleState = RoleState.None;
    } catch (e) {
        utils.log(`Silently failed to remove editable role from user: ${e}`);
    }
}

async function removeTitleRoleFromUser(user: discord.GuildMember): Promise<void> {
    const config = getConfig();
    const data = getData();

    try {
        // find the title role
        const titleRole = user.roles.cache.find(r => config.titleRoleIds.includes(r.id));
        if (titleRole) await user.roles.remove(titleRole, "Expiration of static birthday role.");
        data[user.id].roleState = RoleState.EditableRemaining;
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