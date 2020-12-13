import * as discord from 'discord.js';
import * as utils from './utils';
import * as server from './servercommands';
import * as dms from './dmcommands';
import * as meta from './metacommands';
import * as events from './events';
import * as moment from 'moment-timezone';
import { State, getData, getConfig } from './data';
import { setInterval } from 'timers';

type CommandFunction = (message: discord.Message, args?: string[]) => void | Promise<void>;

const commandList: { [name: string]: CommandFunction } = { ...server, ...meta};
const bdayEventInterval = utils.minutes(15);
const reminderEventInterval = utils.seconds(45);

export function handleCommand(message: discord.Message): void {
    const content = message.content.split(" ").filter(item => item!==""); 
    const name = content[0].slice(1, content[0].length);
    const args = content.splice(1, content.length);

    if (commandList[name]) commandList[name](message, args);
}

export function handleDM(message: discord.Message): void {
    const data = getData();
    const state = data[message.author.id]?.state;

    switch (state) {
        case State.AwaitingDate:
            dms.dateParser(message);
            break;
        case State.ConfirmingDate:
            dms.dateConfirmer(message);
            break;
        case State.AwaitingTime:
            dms.timeParser(message);
            break;
        case State.ConfirmingTime:
            dms.timeConfirmer(message);
            break;
        case State.AwaitingGender:
            dms.genderParser(message);
            break;
        case State.ConfirmingGender:
            dms.genderConfirmer(message);
            break;
    }
}

export function handleEvents(): void {
    setInterval(() => {
        if (!utils.areConfigsSet()) return;
        utils.log("periodic 'shouldRecalculateUtcs'");
        if (events.shouldRecalculateUtcs()) {
            utils.log("periodic 'recalculateUtcsForThisYear'");
            events.recalculateUtcsForThisYear();
        }
    }, bdayEventInterval);

    setInterval(() => {
        const config = getConfig();

        if (!utils.areConfigsSet() || !config.enabled) return;
        utils.log("periodic 'announceBirthdays'");
        events.announceBirthdays();
    }, bdayEventInterval);

    setInterval(() => {
        utils.log("periodic 'announceReminders'");
        events.announceReminders();
    }, reminderEventInterval);
}