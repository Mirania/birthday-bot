import { Client, TextChannel } from "discord.js";
import * as moment from 'moment-timezone';
import { Birthday, getAnnouncement, getBirthdays, getConfiguredServers, updateNextBirthday } from "./database/database"
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
                const guild = client.guilds.cache.get(guildId);
                if (guild.members.cache.size <= 2) {
                    await guild.members.fetch({ withPresences: false });
                }
                log(`----- Now checking guild id ${guildId} (${guild.name}), which has ${guild.members.cache.size} members. -----`);

                const announcement = getAnnouncement(guildId);
                const birthdays = getBirthdays(guildId);
                if (!announcement) {
                    log(`Cannot announce anything for this guild because no announcement was configured.`);
                    continue; // to next guild
                }
                if (!birthdays) {
                    log(`Cannot announce anything for this guild because no birthdays were configured.`);
                    continue; // to next guild
                }

                const channel = client.channels.cache.get(announcement.channelId) as TextChannel;
                if (!channel || !channel.send) {
                    log(`Cannot announce anything for this guild because the channel is gone or not a text channel.`);
                    continue; // to next guild
                }

                for (const bday of Object.values(birthdays)) {
                    if (bday.nextBirthday <= nowTimestamp) {
                        log(`User ${bday.userId} has a birthday now:`);

                        try {
                            await guild.members.fetch(bday.userId);
                        } catch (e) {
                            log(`- Would announce but the user no longer exists at all (?), failed to pull into cache: ${e}`);
                            await markBirthdayAsAnnounced(bday, guildId);
                            continue;
                        }

                        if (!guild.members.cache.has(bday.userId)) {
                            log(`- Would announce but the user is no longer in the server.`);
                            await markBirthdayAsAnnounced(bday, guildId);
                            continue;
                        }

                        log(`- Announcing it!`);
                        await channel.send({
                            content: prepareBirthdayMessage(announcement.message, bday.userId),
                            files: announcement.image ? [{ attachment: getRandomImageLink() }] : [],
                        });
                        await markBirthdayAsAnnounced(bday, guildId); // do not mark as announced if sending the message above failed!
                    }
                }
            }
        } catch (e) {
            logError(`Failed to check and/or announce birthdays. ${e}`);
            throw e;
        }
    }
}

async function markBirthdayAsAnnounced(bday: Birthday, guildId: string) {
    const nextBirthday = calcNextBirthday(bday.day, bday.month, bday.tz);
    log(`- Marking their birthday as announced, next one is on ${getReadableDateString(nextBirthday, true)}.`);
    await updateNextBirthday(guildId, bday.userId, nextBirthday.valueOf());
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
            logError(`Failed to refresh guilds. ${e}`);
            throw e;
        }
    }
}