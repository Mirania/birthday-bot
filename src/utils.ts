import * as discord from 'discord.js';
import { Birthday, getConfig } from './data';
import * as moment from 'moment-timezone';

/**
 * Sends a discord message to the channel determined by `context`. Catches and logs the event if it fails.
 */
export function send(context: discord.Message | discord.TextChannel | discord.DMChannel, content: string): Promise<discord.Message> {
    const channel = context instanceof discord.Message ? context.channel : context;

    return channel.send(content).catch((reason: string) => {
        let location = channel instanceof discord.DMChannel ?
            `${channel.recipient}'s DMs` : `#${channel.name}`;
        log(`[!] Error sending message to ${location}. ${reason}`);
        return context;
    }) as Promise<discord.Message>;
}

/**
 * Sends a discord embed to the same channel as `context`. Catches and logs the event if it fails.
 */
export function sendEmbed(context: discord.Message, content: discord.RichEmbed, pictureURL?: string): Promise<discord.Message> {
    return context.channel.send(pictureURL ?
        { embed: content, files: [{ attachment: pictureURL, name: 'image.png' }] } : { embed: content }
    ).catch((reason: string) => {
        let location = context.channel instanceof discord.DMChannel ?
            `${context.author.username}'s DMs` : `#${context.channel.name}`;
        log(`[!] Error sending message to ${location}. ${reason}`);
        return context;
    }
    ) as Promise<discord.Message>;
}

/**
 * Returns formatted text about command usage.
 */
export function usage(commandName: string, argSyntax?: string): string {
    return `\`\`\`bash\n${process.env.COMMAND}${commandName} ${argSyntax ? argSyntax : ""}\`\`\``;
}

/**
 * Check if message was posted in a guild and by an admin.
 */
export function isAdmin(message: discord.Message): boolean {
    if (!message.guild || !message.member.hasPermission("ADMINISTRATOR")) {
        send(message, `Only a server administrator can use this command.`);
        return false;
    } else return true;
}

/**
 * Check if message was posted by the bot owner.
 */
export function isOwner(message: discord.Message): boolean {
    if (![process.env.OWNER_ID, process.env.OWNER_ID2].includes(message.author.id)) {
        send(message, `Only the bot owners can use this command.`);
        return false;
    } else return true;
}

/**
 * Returns a chat mention of a user.
 */
export function mentionUser(userId: string): string {
    return `<@${userId}>`;
}

/**
 * Returns a chat mention of a channel.
 */
export function mentionChannel(channelId: string): string {
    return `<#${channelId}>`;
}

/**
 * Checks if a moment in time happens during a birthday.
 */
export function isHavingBirthday(bday: Birthday, nowUtc: number): boolean {
    if (bday.utcStart === undefined || bday.utcEnd === undefined) return false;
    return nowUtc >= bday.utcStart && nowUtc <= bday.utcEnd;
}

/**
 * Transforms `@user@` sequences into user mentions.
 */
export function resolveBirthdayMessage(userId: string): string {
    const config = getConfig();

    if (config.announcement !== undefined)
        return config.announcement.replace(/(@user@)/g, mentionUser(userId));
    else
        return "";
}

/**
 * Check if the mandatory configurations are set.
 */
export function areConfigsSet(): boolean {
    const config = getConfig();

    return config.announcement !== undefined &&
           config.announcementChannelId !== undefined &&
           config.roleIds !== undefined;
}

/**
 * Returns an amount of minutes in ms.
 */
export function minutes(amount: number): number {
    return amount * 60 * 1000;
}

/**
 * Prints a message to the console.
 */
export function log(text: string): void {
    console.log(`[${moment().format("DD-MM-YYYY HH:mm:ss")}] ${text}`);
}

/**
 * Pads a number for a date.
 */
export function pad(value: number): string {
    return value < 10 ? `0${value}` : value.toString();
}

/**
 * Returns `user#1234 (nickname)` with appropriate fallbacks in case such information is missing.
 */
export function serverMemberName(member: discord.GuildMember): string {
    if (!member) return "someone unknown";
    if (!member.nickname) return `${member.user.username}#${member.user.discriminator}`;
    return `${member.nickname} (${member.user.username}#${member.user.discriminator})`;
}