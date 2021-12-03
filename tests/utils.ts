import { createScanner, Token, TokenSyntaxKind, createParser } from "../src";

export function scanCode (text: string) {
    const scanner = createScanner(text);
    const tokens: Token<TokenSyntaxKind>[] = [];
    while (!scanner.isEOF()) {
        const token = scanner.nextToken();
        tokens.push(token);
    }
    return tokens;
}

export function parseCode (text: string) {
    const parser = createParser(text);
    const file = parser.parseSourceFile();
    return file;
}
