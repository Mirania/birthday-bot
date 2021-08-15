import * as admin from 'firebase-admin';
/**
 * Returns the database instance currently in use.
 */
export declare function database(): admin.database.Database;
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
export declare function connect(config: object | string, url: string): void;
/**
 * Prints the data located at `path`.
 * @param path Path within the database, e.g. `users/123`.
 *
 * Example usage:
 * ```
 * print("users/123");
 * ```
 */
export declare function print(path: string): void;
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
export declare function get<T>(path: string): Promise<T>;
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
export declare function post(path: string, value: any): Promise<void>;
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
export declare function update(path: string, value: object): Promise<void>;
/**
 * Removes the data at `path`.
 * @param path Path within the database, e.g. `users/123`.
 *
 * Example usage:
 * ```
 * remove("users/123").then(() => ... );
 * ```
 */
export declare function remove(path: string): Promise<void>;
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
export declare function push(path: string, value: any): Promise<string>;
