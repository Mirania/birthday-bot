import { Client, TextChannel } from "discord.js";
import * as moment from 'moment-timezone';
import { getAnnouncement, getBirthdays, getConfiguredServers, updateNextBirthday } from "./database/database"
import { getRandomImageLink, prepareBirthdayMessage } from "./utils/misc";
import { calcNextBirthday, getReadableDateString } from "./utils/time";
import { log, logError } from "./utils/misc";

export const announcer = {
    cooldownMs: 10 * 60 * 1000,
    async execute(client: Client) {
        try {
            log("Looking for birthdays to announce.");
            const nowTimestamp = moment().valueOf();

            for (const guildId of getConfiguredServers()) {
                const announcement = getAnnouncement(guildId);
                const birthdays = getBirthdays(guildId);
                if (!announcement) {
                    log(`Cannot announce anything for guild id ${guildId} because no announcement was configured.`);
                    continue; // to next guild
                }
                if (!birthdays) {
                    log(`Cannot announce anything for guild id ${guildId} because no birthdays were configured.`);
                    continue; // to next guild
                }

                const channel = client.channels.cache.get(announcement.channelId) as TextChannel;
                if (!channel || !channel.send) {
                    log(`Cannot announce anything for guild id ${guildId} because the channel is gone or not a text channel.`);
                    continue; // to next guild
                }

                const guild = client.guilds.cache.get(guildId);
                if (guild.members.cache.size <= 2) {
                    await guild.members.fetch({ withPresences: false });
                }
                log(`Guild id ${guildId} has ${guild.members.cache.size} members.`);

                for (const bday of Object.values(birthdays)) {
                    if (bday.nextBirthday <= nowTimestamp) {
                        log(`User id ${bday.userId} has a birthday now, will announce it.`);

                        if (guild.members.cache.has(bday.userId)) {
                            await channel.send({
                                content: prepareBirthdayMessage(announcement.message, bday.userId),
                                files: announcement.image ? [{ attachment: getRandomImageLink() }] : [],
                            });
                        } else {
                            log(`Would announce a birthday for user id ${bday.userId} in guild id ${guildId} but they are no longer in the server.`);
                        }

                        const nextBirthday = calcNextBirthday(bday.day, bday.month, bday.tz);
                        log(`User id ${bday.userId} will have their next birthday updated to ${getReadableDateString(nextBirthday, true)}.`);
                        await updateNextBirthday(guildId, bday.userId, nextBirthday.valueOf());
                    }
                }
            }
        } catch (e) {
            logError("Failed to check and/or announce birthdays.");
            console.log(e);
        }
    }
}

export const fetcher = {
    cooldownMs: 2 * 60 * 60 * 1000,
    async execute(client: Client) {
        try {
            const guildIds = getConfiguredServers();
            log(`Refreshing user lists for ${guildIds.length} guilds.`);

            const promises = guildIds.map(guildId => {
                const promise = client.guilds.cache.get(guildId)?.members.fetch({ withPresences: false });
                if (promise) {
                    log(`Will refresh guild id ${guildId}.`);
                    return promise;
                } else {
                    logError(`Could not find guild id ${guildId} in the guilds cache.`);
                    return Promise.resolve();
                }
            });

            await Promise.all(promises);
        } catch (e) {
            logError("Failed to refresh guilds.");
            console.log(e);
        }
    }
}