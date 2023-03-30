import { Client, Events, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv'; dotenv.config();
import * as firebase from '../database/firebase-module';
import { getReadableDateString, getRelativeTimeString } from '../utils/time';
import * as moment from 'moment-timezone';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

Promise.all([
    client.login(process.env.BOT_TOKEN),
    firebase.connect(process.env.FIREBASE_CREDENTIALS, process.env.FIREBASE_URL)
]);

client.once(Events.ClientReady, async c => {
    console.log(`Ready!`);

    const now = moment();
    const guilds: object = await firebase.get("birthdays/servers");
    for (const guildId in guilds) {
        const guild = c.guilds.cache.get(guildId);
        await guild.members.fetch({withPresences: false});

        const configured = await firebase.get(`birthdays/servers/${guildId}/announcement`);
        console.log("Guild", guildId, `(${guild.name}),`, "configured:", configured != null);

        const users = await firebase.get(`birthdays/servers/${guildId}/users`);
        if (!users) {
            console.log("No users.");
        } else {
            const sorted = Object.keys(users).map(userId => ({userId, tz: users[userId].tz, nextBirthday: users[userId].nextBirthday}))
                    .sort((a,b) => a.nextBirthday - b.nextBirthday);

            console.table(sorted.map(entry => {
                const username = guild.members.cache.has(entry.userId) ? guild.members.cache.get(entry.userId).displayName : "<not in the server>";
                const date = moment.tz(entry.nextBirthday, entry.tz);
                return {
                    "user id": entry.userId,
                    "user name": username,
                    "next birthday": getReadableDateString(date, true),
                    "happens in": getRelativeTimeString(now, date)
                };
            }));
        }
    }

    process.exit(0);
});