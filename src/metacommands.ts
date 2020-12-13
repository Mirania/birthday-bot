import * as utils from './utils';
import * as events from './events';
import * as discord from 'discord.js';
import * as data from './data';

export function checkbdays(message: discord.Message): void {
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

export function checkreminders(message: discord.Message): void {
    if (!utils.isOwner(message)) {
        utils.send(message, "You must be a bot owner to use this command!");
        return;
    }

    events.announceReminders();
    utils.log("'checkreminders' done.");
}

export function recalculate(message: discord.Message): void {
    if (!utils.isOwner(message)) {
        utils.send(message, "You must be a bot owner to use this command!");
        return;
    }

    events.recalculateUtcsForThisYear();
    utils.log("'recalculate' done.");
}

export function load(message: discord.Message): void {
    if (!utils.isOwner(message)) {
        utils.send(message, "You must be a bot owner to use this command!");
        return;
    }

    data.loadImmediate();
    utils.log("'load' done.");
}

export function save(message: discord.Message): void {
    if (!utils.isOwner(message)) {
        utils.send(message, "You must be a bot owner to use this command!");
        return;
    }

    data.saveImmediate();
    utils.log("'save' done.");
}

export function invite(message: discord.Message): void {
    if (!utils.isOwner(message)) {
        utils.send(message, "You must be a bot owner to use this command!");
        return;
    }

    const link = `https://discordapp.com/oauth2/authorize?client_id=${process.env.BOT_ID}` +
                 `&scope=bot&permissions=${process.env.BOT_PERMS}`;

    utils.send(message, `Here you go!\n\n${link}`);
}