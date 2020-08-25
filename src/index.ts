import * as dotenv from 'dotenv'; dotenv.config();
import * as discord from 'discord.js';
import * as handler from './handler';
import * as data from './data';
import * as utils from './utils';

const bot = new discord.Client();
const botId = process.env.BOT_ID;
const prefix = process.env.COMMAND;

let isReady = false;

bot.login(process.env.BOT_TOKEN);

bot.on("ready", async () => {
    bot.user.setPresence({ game: { name: "Birthday Bot - $help" }, status: "dnd" });
    await data.init();
    handler.handleEvents();
    isReady = true;
    utils.log("Bot is online.");
})

bot.on("message", (message) => {
    if (!isReady || message.author.id === botId) return;

    const isDM = message.channel instanceof discord.DMChannel;
    const isCommand = message.content.startsWith(prefix);

    if (isCommand) { // handles commands even inside DMs
        handler.handleCommand(message);
    } else if (isDM) {
        handler.handleDM(message);
    }
});

export function self(): discord.Client {
    return bot;
}