/**
 * Returns a random integer between min (inclusive) and max (exclusive).
 */
export function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max - 1);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}