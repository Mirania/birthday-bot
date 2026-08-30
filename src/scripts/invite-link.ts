import * as dotenv from 'dotenv'; dotenv.config({ path: 'env.txt' });
import * as database from '../database/database';

main();

async function main() {
    await database.init();

    const link = `https://discordapp.com/oauth2/authorize?client_id=${database.getSecrets().BOT_ID}` +
        `&scope=bot&permissions=${database.getSecrets().BOT_PERMS}`;

    console.log(link);
    process.exit(0);
}
