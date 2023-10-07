import * as dotenv from 'dotenv'; dotenv.config({ path: 'env.txt' });
import { Client, Events, GatewayIntentBits } from 'discord.js';
import * as database from './database/database';
import commands from './slash/collection';
import { announcer, fetcher } from './announcer';
import { log, logError } from "./utils/misc";

let isReady = false;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

Promise.all([
    client.login(process.env.BOT_TOKEN),
    database.init()
]).then(() => isReady = true);

client.once(Events.ClientReady, c => {
    log(`Ready! Logged in as ${c.user.tag}`);
    client.user.setPresence({ activities: [{ name: 'Birthday Bot! /register' }], status: 'dnd' });
    announcer.execute(client);
    setInterval(() => announcer.execute(client), announcer.cooldownMs);
    fetcher.execute(client);
    setInterval(() => fetcher.execute(client), fetcher.cooldownMs);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand() && !interaction.isAutocomplete()) {
        return;
    }

    if (!isReady) {
        logError("Ignored command because bot is not ready yet.");
        return;
    }

    const command = commands.get(interaction.commandName);

    if (!command) {
        logError(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    if (interaction.isChatInputCommand() && command.execute) {
        try {
            await command.execute(interaction, client);
        } catch (error) {
            logError(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    } else if (interaction.isAutocomplete() && command.autocomplete) {
        try {
            await command.autocomplete(interaction);
        } catch (error) {
            logError(error);
        }
    }
});

export function self(): Client {
    return client;
}