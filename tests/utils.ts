import { createScanner, Token, TokenSyntaxKind, createParser, createInterpreter } from "../src";
import * as path from 'path';

export const casesPath = path.resolve(__dirname, 'cases');
export const demoPath = path.resolve(__dirname, 'demo');

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

export function runCode (text: string) {
    const parser = createParser(text);
    const file = parser.parseSourceFile();
    const interpreter = createInterpreter(file);
    interpreter.evaluate();
}

export function runWithConsoleLogHook(cb: () => void) {
    const result: any[][] = []

    const log = console.log
    console.log = (...args: any[]) => {
        result.push(args)
    }
    
    cb()
    console.log = log
    return result
}
