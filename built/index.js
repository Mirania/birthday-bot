"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.self = void 0;
const dotenv = require("dotenv");
dotenv.config();
const discord = require("discord.js");
const handler = require("./handler");
const data = require("./data");
const utils = require("./utils");
const bot = new discord.Client({
    partials: ["REACTION", "MESSAGE", "CHANNEL"],
    ws: { intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"] }
});
const botId = process.env.BOT_ID;
const prefix = process.env.COMMAND;
let isReady = false;
data.gatherImages();
bot.login(process.env.BOT_TOKEN);
bot.on("ready", () => __awaiter(void 0, void 0, void 0, function* () {
    bot.user.setPresence({ activity: { name: "Birthday Bot - $help" }, status: "dnd" });
    yield data.init();
    handler.handleEvents();
    isReady = true;
    utils.log("Bot is online.");
}));
bot.on("message", (message) => {
    if (!isReady || message.author.id === botId)
        return;
    const isDM = message.channel instanceof discord.DMChannel;
    const isCommand = message.content.startsWith(prefix);
    if (isCommand) { // handles commands even inside DMs
        handler.handleCommand(message);
    }
    else if (isDM) {
        handler.handleDM(message);
    }
});
function self() {
    return bot;
}
exports.self = self;
