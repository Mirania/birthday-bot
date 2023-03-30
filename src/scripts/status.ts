import { Client, Events, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv'; dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
client.login(process.env.BOT_TOKEN);

client.once(Events.ClientReady, async c => {
    console.log(`Ready!`);

    client.user.setPresence({ activities: [{ name: 'Birthday Bot! /register' }], status: 'dnd' });
    await client.user.setAvatar("https://i.imgur.com/QoOLORS.png");
    console.log(`Done.`);
    process.exit(0);
});