import {
  createScanner,
  createBinder,
  createChecker,
  Token,
  TokenSyntaxKind,
  createParser,
  createInterpreter,
  forEachChild,
  ASTNode,
  Symbol
} from '../src';
import * as path from 'path';
import * as fs from 'fs';
import { Context } from '../src/interpreter/types';
import { isDeclaration } from '../src/utils';

export const casesPath = path.resolve(__dirname, 'cases');
export const demoPath = path.resolve(__dirname, 'demo');

export function forEachFeeny(
  basePath: string,
  callback: (baseName: string, content: string) => void
) {
  const fileNames = fs.readdirSync(basePath);

  fileNames.forEach(fileName => {
    const baseName = path.basename(fileName, '.feeny');
    const fileNamePath = path.join(basePath, fileName);
    const content = fs.readFileSync(fileNamePath, 'utf8').toString();
    callback(baseName, content);
  });
}

export function forEachCases(
  callback: (baseName: string, content: string) => void
) {
  return forEachFeeny(casesPath, callback);
}

export function forEachDemo(
  callback: (baseName: string, content: string) => void
) {
  return forEachFeeny(demoPath, callback);
}

export function scanCode(text: string) {
  const scanner = createScanner(text);
  const tokens: Token<TokenSyntaxKind>[] = [];
  while (!scanner.isEOF()) {
    const token = scanner.nextToken();
    tokens.push(token);
  }
  return tokens;
}

export function parseCode(text: string) {
  const parser = createParser(text);
  const file = parser.parse();
  return file;
}

interface SymbolSignature {
  id: number;
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

export function bindCode(text: string) {
  const parser = createParser(text);
  const file = parser.parse();
  const binder = createBinder(file);
  binder.bindFile();

  const localsResult: SymbolContainer[] = [];
  const membersResult: SymbolContainer[] = [];

  visitor(file);

  return {
    localsResult,
    membersResult
  };

  function visitor(node: ASTNode) {
    if (node.locals) {
      localsResult.push({
        pos: node.pos,
        kind: node.__debugKind ?? node.kind,
        symbols: Array.from(node.locals.values()).map(symbolToSignature)
      });
    }

    if (isDeclaration(node)) {
      if (node.symbol?.members) {
        membersResult.push({
          pos: node.pos,
          name: node.symbol.name,
          kind: node.__debugKind ?? node.kind,
          symbols: Array.from(node.symbol.members.values()).map(
            symbolToSignature
          )
        });
      }
    }

    forEachChild(node, visitor);
  }

  function symbolToSignature(symbol: Symbol): SymbolSignature {
    return {
      id: symbol.id,
      declarationPos: symbol.declaration?.pos ?? -1,
      name: symbol.name,
      flags: symbol._debugFlags ?? symbol.flags
    };
  }
}

export function createNodeContext(): Context {
  return {
    stdout: text => process.stdout.write(text, 'utf-8')
  };
}

export function runCode(text: string) {
  const parser = createParser(text);
  const file = parser.parse();
  const context = createNodeContext();
  const interpreter = createInterpreter(file, context);
  interpreter.evaluate();
}

interface CheckResult {
  id: number;
  pos: number;
  type: string | number;
  kind: string | number;
}

export function checkCode(text: string) {
  const parser = createParser(text);
  const file = parser.parse();
  const binder = createBinder(file);
  binder.bindFile();
  const checker = createChecker(file, binder.createBuiltinSymbol);

  const result: CheckResult[] = [];

  visitor(file);

  return [result, checker.diagnostics] as const;

  function visitor(node: ASTNode) {
    const type = checker.check(node);
    if (!checker.isNeverType(type)) {
      result.push({
        id: type.id,
        pos: node.pos,
        type: type._debugKind ?? type.kind,
        kind: node.__debugKind ?? node.kind
      });
    }

    forEachChild(node, visitor);
  }
}

export function runWithStdoutHook(text: string) {
  const result: string[] = [];

  const parser = createParser(text);
  const file = parser.parse();

  const context: Context = {
    stdout: content => result.push(content)
  };
  const interpreter = createInterpreter(file, context);
  interpreter.evaluate();
  return result;
}
