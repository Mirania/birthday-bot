import { ActionRowBuilder, AutocompleteInteraction, ButtonBuilder, ButtonStyle, ChannelType, ChatInputCommandInteraction, Client, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { calcNextBirthday, getNextBirthdayFromList, getReadableDateString, getRelativeTimeString, getTimezones } from '../utils/time';
import { validateDay, validateTimezone } from '../utils/validators';
import * as database from '../database/database';
import { getRandomImageLink, prepareBirthdayMessage, prepareChannelMention, prepareUserMention } from '../utils/misc';
import * as moment from 'moment-timezone';
import { log } from "../utils/misc";

export const admin = {
    data: new SlashCommandBuilder()
        .setName('configure')
        .setDescription('Configure the birthday announcements.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel where the birthday announcements will be posted.')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('image')
                .setDescription('Post a festive image alongside the birthday announcements?')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to post. Any occurrences of <user> will be replaced with a mention of the actual user.')
                .setRequired(true)
                .setMaxLength(500)),
    async execute(interaction: ChatInputCommandInteraction) {
        const channelId = interaction.options.get("channel").value as string;
        const image = interaction.options.get("image").value as boolean;
        const message = interaction.options.get("message").value as string;

        const okButtonId = "configure_ok";
        const failButtonId = "configure_fail";
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(okButtonId)
                    .setLabel("This is correct")
                    .setStyle(ButtonStyle.Success),
            ).addComponents(
                new ButtonBuilder()
                    .setCustomId(failButtonId)
                    .setLabel("This is incorrect")
                    .setStyle(ButtonStyle.Danger),
            );

        const callback = interaction.channel.createMessageComponentCollector({
            filter: i => i.isButton() && (i.customId === okButtonId || i.customId === failButtonId) && i.user.id === interaction.user.id,
            time: 10000,
            max: 1
        });
        callback.on('collect', async i => {
            if (i.customId === okButtonId) {
                await database.configure(i.guildId, {
                    channelId,
                    image,
                    message
                });
                await i.update({ content: "Birthday announcements are now configured!", files: [], components: [] });
            } else {
                await i.update({ content: "Okay, please try to configure me again.", files: [], components: [] });
            }
        });

        await interaction.reply({
            content: `I'll be posting a message like this in the ${prepareChannelMention(channelId)} channel:\n\n${prepareBirthdayMessage(message, interaction.user.id)}`,
            files: image ? [{ attachment: getRandomImageLink() }] : [],
            components: [buttons as any],
            ephemeral: true
        });
    }
}

export const register = {
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Register your birthday so I can announce it!')
        .setDMPermission(false)
        .addIntegerOption(option => 
            option.setName('month')
                .setDescription('What is your month of birth?')
                .setRequired(true)
                .addChoices(
                    { name: 'January', value: 1 },
                    { name: 'February', value: 2 },
                    { name: 'March', value: 3 },
                    { name: 'April', value: 4 },
                    { name: 'May', value: 5 },
                    { name: 'June', value: 6 },
                    { name: 'July', value: 7 },
                    { name: 'August', value: 8 },
                    { name: 'September', value: 9 },
                    { name: 'October', value: 10 },
                    { name: 'November', value: 11 },
                    { name: 'December', value: 12 },
                ))
        .addIntegerOption(option =>
            option.setName('day')
                .setDescription('What is your day of birth?')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(31))
        .addStringOption(option =>
            option.setName('timezone')
                .setDescription('What is your timezone? Start searching for a city or country for options to appear.')
                .setRequired(true)
                .setAutocomplete(true)
                .setMaxLength(100)),
    async execute(interaction: ChatInputCommandInteraction) {
        if (database.userExists(interaction.guildId, interaction.user.id)) {
            await interaction.reply({
                content: "You've already registed yourself in this server.",
                ephemeral: true
            });
            return; 
        }

        const month = interaction.options.get("month").value as number;
        const day = interaction.options.get("day").value as number;
        const tz = interaction.options.get("timezone").value as string;

        const dayValidation = validateDay(month, day);
        if (!dayValidation.isValid) {
            await interaction.reply({
                content: `The month you chose has less than ${dayValidation.badInput} days. Please try again.`,
                ephemeral: true
            });
            return;
        }

        const tzValidation = validateTimezone(tz);
        if (!tzValidation.isValid) {
            await interaction.reply({
                content: `I don't recognise the timezone '${tzValidation.badInput}'. Please pick one from the list of options.`,
                ephemeral: true
            });
            return;
        }

        const okButtonId = "register_ok";
        const failButtonId = "register_fail";
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(okButtonId)
                    .setLabel("This is correct")
                    .setStyle(ButtonStyle.Success),
            ).addComponents(
                new ButtonBuilder()
                    .setCustomId(failButtonId)
                    .setLabel("This is incorrect")
                    .setStyle(ButtonStyle.Danger),
            );

        const isFeb29 = day === 29 && month === 2;
        const bday = calcNextBirthday(isFeb29 ? 28 : day, month, tz);

        const callback = interaction.channel.createMessageComponentCollector({
            filter: i => i.isButton() && (i.customId === okButtonId || i.customId === failButtonId) && i.user.id === interaction.user.id,
            time: 60000,
            max: 1
        });
        callback.on('collect', async i => {
            if (i.customId === okButtonId) {
                await database.register(i.guildId, {
                    userId: i.user.id,
                    month,
                    day: isFeb29 ? 28 : day,
                    tz,
                    nextBirthday: bday.valueOf()
                });
                await i.update({ content: "You're now registered!", components: [] });
            } else {
                await i.update({ content: "Okay, please try to register again.", components: [] });
            }
        });

        await interaction.reply({
            content: `Okay. This means your next birthday is on **${getReadableDateString(bday, true)}**. Is that correct?` +
                     (isFeb29 ? `\n**Note:** I know you picked February 29. I'll consider it February 28 to save myself from some serious headaches 😅` : ""),
            components: [buttons as any],
            ephemeral: true
        });
    },
    async autocomplete(interaction: AutocompleteInteraction) {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const filtered = getTimezones().filter(tz => tz.lowercased.includes(focusedValue));
        await interaction.respond(filtered.map(tz => ({ name: tz.printable, value: tz.value })).slice(0, 25)); // discord limitation: 25 options is max
    }
}

export const nextbirthday = {
    data: new SlashCommandBuilder()
        .setName('nextbirthday')
        .setDescription('Find out when the next birthday is going to happen!')
        .setDMPermission(false),
    async execute(interaction: ChatInputCommandInteraction, client: Client) {
        const birthdays = database.getBirthdays(interaction.guildId);
        if (!birthdays) {
            await interaction.reply("There are no configured birthdays.");
            return;
        }

        const next = getNextBirthdayFromList(Object.values(birthdays));
        if (!next) {
            await interaction.reply("There are no configured birthdays.");
            return;
        }

        const guild = client.guilds.cache.get(interaction.guildId);
        if (guild.members.cache.size <= 2) {
            await guild.members.fetch({ withPresences: false });
        }
        log(`Guild id ${interaction.guildId} has ${guild.members.cache.size} members.`);

        const date = moment.tz(next.nextBirthday, next.tz);
        const username = guild.members.cache.has(next.userId) ? `**${guild.members.cache.get(next.userId).displayName}**` : "someone who has left the server";
        await interaction.reply(`The next birthday is that of ${username}, on **${getReadableDateString(date, false)}**! ` +
                                `\`(in ${getRelativeTimeString(moment(), date)})\``);
    }
}