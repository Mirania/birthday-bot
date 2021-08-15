"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUnknownMemberError = void 0;
/**
 * member is currently unknown, e.g. their account got wiped from discord
 */
function isUnknownMemberError(error) {
    return (error === null || error === void 0 ? void 0 : error.name) === "DiscordAPIError" && (error === null || error === void 0 ? void 0 : error.message) === "Unknown Member";
}
exports.isUnknownMemberError = isUnknownMemberError;
