import * as dotenv from 'dotenv'; dotenv.config();
import * as firebase from '../database/firebase-module';
import { calcNextBirthday, getReadableDateString } from '../utils/time';

if (process.argv.length < 7) {
    console.error("Provide a guild id, user id, month, day and timezone.");
}

firebase.connect(process.env.FIREBASE_CREDENTIALS, process.env.FIREBASE_URL);

const month = parseInt(process.argv[4]);
const day = parseInt(process.argv[5]);
const nextBirthday = calcNextBirthday(day, month, process.argv[6]);

const birthday = {
    day,
    month,
    tz: process.argv[6],
    nextBirthday: nextBirthday.valueOf(),
    userId: process.argv[3]
};

firebase.update(`birthdays/servers/${process.argv[2]}/users/${process.argv[3]}`, birthday)
        .then(() => {
            console.log(`Added to guild id ${process.argv[2]} the user id ${process.argv[3]} with the next birthday on ${getReadableDateString(nextBirthday, true)}.`);
            process.exit(0);
        });