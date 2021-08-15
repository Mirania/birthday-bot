import * as discord from "discord.js";
export declare type Birthday = {
    day?: number;
    month?: number;
    tz?: string;
    utcStart?: number;
    utcEnd?: number;
    utcFinalize?: number;
    gender?: Gender;
    announced?: boolean;
    state: State;
    roleState: RoleState;
};
export declare type Configurations = {
    enabled?: boolean;
    roleIds?: string[];
    titleRoleIds?: string[];
    announcement?: string;
    announcementChannelId?: string;
    lastCalculatedUtcYear?: number;
    lastRoleUsedIndex?: number;
    serverId?: string;
};
export declare type Reminder = {
    isPeriodic: boolean;
    text: string;
    timestamp: number;
    authorId: string;
    channelId: string;
    timeValues?: {
        [unit: string]: number;
    };
};
export declare enum Gender {
    Male = "Male",
    Female = "Female",
    Other = "Other"
}
export declare enum State {
    None = 0,
    AwaitingDate = 1,
    ConfirmingDate = 2,
    AwaitingTime = 3,
    ConfirmingTime = 4,
    AwaitingGender = 5,
    ConfirmingGender = 6,
    Done = 7
}
export declare enum RoleState {
    None = 0,
    Given = 1,
    EditableRemaining = 2
}
export declare function gatherImages(): void;
export declare function init(): Promise<void>;
/**
 * Refreshes and loads everything.
 */
export declare function loadImmediate(): Promise<void>;
/**
 * Saves everything.
 */
export declare function saveImmediate(): Promise<void>;
export declare function deleteUser(userId: string): Promise<void>;
export declare function saveUser(userId: string): Promise<void>;
export declare function saveReminder(reminder: Reminder): Promise<string>;
export declare function saveReminders(reminders: {
    [key: string]: Reminder;
}): Promise<void>;
export declare function saveConfig(): Promise<void>;
export declare function getConfig(): Configurations;
export declare function getData(): {
    [userId: string]: Birthday;
};
export declare function getReminders(): {
    [key: string]: Reminder;
};
export declare function getRandomImage(): string;
export declare function getUser(message: discord.Message): Birthday;
export declare function getTimezoneOffsets(): {
    [timezone: string]: number;
};
export declare function setReminder(reminder: Reminder): Promise<void>;
