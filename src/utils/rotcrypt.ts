const symbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!#$%&/()=?»«|*~^,. +-_<>;:[]{}abcdefghijklmnopqrstuvwxyz1234567890@£§€";

function validate(rot: number): void {
    if (Math.abs(rot) >= symbols.length) {
        const limit = symbols.length - 1;
        throw new Error(`rot value must be between ${-limit} and ${limit}, inclusive.`);
    }
}

function moveIndexByRot(index: number, rot: number): number {
    if (rot >= 0)
        return (index + rot) % symbols.length;
    if (index + rot < 0)
        return symbols.length + index + rot;
    return index + rot;
}

function applyRot(input: string, rot: number): string {
    validate(rot);
    if (!input || rot === 0) return input;

    let output = "";
    for (let i = 0; i < input.length; i++) {
        const index = symbols.indexOf(input.charAt(i));
        output += (index > -1 ? symbols[moveIndexByRot(index, rot)] : input.charAt(i));
    }
    return output;
}


/**
 * Encrypts the given input using a rot-x algorithm.
 * @param input the input
 * @param rot the x value in 'rot-x'
 */
export function encrypt(input: string, rot: number): string {
    return `ENC(${applyRot(input, rot)})`;
}

/**
 * Decrypts the given input using a rot-x algorithm.
 * @param input the input
 * @param rot the x value in 'rot-x'
 */
export function decrypt(input: string, rot: number): string {
    if (input.startsWith("ENC(") && input.endsWith(")"))
        return applyRot(input.substring(4, input.length - 1), -rot);
    return applyRot(input, -rot);
}
