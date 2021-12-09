import { createScanner, createBinder, createChecker, Token, TokenSyntaxKind, createParser, createInterpreter, forEachChild, ASTNode, Symbol } from "../src";
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
    name?: string;
    kind: string | number;
    symbols: SymbolSignature[];
}

export function bindCode (text: string) {
    const parser = createParser(text);
    const file = parser.parseSourceFile();
    const binder = createBinder(file);
    binder.bindFile();

    const localsResult: SymbolContainer[] = [];
    const membersResult: SymbolContainer[] = [];

    visitor(file);

    return {
        localsResult,
        membersResult
    }
    
    function visitor (node: ASTNode) {
        if (node.locals) {
            localsResult.push({
                pos: node.pos,
                kind: node.__debugKind ?? node.kind,
                symbols: Array.from(node.locals.values()).map(symbolToSignature)
            })
        }

        if (isDeclaration(node)) {
            if (node.symbol?.members) {
                membersResult.push({
                    pos: node.pos,
                    name: node.symbol.name,
                    kind: node.__debugKind ?? node.kind,
                    symbols: Array.from(node.symbol.members.values()).map(symbolToSignature)
                })
            }
        }

        forEachChild(node, visitor)
    }

    function symbolToSignature(symbol: Symbol): SymbolSignature {
        return {
            declarationPos: symbol.declaration.pos,
            name: symbol.name,
            flags: symbol._debugFlags ?? symbol.flags
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

interface CheckResult {
    pos: number;
    kind: string | number;
    type: string | number | undefined;
}

export function checkCode (text: string) {
    const parser = createParser(text);
    const file = parser.parseSourceFile();
    const checker = createChecker(file);
    const { check } = checker.checkFile();

    const result: CheckResult[] = []; 

    visitor(file);

    return result;
    
    function visitor (node: ASTNode) {
        const type = check(node)
        if (type) {
            result.push({
                pos: node.pos,
                kind: node.__debugKind ?? node.kind,
                type: type._debugKind ?? node.kind
            })
        }

        forEachChild(node, visitor)
    }
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
