import * as discord from 'discord.js';
import * as utils from './utils';
import { State, getData, getConfig, getUser, saveConfig, Birthday, RoleState } from './data';
import { numberToMonth } from './dmcommands'; 
import * as moment from 'moment-timezone';
import { self } from '.';

export function help(message: discord.Message): void {
    const prefix = process.env.COMMAND;

    const embed = new discord.MessageEmbed()
        .setAuthor(`~~ You used the ${prefix}help command! ~~`, self().user.avatarURL())
        .setColor("#FF0000")
        .setFooter("For more info, ask Pool#5926!")
        .setTitle("Here's what I can do:")
        .addField(`${prefix}birthday`, "Configure your birthday so I'll announce it!")
        .addField(`${prefix}birthday some person`, "Mention someone or write their name/nickname and I'll tell you their birthday.")
        .addField(`${prefix}rolename`, "Give your birthday role a name of your choosing.")
        .addField(`${prefix}rolecolor`, "Give your birthday role your preferred color.")
        .addField(`${prefix}nextbirthday`, "Check when I'll announce the next birthday.")
        .addField(`${prefix}message / ${prefix}channel / ${prefix}roles / ${prefix}enable / ${prefix}disable`, 
                    "Announcements setup. Admin-only.");

    utils.sendEmbed(message, embed);
}

export async function birthday(message: discord.Message, args: string[]): Promise<void> {
    if (args.length >= 1) {
        spybirthday(message, args);
        return;
    }

    const data = getData();

    const userState = data[message.author.id]?.state ?? State.None;
    if (userState === State.Done) {
        utils.send(message, "You've already configured your birthday!");
        return;
    }

    if (userState !== State.None) {
        utils.send(message, "Please finish the configuration process in your DMs first!");
        return;
    }

    const dm = await message.author.createDM();
    utils.send(dm, 
        "Alright, let's configure your birthday notification!\n" +
        "Firstly, what's your birth **day** and **month**?\n" +
        "\n" +
        "Please answer in a format like `30/1` or `July 20`."
    );
    data[message.author.id] = { state: State.AwaitingDate, roleState: RoleState.None };
}

async function spybirthday(message: discord.Message, args: string[]): Promise<void> {
    let targetId: string;

    if (args.length === 1 && args[0].startsWith("<@")) {
        // mentioned a user
        targetId = args[0].replace(/<|@|!|>/g, "");
    } else {
        // wrote a user's name
        const name = args.join(" ").toLowerCase();
        const members = await message.guild.members.fetch();
        let member = members.find(member => name === member.user.username?.toLowerCase()) ??
                     members.find(member => name === member.nickname?.toLowerCase());
        targetId = member?.id;
    }

    if (targetId === undefined) {
        utils.send(message, "Sorry, I don't recognise that user at all!");
        return;
    }

    const bday = getData()[targetId];

    if (!bday) {
        utils.send(message, "That person hasn't configured their birthday yet.");
        return;
    }

    utils.send(message, `Their birthday will happen on ${numberToMonth(bday.month)} ${bday.day}, in the ${bday.tz} timezone!`);
}

