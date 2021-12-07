import { createScanner, createBinder, Token, TokenSyntaxKind, createParser, createInterpreter, forEachChild, ASTNode, Symbol } from "../src";
import * as path from 'path';
import * as fs from 'fs';
import { Context } from "../src/interpreter/types";
import { isDeclaration } from "../src/utils";

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

interface SymbolSignature {
    declarationPos: number;
    name?: string;
    flags: string | number;
}

interface SymbolContainer {
    pos: number;
    kind: string | number;
    symbols: SymbolSignature[];
}

export function bindCode (text: string) {
    const parser = createParser(text);
    const file = parser.parseSourceFile();
    const binder = createBinder(file);
    const result = binder.bindFile();

    const localsResult: SymbolContainer[] = [];
    const membersResult: SymbolContainer[] = [];

    visitor(file);

    return {
        localsResult,
        membersResult
    }
    
    function visitor (node: ASTNode) {
        const locals = result.getLocalsFromNode(node);
        if (locals) {
            localsResult.push({
                pos: node.pos,
                kind: node.__debugKind ?? node.kind,
                symbols: Array.from(locals.values()).map(symbolToSignature)
            })
        }

        if (isDeclaration(node)) {
            const declaration = result.getSymbolFromDeclaration(node);
            if (declaration) {
                const members = declaration.members ?? new Map();
                membersResult.push({
                    pos: node.pos,
                    kind: node.__debugKind ?? node.kind,
                    symbols: Array.from(members.values()).map(symbolToSignature)
                })
            }
        }

        forEachChild(node, visitor)
    }

    function symbolToSignature(symbol: Symbol): SymbolSignature {
        return {
            declarationPos: symbol.declaration.pos,
            name: symbol.name,
            flags: symbol.flags.toString()
        }
    }
}

export function createNodeContext(): Context {
    return {
        stdout: text => process.stdout.write(text, 'utf-8')
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
