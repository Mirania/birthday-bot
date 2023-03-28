import { AutocompleteInteraction, ChatInputCommandInteraction, Collection, SlashCommandBuilder } from 'discord.js';
import * as commands from './exportables';

const collection = new Collection<string, { 
    data: SlashCommandBuilder, 
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>,
    autocomplete: (interaction: AutocompleteInteraction) => Promise<void>
}>();

Object.keys(commands).forEach((key) => collection.set(commands[key].data.name, commands[key]));

export default collection;