export async function nextbirthday(message: discord.Message): Promise<void> {
    const config = getConfig();
    const data = getData();

    const nowUtc = moment().utc().valueOf();
    let closestUserId: string, closestUtc = Infinity, pad = utils.pad;
    for (const user in data) {
        const bday = data[user];
        if (bday.state === State.Done) { // bday is fully configured
            let bdayUtc: number;
            if (bday.utcStart >= nowUtc) { // will happen this year
                bdayUtc = bday.utcStart;
            } else { // will happen next year
                const dateStr = `${moment().year()+1}-${pad(bday.month)}-${pad(bday.day)} 00:00`;
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
    } else {
        const guild = await self().guilds.fetch(config.serverId);
        const member = await guild.members.fetch(closestUserId);
        const bday = data[closestUserId];
        let response = `The next birthday is that of ${utils.serverMemberName(member)}. ` +
            `It will happen on ${numberToMonth(bday.month)} ${bday.day}, in the ${bday.tz} timezone.`;
        utils.send(message, response);
    }
}

export function message(message: discord.Message): void {
    if (!utils.isAdmin(message) && !utils.isOwner(message)) {
        utils.send(message, "You must be an administrator to use this command!");
        return;
    }

    const config = getConfig();

    let text = message.content.replace(/(\$message |\$message)/, "");
    if (text.trim() !== "") config.announcement = text;
    const expanded = utils.resolveBirthdayMessage(message.author.id);
    if (expanded.length > 1995) config.announcement = undefined; // revert

    const missing = enumerateMissing();

    let response =
        "• You can type `@user@` in the birthday message where you want me to mention the person.\n" +
        (missing ? `• You still haven't set ${missing}.\n` : "") +
        "\n";

    if (config.announcement !== undefined) { // set
        saveConfig();
        if (response.length + expanded.length > 1800) { // too large to preview
            response += "You've successfully set a birthday message but it's too large to preview!";
        } else { // preview
            response += "Birthday messages will look like this (remember I'll post a random image alongside the message too):\n" +
                        "\n" +
                        expanded;
        }
    } else { // not set
        if (expanded.length > 1995) { // too large
            response += "The message gets way too big when I convert `@user` to real mentions! Please pick a shorter message.";
        } else { // no input
            response += `To set a birthday message, type:\n` +
                        `${utils.usage("message", "my small or very long message")}`;
        }
    }

    utils.send(message, response);
}

export async function channel(message: discord.Message): Promise<void> {
    if (!utils.isAdmin(message) && !utils.isOwner(message)) {
        utils.send(message, "You must be an administrator to use this command!");
        return;
    }

    const config = getConfig();

    let text = message.content.replace(/(\$channel |\$channel)/, "").trim();
    const parsed = await parseChannel(text, message.guild);
    if (parsed.valid) {
        config.announcementChannelId = parsed.id;
        config.serverId = message.guild.id;
    }

    const missing = enumerateMissing();

    let response = (missing ? `• You still haven't set ${missing}.\n` : "") +
                    "\n";

    if (config.announcementChannelId !== undefined) { // set
        saveConfig();
        response += `Birthday messages will be posted to ${text}.`;
    } else { // not set
        if (text === "") { // no input
            response += `To set a channel for birthday announcements, type:\n` +
                `${utils.usage("channel", "#the-channel-name")}`;
        } else { // bad input
            response += "That doesn't seem to be a valid text channel. Please retry.";
        } 
    }

    utils.send(message, response);
}

export function roles(message: discord.Message): void {
    if (!utils.isAdmin(message) && !utils.isOwner(message)) {
        utils.send(message, "You must be an administrator to use this command!");
        return;
    }

    const config = getConfig();
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
        saveConfig();
        response += "I've spotted all the special roles I need! ";
        response += `I also found ${roles.length} birthday ${roles.length === 1 ? "role" : "roles"} which I'll automatically manage.`;
    } else { // not set
        response += "\n" +
                    "To set birthday roles, be sure to create all the special roles I mentioned and then type:\n" +
                    `${utils.usage("roles")}`;
    }

    utils.send(message, response);
}

export function enable(message: discord.Message): void {
    if (!utils.isAdmin(message) && !utils.isOwner(message)) {
        utils.send(message, "You must be an administrator to use this command!");
        return;
    }

    const config = getConfig();
    config.enabled = true;
    saveConfig();

    utils.send(message, "I'll now begin announcing birthdays if all configurations are complete.");
}

export function disable(message: discord.Message): void {
    if (!utils.isAdmin(message) && !utils.isOwner(message)) {
        utils.send(message, "You must be an administrator to use this command!");
        return;
    }

    const config = getConfig();
    config.enabled = false;
    saveConfig();

    utils.send(message, "I'll now stop announcing birthdays.");
}

export async function rolename(message: discord.Message): Promise<void> {
    const user = getUser(message);

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
        } else { // success
            try {
                await role.setName(text, "By the user's birthday request.");
                utils.send(message, "I've changed the name of your birthday role!");
            } catch (e) {
                utils.send(message, "Something went wrong - I don't seem to have the permission to modify your role.");
            }
        }
    } else { // no input
        utils.send(message, "To give your role a new name, type:\n" +
                            `${utils.usage("rolename", "the new name")}`);
    }
}

