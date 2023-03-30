import * as dotenv from 'dotenv'; dotenv.config();
import { REST, Routes } from 'discord.js';
import commands from '../slash/collection';

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

// and deploy your commands!
(async () => {
    try {
        console.log("Started refreshing application (/) commands:", commands.map(cmd => cmd.data.name));

        // The put method is used to fully refresh all commands in the guild with the current set
        // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
        await rest.put(
            Routes.applicationCommands(process.env.BOT_ID),
            { body: commands.map(cmd => cmd.data.toJSON()) },
        );

        console.log(`Successfully reloaded ${commands.size} application (/) commands.`);
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
})();