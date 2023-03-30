import * as admin from 'firebase-admin';

let _database: admin.database.Database = null;

class DatabaseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DatabaseError";
    }
}

/**
 * Returns the database instance currently in use.
 */
export function database(): admin.database.Database {
    if (_database) return _database;
    throw new DatabaseError("Database is not connected.");
}

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
export function connect(config: object | string, url: string): void {
    if (typeof config === "string") config = JSON.parse(config);

    admin.initializeApp({
        credential: admin.credential.cert(config),
        databaseURL: url
    });
    
    _database = admin.database();
}

/**
 * Prints the data located at `path`.
 * @param path Path within the database, e.g. `users/123`.
 * 
 * Example usage:
 * ```
 * print("users/123");
 * ```
 */
export function print(path: string): void {
    database().ref(path).once('value', (snap) => console.log(snap.val()));
}

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
export async function get<T>(path: string): Promise<T> {
    let ref = database().ref(path);
    // type information helps here
    let query: Promise<admin.database.DataSnapshot>; 

    query = new Promise((resolve,reject) => {
        ref.once('value', resolve, reject);
    });

    const snap = await query;
    return snap.val();
}

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
export function post(path: string, value: any): Promise<void> {
    return database().ref(path).set(value);
}

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
export function update(path: string, value: object): Promise<void> {
    return database().ref(path).update(value);
}

/**
 * Removes the data at `path`.
 * @param path Path within the database, e.g. `users/123`.
 *
 * Example usage:
 * ```
 * remove("users/123").then(() => ... );
 * ```
 */
export function remove(path: string): Promise<void> {
    return database().ref(path).remove();
}

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
export async function push(path: string, value: any): Promise<string> {
    let ref = database().ref(path).push();
    await ref.set(value);
    return ref.key;
}