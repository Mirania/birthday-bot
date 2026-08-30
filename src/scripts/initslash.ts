import * as dotenv from 'dotenv'; dotenv.config({ path: 'env.txt' });
import { REST, Routes } from 'discord.js';
import commands from '../slash/collection';
import * as database from '../database/database';

(async () => {
    try {
        await database.init();

        // Construct and prepare an instance of the REST module
        const rest = new REST({ version: '10' }).setToken(database.getSecrets().BOT_TOKEN);
        
        console.log("Started refreshing application (/) commands:", commands.map(cmd => cmd.data.name));

        // The put method is used to fully refresh all commands in the guild with the current set
        // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
        await rest.put(
            Routes.applicationCommands(database.getSecrets().BOT_ID),
            { body: commands.map(cmd => cmd.data.toJSON()) },
        );

        console.log(`Successfully reloaded ${commands.size} application (/) commands.`);
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
})();