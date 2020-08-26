import * as discord from 'discord.js';
import { Birthday } from './data';
export declare function dateParser(message: discord.Message): Promise<void>;
export declare function dateConfirmer(message: discord.Message): Promise<void>;
export declare function timeParser(message: discord.Message): Promise<void>;
/**
 * Gets the unix time of a birthday for the current year.
 */
export declare function bdayUtc(user: Birthday): {
    start: number;
    end: number;
    finalize: number;
};
export declare function timeConfirmer(message: discord.Message): Promise<void>;
export declare function genderParser(message: discord.Message): Promise<void>;
export declare function genderConfirmer(message: discord.Message): Promise<void>;
export declare function numberToMonth(number: number): string;
