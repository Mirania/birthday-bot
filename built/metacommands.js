"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invite = exports.save = exports.load = exports.recalculate = exports.checkreminders = exports.checkbdays = void 0;
const utils = require("./utils");
const events = require("./events");
const data = require("./data");
function checkbdays(message) {
    if (!utils.isOwner(message)) {
        utils.send(message, "You must be a bot owner to use this command!");
        return;
    }
    if (!utils.areConfigsSet()) {
        utils.send(message, "I cannot do this because some configurations are missing.");
        return;
    }
    events.announceBirthdays();
    utils.log("'checkbdays' done.");
}
exports.checkbdays = checkbdays;
function checkreminders(message) {
    if (!utils.isOwner(message)) {
        utils.send(message, "You must be a bot owner to use this command!");
        return;
    }
    events.announceReminders();
    utils.log("'checkreminders' done.");
}
exports.checkreminders = checkreminders;
function recalculate(message) {
    if (!utils.isOwner(message)) {
        utils.send(message, "You must be a bot owner to use this command!");
        return;
    }
    events.recalculateUtcsForThisYear();
    utils.log("'recalculate' done.");
}
exports.recalculate = recalculate;
function load(message) {
    if (!utils.isOwner(message)) {
        utils.send(message, "You must be a bot owner to use this command!");
        return;
    }
    data.loadImmediate();
    utils.log("'load' done.");
}
exports.load = load;
function save(message) {
    if (!utils.isOwner(message)) {
        utils.send(message, "You must be a bot owner to use this command!");
        return;
    }
    data.saveImmediate();
    utils.log("'save' done.");
}
exports.save = save;
function invite(message) {
    if (!utils.isOwner(message)) {
        utils.send(message, "You must be a bot owner to use this command!");
        return;
    }
    const link = `https://discordapp.com/oauth2/authorize?client_id=${process.env.BOT_ID}` +
        `&scope=bot&permissions=${process.env.BOT_PERMS}`;
    utils.send(message, `Here you go!\n\n${link}`);
}
exports.invite = invite;
