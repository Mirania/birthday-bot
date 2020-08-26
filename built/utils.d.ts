import * as discord from 'discord.js';
import { Birthday } from './data';
/**
 * Sends a discord message to the channel determined by `context`. Catches and logs the event if it fails.
 */
export declare function send(context: discord.Message | discord.TextChannel | discord.DMChannel, content: string, pictureURL?: string): Promise<discord.Message>;
/**
 * Sends a discord embed to the same channel as `context`. Catches and logs the event if it fails.
 */
export declare function sendEmbed(context: discord.Message, content: discord.RichEmbed, pictureURL?: string): Promise<discord.Message>;
/**
 * Returns formatted text about command usage.
 */
export declare function usage(commandName: string, argSyntax?: string): string;
/**
 * Check if message was posted in a guild and by an admin.
 */
export declare function isAdmin(message: discord.Message): boolean;
/**
 * Check if message was posted by the bot owner.
 */
export declare function isOwner(message: discord.Message): boolean;
/**
 * Returns a chat mention of a user.
 */
export declare function mentionUser(userId: string): string;
/**
 * Returns a chat mention of a channel.
 */
export declare function mentionChannel(channelId: string): string;
/**
 * Checks if a moment in time happens during a birthday.
 */
export declare function isHavingBirthday(bday: Birthday, nowUtc: number): boolean;
/**
 * Transforms `@user@` sequences into user mentions.
 */
export declare function resolveBirthdayMessage(userId: string): string;
/**
 * Check if the mandatory configurations are set.
 */
export declare function areConfigsSet(): boolean;
/**
 * Returns an amount of minutes in ms.
 */
export declare function minutes(amount: number): number;
/**
 * Prints a message to the console.
 */
export declare function log(text: string): void;
/**
 * Pads a number for a date.
 */
export declare function pad(value: number): string;
/**
 * Returns `user#1234 (nickname)` with appropriate fallbacks in case such information is missing.
 */
export declare function serverMemberName(member: discord.GuildMember): string;
/**
 * Returns a random element from an array.
 */
export declare function randomElement<T>(array: T[]): T;
/**
 * Returns the file extension of a file.
 */
export declare function getFileExtension(filePath: string): string;
