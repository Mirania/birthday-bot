import * as dotenv from 'dotenv'; dotenv.config();

const link = `https://discordapp.com/oauth2/authorize?client_id=${process.env.BOT_ID}` +
             `&scope=bot&permissions=${process.env.BOT_PERMS}`;

console.log(link);