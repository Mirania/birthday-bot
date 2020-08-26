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
exports.push = exports.remove = exports.update = exports.post = exports.get = exports.print = exports.connect = exports.database = void 0;
const admin = require("firebase-admin");
let _database = null;
class DatabaseError extends Error {
    constructor(message) {
        super(message);
        this.name = "DatabaseError";
    }
}
/**
 * Returns the database instance currently in use.
 */
function database() {
    if (_database)
        return _database;
    throw new DatabaseError("Database is not connected.");
}
exports.database = database;
/**
 * Connects the database instance to the online Firebase service, becoming operational.
 * @param config An object or JSON string containing authentication information. This
 * should include data such as `type`, `project_id`, `private_key_id`, `private_key`
 * and more.
 * @param url The database's firebaseio URL.
 *
 * Example usage:
 * ```
 * connect(process.env.FIREBASE_CREDENTIALS, process.env.FIREBASE_URL);
 * ```
 */
function connect(config, url) {
    if (typeof config === "string")
        config = JSON.parse(config);
    admin.initializeApp({
        credential: admin.credential.cert(config),
        databaseURL: url
    });
    _database = admin.database();
}
exports.connect = connect;
/**
 * Prints the data located at `path`.
 * @param path Path within the database, e.g. `users/123`.
 *
 * Example usage:
 * ```
 * print("users/123");
 * ```
 */
function print(path) {
    database().ref(path).once('value', (snap) => console.log(snap.val()));
}
exports.print = print;
/**
 * Gets the data located at `path`.
 * @param path Path within the database, e.g. `users/123`.
 * @returns The data, which can be a string, number, object, null and so on.
 *
 * Example usage:
 * ```
 * get("users/123").then(data => ... );
 * ```
 */
function get(path) {
    return __awaiter(this, void 0, void 0, function* () {
        let ref = database().ref(path);
        // type information helps here
        let query;
        query = new Promise((resolve, reject) => {
            ref.once('value', resolve, reject);
        });
        const snap = yield query;
        return snap.val();
    });
}
exports.get = get;
/**
 * Posts the data to `path`. Will **overwrite** all data at that path if any is present.
 * @param path Path within the database, e.g. `users/123`.
 * @param value The data to post, which can be a string, number, object, null and so on.
 *
 * Example usage:
 * ```
 * post("users/123", {name: ..., age: ...}).then(() => ... );
 * ```
 */
function post(path, value) {
    return database().ref(path).set(value);
}
exports.post = post;
/**
 * Updates the data at `path`. Only the keys provided will be overwritten.
 * @param path Path within the database, e.g. `users/123`.
 * @param value An object containing the fields that shall be replaced.
 *
 * Example usage:
 * ```
 * update("users/123", {age: ...}).then(() => ... );
 * ```
 */
function update(path, value) {
    return database().ref(path).update(value);
}
exports.update = update;
/**
 * Removes the data at `path`.
 * @param path Path within the database, e.g. `users/123`.
 *
 * Example usage:
 * ```
 * remove("users/123").then(() => ... );
 * ```
 */
function remove(path) {
    return database().ref(path).remove();
}
exports.remove = remove;
/**
 * Creates a new key at `path` and posts the data to `path/<new key>`.
 * @param path Path within the database, e.g. `users/123`.
 * @param value The data to post, which can be a string, number, object, null and so on.
 * @returns The name of the new key.
 *
 * Example usage:
 * ```
 * push("users", {name: ..., age: ...}).then(key => ... );
 * ```
 */
function push(path, value) {
    return __awaiter(this, void 0, void 0, function* () {
        let ref = database().ref(path).push();
        yield ref.set(value);
        return ref.key;
    });
}
exports.push = push;
