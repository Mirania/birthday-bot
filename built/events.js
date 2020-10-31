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
exports.recalculateUtcsForThisYear = exports.shouldRecalculateUtcs = exports.announceBirthdays = void 0;
const data_1 = require("./data");
const moment = require("moment-timezone");
const utils = require("./utils");
const dmcommands_1 = require("./dmcommands");
const _1 = require(".");
// cleans up finished birthdays too
function announceBirthdays() {
    return __awaiter(this, void 0, void 0, function* () {
        const config = data_1.getConfig();
        const data = data_1.getData();
        const nowUtc = moment().utc().valueOf();
        const channel = yield _1.self().channels.fetch(config.announcementChannelId);
        for (const user in data) {
            const bday = data[user];
            if (bday.state !== data_1.State.Done)
                continue; // configuration incomplete
            const guild = yield _1.self().guilds.fetch(config.serverId);
            const member = yield utils.getIfExists(guild.members, user);
            if (!member)
                continue; // server member not found
            if (bday.announced === false && utils.isHavingBirthday(bday, nowUtc)) {
                // announce birthday
                let success = yield giveRoleToUser(member);
                if (success) {
                    bday.announced = true;
                    data_1.saveUser(user);
                    utils.send(channel, utils.resolveBirthdayMessage(user), data_1.getRandomImage());
                }
                else {
                    utils.send(channel, "I was going to announce a birthday but it seems I'm missing role permissions.");
                }
            }
            else if (bday.roleState === data_1.RoleState.Given && bday.utcEnd < nowUtc) {
                // remove title role
                yield removeTitleRoleFromUser(member);
                data_1.saveUser(user);
            }
            else if (bday.roleState === data_1.RoleState.EditableRemaining && bday.utcFinalize < nowUtc) {
                // remove editable role
                yield removeEditableRoleFromUser(member);
                data_1.saveUser(user);
            }
        }
    });
}
exports.announceBirthdays = announceBirthdays;
function shouldRecalculateUtcs() {
    const config = data_1.getConfig();
    const now = moment();
    if (config.lastCalculatedUtcYear >= now.year())
        return false;
    return now.month() === 0 && now.date() === 1;
}
exports.shouldRecalculateUtcs = shouldRecalculateUtcs;
function recalculateUtcsForThisYear() {
    const config = data_1.getConfig();
    const data = data_1.getData();
    const now = moment(), nowUtc = now.utc().valueOf();
    for (const user in data) {
        const bday = data[user];
        if (bday.month === undefined)
            continue;
        const utc = dmcommands_1.bdayUtc(bday);
        bday.utcStart = utc.start;
        bday.utcEnd = utc.end;
        bday.utcFinalize = utc.finalize;
        bday.announced = utc.end < nowUtc;
    }
    config.lastCalculatedUtcYear = now.year();
    data_1.saveConfig();
}
exports.recalculateUtcsForThisYear = recalculateUtcsForThisYear;
function giveRoleToUser(user) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const config = data_1.getConfig();
        const data = data_1.getData();
        let roleIndex = (_a = config.lastRoleUsedIndex) !== null && _a !== void 0 ? _a : 0;
        if (roleIndex >= config.roleIds.length)
            roleIndex = 0;
        try {
            // this is the static role
            const titleRoleIndex = getGenderedRoleIndex(data[user.id].gender);
            const titleRole = yield user.guild.roles.fetch(config.titleRoleIds[titleRoleIndex]);
            yield user.roles.add(titleRole, "Static birthday role.");
            // this is the editable role
            const editableRole = yield user.guild.roles.fetch(config.roleIds[roleIndex]);
            yield user.roles.add(editableRole, "Editable birthday role.");
            editableRole.setName("Birthday Role", "Resetting the editable birthday role name.");
            data[user.id].roleState = data_1.RoleState.Given;
            config.lastRoleUsedIndex = (roleIndex + 1) % config.roleIds.length;
            data_1.saveConfig();
            return true;
        }
        catch (e) {
            return false;
        }
    });
}
function removeEditableRoleFromUser(user) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = data_1.getConfig();
        const data = data_1.getData();
        try {
            // find the editable role
            const editableRole = user.roles.cache.find(r => config.roleIds.includes(r.id));
            if (editableRole)
                yield user.roles.remove(editableRole, "Expiration of editable birthday role.");
            data[user.id].roleState = data_1.RoleState.None;
        }
        catch (e) {
            utils.log(`Silently failed to remove editable role from user: ${e}`);
        }
    });
}
function removeTitleRoleFromUser(user) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = data_1.getConfig();
        const data = data_1.getData();
        try {
            // find the title role
            const titleRole = user.roles.cache.find(r => config.titleRoleIds.includes(r.id));
            if (titleRole)
                yield user.roles.remove(titleRole, "Expiration of static birthday role.");
            data[user.id].roleState = data_1.RoleState.EditableRemaining;
        }
        catch (e) {
            utils.log(`Silently failed to remove title role from user: ${e}`);
        }
    });
}
function getGenderedRoleIndex(gender) {
    switch (gender) {
        case data_1.Gender.Male: return 0;
        case data_1.Gender.Female: return 1;
        default: return 2;
    }
}
