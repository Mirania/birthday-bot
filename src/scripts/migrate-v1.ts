import { Client, Events, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv'; dotenv.config({ path: 'env.txt' });
import * as firebase from '../database/firebase-module';
import * as database from '../database/database';
import { calcNextBirthday } from '../utils/time';


if (!process.argv[2]) {
    console.error("Supply a guild id.");
    process.exit(1);
}

main();

async function main() {
    const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

    await database.init();
    await client.login(database.getSecrets().BOT_TOKEN);

    client.once(Events.ClientReady, async c => {
        console.log(`Ready!`);

        const data: object = await firebase.get("data");
        console.log(`${Object.keys(data).length} users to migrate.`);

        const migrated = {};
        for (const userId in data) {
            const user = data[userId];
            migrated[userId] = {
                day: user.day,
                month: user.month,
                tz: user.tz.replace(/ /g, "_"),
                nextBirthday: calcNextBirthday(user.day, user.month, user.tz.replace(/ /g, "_")).valueOf(),
                userId
            };
        }

        await firebase.post(`birthdays/servers/${process.argv[2]}/users`, migrated);
        console.log("Finished migrating.");
        process.exit(0);
    });
}
