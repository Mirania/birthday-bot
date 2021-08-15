"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invite = void 0;
const utils = require("./utils");
function invite(message) {
    let link = `https://discordapp.com/oauth2/authorize?client_id=${process.env.BOT_ID}` +
        `&scope=bot&permissions=${process.env.BOT_PERMS}`;
    utils.send(message, `Here you go!\n\n${link}`);
}
exports.invite = invite;
