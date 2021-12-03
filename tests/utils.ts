import { createScanner, Token } from "../src";

export function scanCode (text: string) {
    const scanner = createScanner(text);
    const tokens: Token[] = [];
    while (!scanner.isEOF()) {
        const token = scanner.nextToken();
        tokens.push(token);
    }
    return tokens;
}