export async function rolecolor(message: discord.Message): Promise<void> {
    const user = getUser(message);

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
                await role.setColor(parsed.color, "By the user's birthday request.");
                utils.send(message, "I've changed the color of your birthday role!");
            } catch (e) {
                utils.send(message, "Something went wrong - I don't seem to have the permission to modify your role.");
            }
        } else { // invalid
            utils.send(message, "That color hex code seems to be invalid. Please pick one from here:\n" +
                                "https://www.color-hex.com/");
        }
    } else { // no input
        utils.send(message, "To give your role a new color, type:\n" +
                            `${utils.usage("rolecolor", "#hexcode")}\n` +
                            "You can find the hex code for a color (for example, `#9a72cc`) here:\n" +
                            "https://www.color-hex.com/");
    }
}

function enumerateMissingTitleRoles(roles: string[]): string {
    const missing: string[] = [];
    if (!roles[0]) missing.push("**Birthday Boy**");
    if (!roles[1]) missing.push("**Birthday Girl**");
    if (!roles[2]) missing.push("**Birthday Cutie**");

    switch (missing.length) {
        case 1: return `the role ${missing[0]}`;
        case 2: return `the roles ${missing[0]} and ${missing[1]}`;
        case 3: return `the roles ${missing[0]}, ${missing[1]} and ${missing[2]}`;
    }
}

function enumerateMissing(): string {
    const config = getConfig();

    const rolesCheck = 
        {set: config.roleIds !== undefined, name: "birthday roles **($roles)**"};
    const messageCheck = 
        {set: config.announcement !== undefined, name: "birthday message **($message)**"};
    const channelCheck = 
        {set: config.announcementChannelId !== undefined, name: "birthday announcement channel **($channel)**"};

    const missing = [rolesCheck, messageCheck, channelCheck].filter(check => !check.set);

    switch (missing.length) {
        case 1: return `the ${missing[0].name}`;
        case 2: return `the ${missing[0].name} and the ${missing[1].name}`;
        case 3: return `the ${missing[0].name}, the ${missing[1].name} and the ${missing[2].name}`;
    }
}

async function parseChannel(text: string, guild: discord.Guild): Promise<{valid: boolean, id?: string}> {
    const channelId = text.replace(/[<#>]/g, "");

    const channel = await utils.getIfExists(self().channels, channelId);

    if (channel && channel instanceof discord.TextChannel)
        return { valid: true, id: channel.id };
    else
        return { valid: false };
}

function parseColor(text: string): {valid: boolean, color?: string} {
    let hexcode = text.replace(/#/g, "").trim();

    if (hexcode.length !== 3 && hexcode.length !== 6) return { valid: false };
    for (const char of hexcode.toLowerCase()) {
        if (!/[0123456789abcdef]/.test(char))
            return { valid: false };
    }

    // discord refuses to set #000
    if (hexcode === "000" || hexcode === "000000") hexcode = "010101";
    // duplicate all chars if length is 3
    if (hexcode.length === 3) hexcode = hexcode.split("").map(c => c+c).join("");
    return { valid: true, color: hexcode };
}

function getBirthdayRoles(guild: discord.Guild): string[] {
    const roles: string[] = [];

    for (const [name, role] of guild.roles.cache) {
        if (role.name.toLowerCase() === "birthday role")
            roles.push(role.id);
    }

    return roles;
}

function getBirthdayTitleRolesLength(roles: string[]): number {
    return roles.reduce((prev, cur) => cur ? prev + 1 : prev, 0);
}

function getBirthdayTitleRoles(guild: discord.Guild): string[] {
    const roles: string[] = [];

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

function getBirthdayRole(message: discord.Message): discord.Role {
    const config = getConfig();

    if (!config.roleIds) return undefined;

    const userRoles = message.guild.member(message.author).roles.cache;
    for (const [name, role] of userRoles) {
        if (config.roleIds.includes(role.id)) return role;
    }
}