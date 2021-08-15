/**
 * member is currently unknown, e.g. their account got wiped from discord
 */
export function isUnknownMemberError(error: any) {
    return error?.name === "DiscordAPIError" && error?.message === "Unknown Member";
}