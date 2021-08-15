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
exports.invite = exports.birthday = void 0;
const utils = require("./utils");
const data_1 = require("./data");
function birthday(message) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const data = data_1.getData();
        if (((_b = (_a = data[message.author.id]) === null || _a === void 0 ? void 0 : _a.state) !== null && _b !== void 0 ? _b : 0) !== data_1.State.None) {
            utils.send(message, "Please finish the configuration process in your DMs first!");
            return;
        }
        const dm = yield message.author.createDM();
        utils.send(dm, "Alright, let's configure your birthday notification!\n" +
            "Firstly, what's your birth **day** and **month**?\n" +
            "\n" +
            "Please answer in a format like `30/1` or `July 20`.");
        data[message.author.id] = { state: data_1.State.AwaitingDate };
    });
}
exports.birthday = birthday;
function invite(message) {
    let link = `https://discordapp.com/oauth2/authorize?client_id=${process.env.BOT_ID}` +
        `&scope=bot&permissions=${process.env.BOT_PERMS}`;
    utils.send(message, `Here you go!\n\n${link}`);
}
exports.invite = invite;
