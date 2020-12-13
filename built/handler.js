"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleEvents = exports.handleDM = exports.handleCommand = void 0;
const utils = require("./utils");
const server = require("./servercommands");
const dms = require("./dmcommands");
const meta = require("./metacommands");
const events = require("./events");
const data_1 = require("./data");
const timers_1 = require("timers");
const commandList = Object.assign(Object.assign({}, server), meta);
const bdayEventInterval = utils.minutes(15);
const reminderEventInterval = utils.seconds(45);
function handleCommand(message) {
    const content = message.content.split(" ").filter(item => item !== "");
    const name = content[0].slice(1, content[0].length);
    const args = content.splice(1, content.length);
    if (commandList[name])
        commandList[name](message, args);
}
exports.handleCommand = handleCommand;
function handleDM(message) {
    var _a;
    const data = data_1.getData();
    const state = (_a = data[message.author.id]) === null || _a === void 0 ? void 0 : _a.state;
    switch (state) {
        case data_1.State.AwaitingDate:
            dms.dateParser(message);
            break;
        case data_1.State.ConfirmingDate:
            dms.dateConfirmer(message);
            break;
        case data_1.State.AwaitingTime:
            dms.timeParser(message);
            break;
        case data_1.State.ConfirmingTime:
            dms.timeConfirmer(message);
            break;
        case data_1.State.AwaitingGender:
            dms.genderParser(message);
            break;
        case data_1.State.ConfirmingGender:
            dms.genderConfirmer(message);
            break;
    }
}
exports.handleDM = handleDM;
function handleEvents() {
    timers_1.setInterval(() => {
        if (!utils.areConfigsSet())
            return;
        utils.log("periodic 'shouldRecalculateUtcs'");
        if (events.shouldRecalculateUtcs()) {
            utils.log("periodic 'recalculateUtcsForThisYear'");
            events.recalculateUtcsForThisYear();
        }
    }, bdayEventInterval);
    timers_1.setInterval(() => {
        const config = data_1.getConfig();
        if (!utils.areConfigsSet() || !config.enabled)
            return;
        utils.log("periodic 'announceBirthdays'");
        events.announceBirthdays();
    }, bdayEventInterval);
    timers_1.setInterval(() => {
        utils.log("periodic 'announceReminders'");
        events.announceReminders();
    }, reminderEventInterval);
}
exports.handleEvents = handleEvents;
