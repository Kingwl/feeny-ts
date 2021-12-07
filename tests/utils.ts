import { createScanner, Token, TokenSyntaxKind, createParser, createInterpreter } from "../src";
import * as path from 'path';
import * as fs from 'fs';
import { Context } from "../src/interpreter/types";

export const casesPath = path.resolve(__dirname, 'cases');
export const demoPath = path.resolve(__dirname, 'demo');

export function forEachFeeny(basePath: string, callback: (baseName: string, content: string) => void) {
    const fileNames = fs.readdirSync(basePath);

    fileNames.forEach(fileName => {
        const baseName = path.basename(fileName, '.feeny');
        const fileNamePath = path.join(basePath, fileName);
        const content = fs.readFileSync(fileNamePath, 'utf8').toString();
        callback(baseName, content);
    });
}

export function forEachCases(callback: (baseName: string, content: string) => void) {
    return forEachFeeny(casesPath, callback);
}

export function forEachDemo(callback: (baseName: string, content: string) => void) {
    return forEachFeeny(demoPath, callback);
}

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

export function createNodeContext(): Context {
    return {
        stdout: process.stdout.write
    }
}

export function runCode (text: string) {
    const parser = createParser(text);
    const file = parser.parseSourceFile();
    const context = createNodeContext();
    const interpreter = createInterpreter(file, context);
    interpreter.evaluate();
}

export function runWithStdoutHook(text: string) {
    const result: string[] = []

    const parser = createParser(text);
    const file = parser.parseSourceFile();

    const context: Context = {
        stdout: content => result.push(content)
    }
    const interpreter = createInterpreter(file, context);
    interpreter.evaluate();
    return result
}
