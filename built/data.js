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
exports.getTimezoneOffsets = exports.getUser = exports.getRandomImage = exports.getData = exports.getConfig = exports.saveConfig = exports.saveUser = exports.saveImmediate = exports.loadImmediate = exports.init = exports.gatherImages = exports.RoleState = exports.State = exports.Gender = void 0;
const db = require("./firebase-module");
const moment = require("moment-timezone");
const utils = require("./utils");
const fs = require("fs");
var Gender;
(function (Gender) {
    Gender["Male"] = "Male";
    Gender["Female"] = "Female";
    Gender["Other"] = "Other";
})(Gender = exports.Gender || (exports.Gender = {}));
var State;
(function (State) {
    State[State["None"] = 0] = "None";
    State[State["AwaitingDate"] = 1] = "AwaitingDate";
    State[State["ConfirmingDate"] = 2] = "ConfirmingDate";
    State[State["AwaitingTime"] = 3] = "AwaitingTime";
    State[State["ConfirmingTime"] = 4] = "ConfirmingTime";
    State[State["AwaitingGender"] = 5] = "AwaitingGender";
    State[State["ConfirmingGender"] = 6] = "ConfirmingGender";
    State[State["Done"] = 7] = "Done";
})(State = exports.State || (exports.State = {}));
var RoleState;
(function (RoleState) {
    RoleState[RoleState["None"] = 0] = "None";
    RoleState[RoleState["Given"] = 1] = "Given";
    RoleState[RoleState["EditableRemaining"] = 2] = "EditableRemaining";
})(RoleState = exports.RoleState || (exports.RoleState = {}));
let config = {};
let data = {};
let images = [];
// while i give these timezones some offset values, these may change so i'll recalculate them anyway
const timezoneOffsets = {
    "Greenwich": 0,
    "Europe/London": 60,
    "Europe/Amsterdam": 120,
    "Europe/Moscow": 180,
    "Asia/Dubai": 240,
    "Iran": 270,
    "Asia/Tashkent": 300,
    "Asia/Calcutta": 330,
    "Asia/Katmandu": 345,
    "Asia/Dhaka": 360,
    "Asia/Yangon": 390,
    "Asia/Saigon": 420,
    "Singapore": 480,
    "Australia/Eucla": 525,
    "Japan": 540,
    "Australia/Darwin": 570,
    "Australia/Sydney": 600,
    "Australia/Lord_Howe": 630,
    "Pacific/Norfolk": 660,
    "Pacific/Auckland": 720,
    "Pacific/Chatham": 765,
    "Pacific/Apia": 780,
    "Pacific/Kiritimati": 840,
    "US/Aleutian": -540,
    "US/Alaska": -480,
    "America/New_York": -240,
    "Brazil/East": -180,
    "Canada/Central": -300,
    "America/El_Salvador": -360,
    "US/Arizona": -420,
    "Atlantic/South_Georgia": -120,
    "Canada/Newfoundland": -150,
    "Atlantic/Cape_Verde": -60,
    "US/Hawaii": -600,
    "US/Samoa": -660,
    "Etc/GMT+12": -720,
    "Pacific/Marquesas": -570
};
function fillTimezones() {
    for (const tz in timezoneOffsets) {
        timezoneOffsets[tz] = moment().tz(tz).utcOffset();
    }
}
function gatherImages() {
    if (!fs.existsSync("assets/"))
        return;
    for (const image of fs.readdirSync("assets/")) {
        if (image !== "Thumbs.db")
            images.push(`assets/${image}`);
    }
}
exports.gatherImages = gatherImages;
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        db.connect(process.env.FIREBASE_CREDENTIALS, process.env.FIREBASE_URL);
        yield loadImmediate();
    });
}
exports.init = init;
/**
 * Refreshes and loads everything.
 */
function loadImmediate() {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        fillTimezones();
        gatherImages();
        config = (_a = yield db.get("config/")) !== null && _a !== void 0 ? _a : { enabled: true, lastCalculatedUtcYear: moment().year() };
        data = (_b = yield db.get("data/")) !== null && _b !== void 0 ? _b : {};
    });
}
exports.loadImmediate = loadImmediate;
/**
 * Saves everything.
 */
function saveImmediate() {
    return __awaiter(this, void 0, void 0, function* () {
        yield db.post("config/", config);
        yield db.post("data/", data);
    });
}
exports.saveImmediate = saveImmediate;
function saveUser(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield db.post(`data/${userId}/`, data[userId]);
    });
}
exports.saveUser = saveUser;
function saveConfig() {
    return __awaiter(this, void 0, void 0, function* () {
        yield db.post("config/", config);
    });
}
exports.saveConfig = saveConfig;
function getConfig() {
    return config;
}
exports.getConfig = getConfig;
function getData() {
    return data;
}
exports.getData = getData;
// returns undefined if no pictures available
function getRandomImage() {
    if (images.length > 0)
        return utils.randomElement(images);
}
exports.getRandomImage = getRandomImage;
function getUser(message) {
    return data[message.author.id];
}
exports.getUser = getUser;
function getTimezoneOffsets() {
    return timezoneOffsets;
}
exports.getTimezoneOffsets = getTimezoneOffsets;
