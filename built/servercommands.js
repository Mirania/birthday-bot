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
exports.periodicreminder = exports.reminder = exports.rolecolor = exports.rolename = exports.disable = exports.enable = exports.roles = exports.channel = exports.message = exports.nextbirthday = exports.birthday = exports.help = void 0;
const discord = require("discord.js");
const utils = require("./utils");
const data_1 = require("./data");
const dmcommands_1 = require("./dmcommands");
const moment = require("moment-timezone");
const _1 = require(".");
function help(message) {
    const prefix = process.env.COMMAND;
    const embed = new discord.MessageEmbed()
        .setAuthor(`~~ You used the ${prefix}help command! ~~`, _1.self().user.avatarURL())
        .setColor("#FF0000")
        .setFooter("For more info, ask Pool#5926!")
        .setTitle("Here's what I can do:")
        .addField(`${prefix}birthday`, "Configure your birthday so I'll announce it!")
        .addField(`${prefix}birthday some person`, "Mention someone or write their name/nickname and I'll tell you their birthday.")
        .addField(`${prefix}rolename`, "Give your birthday role a name of your choosing.")
        .addField(`${prefix}rolecolor`, "Give your birthday role your preferred color.")
        .addField(`${prefix}nextbirthday`, "Check when I'll announce the next birthday.")
        .addField(`${prefix}reminder / ${prefix}periodicreminder`, "Write a message that I'll remind you of later.")
        .addField(`${prefix}message / ${prefix}channel / ${prefix}roles / ${prefix}enable / ${prefix}disable`, "Announcements setup. Admin-only.");
    utils.sendEmbed(message, embed);
}
exports.help = help;
function birthday(message, args) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        if (args.length >= 1) {
            spybirthday(message, args);
            return;
        }
        const data = data_1.getData();
        const userState = (_b = (_a = data[message.author.id]) === null || _a === void 0 ? void 0 : _a.state) !== null && _b !== void 0 ? _b : data_1.State.None;
        if (userState === data_1.State.Done) {
            utils.send(message, "You've already configured your birthday!");
            return;
        }
        if (userState !== data_1.State.None) {
            utils.send(message, "Please finish the configuration process in your DMs first!");
            return;
        }
        const dm = yield message.author.createDM();
        utils.send(dm, "Alright, let's configure your birthday notification!\n" +
            "Firstly, what's your birth **day** and **month**?\n" +
            "\n" +
            "Please answer in a format like `30/1` or `July 20`.");
        data[message.author.id] = { state: data_1.State.AwaitingDate, roleState: data_1.RoleState.None };
    });
}
exports.birthday = birthday;
function spybirthday(message, args) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let targetId;
        if (args.length === 1 && args[0].startsWith("<@")) {
            // mentioned a user
            targetId = args[0].replace(/<|@|!|>/g, "");
        }
        else {
            // wrote a user's name
            const name = args.join(" ").toLowerCase();
            const members = yield message.guild.members.fetch();
            let member = (_a = members.find(member => { var _a; return name === ((_a = member.user.username) === null || _a === void 0 ? void 0 : _a.toLowerCase()); })) !== null && _a !== void 0 ? _a : members.find(member => { var _a; return name === ((_a = member.nickname) === null || _a === void 0 ? void 0 : _a.toLowerCase()); });
            targetId = member === null || member === void 0 ? void 0 : member.id;
        }
        if (targetId === undefined) {
            utils.send(message, "Sorry, I don't recognise that user at all!");
            return;
        }
        const bday = data_1.getData()[targetId];
        if (!bday) {
            utils.send(message, "That person hasn't configured their birthday yet.");
            return;
        }
        utils.send(message, `Their birthday will happen on ${dmcommands_1.numberToMonth(bday.month)} ${bday.day}, in the ${bday.tz} timezone!`);
    });
}
function nextbirthday(message) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = data_1.getConfig();
        const data = data_1.getData();
        const nowUtc = moment().utc().valueOf();
        let closestUserId, closestUtc = Infinity, pad = utils.pad;
        for (const user in data) {
            const bday = data[user];
            if (bday.state === data_1.State.Done) { // bday is fully configured
                let bdayUtc;
                if (bday.utcStart >= nowUtc) { // will happen this year
                    bdayUtc = bday.utcStart;
                }
                else { // will happen next year
                    const dateStr = `${moment().year() + 1}-${pad(bday.month)}-${pad(bday.day)} 00:00`;
                    bdayUtc = moment.tz(dateStr, bday.tz.replace(/ /g, "_")).utc().valueOf();
                }
                const diff = bdayUtc - nowUtc;
                if (diff < closestUtc) {
                    closestUtc = diff;
                    closestUserId = user;
                }
            }
        }
        if (closestUtc === Infinity) {
            utils.send(message, "I have no upcoming birthdays configured.");
            return;
        }
        else {
            const guild = yield _1.self().guilds.fetch(config.serverId);
            const member = yield guild.members.fetch(closestUserId);
            const bday = data[closestUserId];
            let response = `The next birthday is that of ${utils.serverMemberName(member)}. ` +
                `It will happen on ${dmcommands_1.numberToMonth(bday.month)} ${bday.day}, in the ${bday.tz} timezone.`;
            utils.send(message, response);
        }
    });
}
exports.nextbirthday = nextbirthday;
function message(message) {
    if (!utils.isAdmin(message) && !utils.isOwner(message)) {
        utils.send(message, "You must be an administrator to use this command!");
        return;
    }
    const config = data_1.getConfig();
    let text = message.content.replace(/(\$message |\$message)/, "");
    if (text.trim() !== "")
        config.announcement = text;
    const expanded = utils.resolveBirthdayMessage(message.author.id);
    if (expanded.length > 1995)
        config.announcement = undefined; // revert
    const missing = enumerateMissing();
    let response = "• You can type `@user@` in the birthday message where you want me to mention the person.\n" +
        (missing ? `• You still haven't set ${missing}.\n` : "") +
        "\n";
    if (config.announcement !== undefined) { // set
        data_1.saveConfig();
        if (response.length + expanded.length > 1800) { // too large to preview
            response += "You've successfully set a birthday message but it's too large to preview!";
        }
        else { // preview
            response += "Birthday messages will look like this (remember I'll post a random image alongside the message too):\n" +
                "\n" +
                expanded;
        }
    }
    else { // not set
        if (expanded.length > 1995) { // too large
            response += "The message gets way too big when I convert `@user` to real mentions! Please pick a shorter message.";
        }
        else { // no input
            response += `To set a birthday message, type:\n` +
                `${utils.usage("message", "my small or very long message")}`;
        }
    }
    utils.send(message, response);
}
exports.message = message;
function channel(message) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!utils.isAdmin(message) && !utils.isOwner(message)) {
            utils.send(message, "You must be an administrator to use this command!");
            return;
        }
        const config = data_1.getConfig();
        let text = message.content.replace(/(\$channel |\$channel)/, "").trim();
        const parsed = yield parseChannel(text, message.guild);
        if (parsed.valid) {
            config.announcementChannelId = parsed.id;
            config.serverId = message.guild.id;
        }
        const missing = enumerateMissing();
        let response = (missing ? `• You still haven't set ${missing}.\n` : "") +
            "\n";
        if (config.announcementChannelId !== undefined) { // set
            data_1.saveConfig();
            response += `Birthday messages will be posted to ${text}.`;
        }
        else { // not set
            if (text === "") { // no input
                response += `To set a channel for birthday announcements, type:\n` +
                    `${utils.usage("channel", "#the-channel-name")}`;
            }
            else { // bad input
                response += "That doesn't seem to be a valid text channel. Please retry.";
            }
        }
        utils.send(message, response);
    });
}
exports.channel = channel;
function roles(message) {
    if (!utils.isAdmin(message) && !utils.isOwner(message)) {
        utils.send(message, "You must be an administrator to use this command!");
        return;
    }
    const config = data_1.getConfig();
    const roles = getBirthdayRoles(message.guild);
    const titleRoles = getBirthdayTitleRoles(message.guild);
    const titleRolesLength = getBirthdayTitleRolesLength(titleRoles);
    const success = roles.length > 0 && titleRolesLength === 3;
    if (success) {
        config.roleIds = roles;
        config.titleRoleIds = titleRoles;
    }
    const missing = enumerateMissing();
    let response = (missing ? `• You still haven't set ${missing}.\n` : "") +
        "\n" +
        "I'm searching for some roles in this server.\n" +
        "I need 3 roles with the names **Birthday Boy**, **Birthday Girl** and **Birthday Cutie**.\n" +
        "I'm also looking for a few roles with the name **Birthday Role** - users will be able to edit those.\n" +
        "\n";
    if (titleRolesLength !== 3) {
        response += `I couldn't find ${enumerateMissingTitleRoles(titleRoles)}.\n`;
    }
    if (roles.length === 0) {
        response += "I didn't find any role named **Birthday Role**.\n";
    }
    if (success) { // set
        data_1.saveConfig();
        response += "I've spotted all the special roles I need! ";
        response += `I also found ${roles.length} birthday ${roles.length === 1 ? "role" : "roles"} which I'll automatically manage.`;
    }
    else { // not set
        response += "\n" +
            "To set birthday roles, be sure to create all the special roles I mentioned and then type:\n" +
            `${utils.usage("roles")}`;
    }
    utils.send(message, response);
}
exports.roles = roles;
function enable(message) {
    if (!utils.isAdmin(message) && !utils.isOwner(message)) {
        utils.send(message, "You must be an administrator to use this command!");
        return;
    }
    const config = data_1.getConfig();
    config.enabled = true;
    data_1.saveConfig();
    utils.send(message, "I'll now begin announcing birthdays if all configurations are complete.");
}
exports.enable = enable;
function disable(message) {
    if (!utils.isAdmin(message) && !utils.isOwner(message)) {
        utils.send(message, "You must be an administrator to use this command!");
        return;
    }
    const config = data_1.getConfig();
    config.enabled = false;
    data_1.saveConfig();
    utils.send(message, "I'll now stop announcing birthdays.");
}
exports.disable = disable;
function rolename(message) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = data_1.getUser(message);
        if (!message.guild) {
            utils.send(message, "Please use this command in a server instead.");
            return;
        }
        if (!user) {
            utils.send(message, "You haven't configured your birthday yet. Please use **$birthday** to do so.");
            return;
        }
        const nowUtc = moment().utc().valueOf();
        if (!utils.isHavingBirthday(user, nowUtc)) {
            utils.send(message, "You can only use this command during your birthday!");
            return;
        }
        const role = getBirthdayRole(message);
        if (!role) {
            utils.send(message, "You don't seem to have a birthday role you can edit.");
            return;
        }
        let text = message.content.replace(/(\$rolename |\$rolename)/, "");
        if (text.trim() !== "") { // input
            if (text.length > 30) { // too long
                utils.send(message, "That role name is way too long, please pick a shorter one.");
            }
            else { // success
                try {
                    yield role.setName(text, "By the user's birthday request.");
                    utils.send(message, "I've changed the name of your birthday role!");
                }
                catch (e) {
                    utils.send(message, "Something went wrong - I don't seem to have the permission to modify your role.");
                }
            }
        }
        else { // no input
            utils.send(message, "To give your role a new name, type:\n" +
                `${utils.usage("rolename", "the new name")}`);
        }
    });
}
exports.rolename = rolename;
function rolecolor(message) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = data_1.getUser(message);
        if (!message.guild) {
            utils.send(message, "Please use this command in a server instead.");
            return;
        }
        if (!user) {
            utils.send(message, "You haven't configured your birthday yet. Please use **$birthday** to do so.");
            return;
        }
        const nowUtc = moment().utc().valueOf();
        if (!utils.isHavingBirthday(user, nowUtc)) {
            utils.send(message, "You can only use this command during your birthday!");
            return;
        }
        const role = getBirthdayRole(message);
        if (!role) {
            utils.send(message, "Something went wrong - I don't recognise any of the roles you have.");
            return;
        }
        let text = message.content.replace(/(\$rolecolor |\$rolecolor)/, "");
        const parsed = parseColor(text);
        if (text.trim() !== "") { // input
            if (parsed.valid) { // valid
                try {
                    yield role.setColor(parsed.color, "By the user's birthday request.");
                    utils.send(message, "I've changed the color of your birthday role!");
                }
                catch (e) {
                    utils.send(message, "Something went wrong - I don't seem to have the permission to modify your role.");
                }
            }
            else { // invalid
                utils.send(message, "That color hex code seems to be invalid. Please pick one from here:\n" +
                    "https://www.color-hex.com/");
            }
        }
        else { // no input
            utils.send(message, "To give your role a new color, type:\n" +
                `${utils.usage("rolecolor", "#hexcode")}\n` +
                "You can find the hex code for a color (for example, `#9a72cc`) here:\n" +
                "https://www.color-hex.com/");
        }
    });
}
exports.rolecolor = rolecolor;
function reminder(message, args) {
    buildReminder(message, args, false);
}
exports.reminder = reminder;
function periodicreminder(message, args) {
    if (!utils.isAdmin(message) && !utils.isOwner(message)) {
        utils.send(message, "You must be an administrator to use this command!");
        return;
    }
    buildReminder(message, args, true);
}
exports.periodicreminder = periodicreminder;
function buildReminder(message, args, isPeriodic) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (!message.guild) {
            utils.send(message, "Please use this command in a server instead.");
            return;
        }
        const usage = `${utils.usage("reminder", "1d10h20m It is time!")}\n` +
            "This would make me ping you saying \"It is time!\" in 1 day, 10 hours and 20 minutes from now.\n" +
            "You can use the units `year/y`, `month/mo`, `day/d`, `hour/h`, and `minute/m`.";
        if (args.length < 2) {
            utils.send(message, `To set a reminder, you can type:\n${usage}`);
            return;
        }
        const tokens = (_a = args[0].match(/[0-9]+|[A-Za-z]+/g)) !== null && _a !== void 0 ? _a : [,];
        const timeValues = {};
        for (let i = 0; i < tokens.length; i += 2) {
            let value;
            if (i + 1 >= tokens.length || timeValues[tokens[i + 1]] != undefined || isNaN(value = Number(tokens[i])) || value <= 0) {
                utils.send(message, `This time seems to be invalid. Try something like:\n${usage}`);
                return;
            }
            timeValues[tokens[i + 1]] = value;
        }
        const text = args.slice(1).join(" ");
        const date = moment();
        let offset = 0;
        if (text.length > 1000) {
            utils.send(message, `That message is way too long!`);
            return;
        }
        for (const unit in timeValues) {
            const value = timeValues[unit];
            switch (unit) {
                case "year":
                case "y":
                    date.add(value, "year");
                    offset += value * 31104000;
                    break;
                case "month":
                case "mo":
                    date.add(value, "month");
                    offset += value * 2592000;
                    break;
                case "day":
                case "d":
                    date.add(value, "day");
                    offset += value * 86400;
                    break;
                case "hour":
                case "h":
                    date.add(value, "hour");
                    offset += value * 3600;
                    break;
                case "minute":
                case "m":
                    date.add(value, "minute");
                    offset += value * 60;
                    break;
                default:
                    utils.send(message, `This time seems to be invalid. Try something like:\n${usage}`);
                    return;
            }
        }
        if (offset < 60) {
            utils.send(message, `1 minute into the future is the earliest you can set a reminder to!`);
            return;
        }
        if (offset > 31104000) {
            utils.send(message, `1 year into the future is the latest you can set a reminder to!`);
            return;
        }
        const reminder = {
            isPeriodic,
            text,
            timestamp: date.utc().valueOf(),
            authorId: message.author.id,
            channelId: message.channel.id
        };
        if (isPeriodic)
            reminder.timeValues = timeValues;
        yield data_1.setReminder(reminder);
        utils.send(message, "Your reminder has been set!");
    });
}
function enumerateMissingTitleRoles(roles) {
    const missing = [];
    if (!roles[0])
        missing.push("**Birthday Boy**");
    if (!roles[1])
        missing.push("**Birthday Girl**");
    if (!roles[2])
        missing.push("**Birthday Cutie**");
    switch (missing.length) {
        case 1: return `the role ${missing[0]}`;
        case 2: return `the roles ${missing[0]} and ${missing[1]}`;
        case 3: return `the roles ${missing[0]}, ${missing[1]} and ${missing[2]}`;
    }
}
function enumerateMissing() {
    const config = data_1.getConfig();
    const rolesCheck = { set: config.roleIds !== undefined, name: "birthday roles **($roles)**" };
    const messageCheck = { set: config.announcement !== undefined, name: "birthday message **($message)**" };
    const channelCheck = { set: config.announcementChannelId !== undefined, name: "birthday announcement channel **($channel)**" };
    const missing = [rolesCheck, messageCheck, channelCheck].filter(check => !check.set);
    switch (missing.length) {
        case 1: return `the ${missing[0].name}`;
        case 2: return `the ${missing[0].name} and the ${missing[1].name}`;
        case 3: return `the ${missing[0].name}, the ${missing[1].name} and the ${missing[2].name}`;
    }
}
function parseChannel(text, guild) {
    return __awaiter(this, void 0, void 0, function* () {
        const channelId = text.replace(/[<#>]/g, "");
        const channel = yield utils.getIfExists(_1.self().channels, channelId);
        if (channel && channel instanceof discord.TextChannel)
            return { valid: true, id: channel.id };
        else
            return { valid: false };
    });
}
function parseColor(text) {
    let hexcode = text.replace(/#/g, "").trim();
    if (hexcode.length !== 3 && hexcode.length !== 6)
        return { valid: false };
    for (const char of hexcode.toLowerCase()) {
        if (!/[0123456789abcdef]/.test(char))
            return { valid: false };
    }
    // discord refuses to set #000
    if (hexcode === "000" || hexcode === "000000")
        hexcode = "010101";
    // duplicate all chars if length is 3
    if (hexcode.length === 3)
        hexcode = hexcode.split("").map(c => c + c).join("");
    return { valid: true, color: hexcode };
}
function getBirthdayRoles(guild) {
    const roles = [];
    for (const [name, role] of guild.roles.cache) {
        if (role.name.toLowerCase() === "birthday role")
            roles.push(role.id);
    }
    return roles;
}
function getBirthdayTitleRolesLength(roles) {
    return roles.reduce((prev, cur) => cur ? prev + 1 : prev, 0);
}
function getBirthdayTitleRoles(guild) {
    const roles = [];
    for (const [name, role] of guild.roles.cache) {
        const rolename = role.name.toLowerCase();
        switch (rolename) {
            case "birthday boy":
                roles[0] = role.id;
                break;
            case "birthday girl":
                roles[1] = role.id;
                break;
            case "birthday cutie":
                roles[2] = role.id;
                break;
        }
    }
    return roles;
}
function getBirthdayRole(message) {
    const config = data_1.getConfig();
    if (!config.roleIds)
        return undefined;
    const userRoles = message.guild.member(message.author).roles.cache;
    for (const [name, role] of userRoles) {
        if (config.roleIds.includes(role.id))
            return role;
    }
}
