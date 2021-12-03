import { ASTNode, SyntaxKind, NodeArray} from "./types";

export function finishNode<T extends ASTNode> (node: T, pos: number, end: number): T {
    node.pos = pos;
    node.end = end;

    setupDebugInfo(node);

    return node;
}

export function finishNodeArray<T extends ASTNode>(nodes: NodeArray<T>, pos: number, end: number): NodeArray<T> {
    nodes.pos = pos;
    nodes.end = end;
    return nodes;
}

export function setupDebugInfo (node: ASTNode) {
    node.__debugKind = SyntaxKind[node.kind];
}

export function isDef<T>(v: T): v is NonNullable<T> {
    return v !== undefined && v !== null;
}

export enum Chars {
    Add = "+",
    Sub = "-",
    Mul = '*',
    Div = '/',
    Mod = '%',
    LessThan = '<',
    GreaterThan = '>',
    Equals = "=",
    OpenParen = '(',
    CloseParen = ')',
    OpenBracket = '[',
    CloseBracket = ']',
    Dot = '.',
    Colon = ':',
    Comma = ',',
    Quote = '"',
    BackSlash = '\\',
    Semi = ';',
    LowDash = '_',

    _0 = '0',
    _1 = '1',
    _2 = '2',
    _3 = '3',
    _4 = '4',
    _5 = '5',
    _6 = '6',
    _7 = '7',
    _8 = '8',
    _9 = '9',

    Whitespace = ' ',
    Tab = '\t',
    LineFeed = '\n',
}

export enum Keywords {
    Null = 'null',
    Arrays = 'arrays',
    Objects = 'object',
    Var = 'var',
    This = 'this',
    If = 'if',
    Else = 'else',
    While = 'while',
    Method = 'method',
    Defn = 'defn',
    Printf = 'printf',
}

export function isKeyword(value: string): value is Keywords {
    switch (value) {
        case Keywords.Null:
        case Keywords.Arrays:
        case Keywords.Objects:
        case Keywords.Var:
        case Keywords.This:
        case Keywords.If:
        case Keywords.Else:
        case Keywords.While:
        case Keywords.Method:
        case Keywords.Defn:
        case Keywords.Printf:
            return true;
        default:
            return false;
    }
}

export const CharsToTokenKind = {
    [Chars.Add]: SyntaxKind.AddToken,
    [Chars.Sub]: SyntaxKind.SubToken,
    [Chars.Mul]: SyntaxKind.MulToken,
    [Chars.Div]: SyntaxKind.DivToken,
    [Chars.Mod]: SyntaxKind.ModToken,
    [Chars.LessThan]: SyntaxKind.LessThanToken,
    [Chars.GreaterThan]: SyntaxKind.GreaterThanToken,
    [Chars.Equals]: SyntaxKind.EqualsToken,
    [Chars.OpenParen]: SyntaxKind.OpenParenToken,
    [Chars.CloseParen]: SyntaxKind.CloseParenToken,
    [Chars.OpenBracket]: SyntaxKind.OpenBracketToken,
    [Chars.CloseBracket]: SyntaxKind.CloseBracketToken,
    [Chars.Dot]: SyntaxKind.DotToken,
    [Chars.Colon]: SyntaxKind.ColonToken,
    [Chars.Comma]: SyntaxKind.CommaToken,
} as const;

export const KeywordsToTokenKind = {
    [Keywords.Null]: SyntaxKind.NullKeyword,
    [Keywords.Arrays]: SyntaxKind.ArraysKeyword,
    [Keywords.Objects]: SyntaxKind.ObjectsKeyword,
    [Keywords.Var]: SyntaxKind.VarKeyword,
    [Keywords.This]: SyntaxKind.ThisKeyword,
    [Keywords.If]: SyntaxKind.IfKeyword,
    [Keywords.Else]: SyntaxKind.ElseKeyword,
    [Keywords.While]: SyntaxKind.WhileKeyword,
    [Keywords.Method]: SyntaxKind.MethodKeyword,
    [Keywords.Defn]: SyntaxKind.DefnKeyword,
    [Keywords.Printf]: SyntaxKind.PrintfKeyword,
} as const

export function isDigit(char: string): boolean {
    switch (char) {
        case Chars._0:
        case Chars._1:
        case Chars._2:
        case Chars._3:
        case Chars._4:
        case Chars._5:
        case Chars._6:
        case Chars._7:
        case Chars._8:
        case Chars._9:
            return true;
        default:
            return false;
    }
}

export function isAlpha(char: string): boolean {
    const charCode = char.charCodeAt(0)
    return charCode >= "a".charCodeAt(0) && charCode <= "z".charCodeAt(0) ||
        charCode >= "A".charCodeAt(0) && charCode <= "Z".charCodeAt(0);
}

export function isWhiteSpaceOrTab(char: string): boolean {
    return char === Chars.Whitespace || char === Chars.Tab;
}

export function isAlphaOrDigitOrLowDash(char: string): boolean {
    return isAlpha(char) || isDigit(char) || char === Chars.LowDash;
}

export function getIndent (ch: string) {
    switch (ch) {
        case Chars.Whitespace:
            return 1;
        case Chars.Tab:
            return 4;
        default:
            return 0;
    }
}