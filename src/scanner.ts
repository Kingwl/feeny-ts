import { createIdentifier, createNumberLiteralToken, createStringLiteralToken, createToken } from "./factory";
import { Token, TokenKind } from "./types";

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
    Object = 'object',
    Var = 'var',
    This = 'this',
    If = 'if',
    Else = 'else',
    While = 'while',
    Method = 'method',
    Defn = 'defn',
    Printf = 'printf',
}

const CharsToTokenKind = {
    [Chars.Add]: TokenKind.Add,
    [Chars.Sub]: TokenKind.Sub,
    [Chars.Mul]: TokenKind.Mul,
    [Chars.Div]: TokenKind.Div,
    [Chars.Mod]: TokenKind.Mod,
    [Chars.LessThan]: TokenKind.LessThan,
    [Chars.GreaterThan]: TokenKind.GreaterThan,
    [Chars.Equals]: TokenKind.Equals,
    [Chars.OpenParen]: TokenKind.OpenParen,
    [Chars.CloseParen]: TokenKind.CloseParen,
    [Chars.OpenBracket]: TokenKind.OpenBracket,
    [Chars.CloseBracket]: TokenKind.CloseBracket,
    [Chars.Dot]: TokenKind.Dot,
    [Chars.Colon]: TokenKind.Colon,
    [Chars.Comma]: TokenKind.Comma,
    [Chars.Quote]: TokenKind.String,
} as const;

const KeywordsToTokenKind: Record<string, TokenKind> = {
    [Keywords.Null]: TokenKind.NullKeyword,
    [Keywords.Arrays]: TokenKind.ArrayKeyword,
    [Keywords.Object]: TokenKind.ObjectKeyword,
    [Keywords.Var]: TokenKind.VarKeyword,
    [Keywords.This]: TokenKind.ThisKeyword,
    [Keywords.If]: TokenKind.IfKeyword,
    [Keywords.Else]: TokenKind.ElseKeyword,
    [Keywords.While]: TokenKind.WhileKeyword,
    [Keywords.Method]: TokenKind.MethodKeyword,
    [Keywords.Defn]: TokenKind.DefnKeyword,
    [Keywords.Printf]: TokenKind.PrintfKeyword,
}

function isDigit(char: string): boolean {
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

function isAlpha(char: string): boolean {
    const charCode = char.charCodeAt(0)
    return charCode >= "a".charCodeAt(0) && charCode <= "z".charCodeAt(0) ||
        charCode >= "A".charCodeAt(0) && charCode <= "Z".charCodeAt(0);
}

function isWhiteSpaceOrTab(char: string): boolean {
    return char === Chars.Whitespace || char === Chars.Tab;
}

function isAlphaOrDigitOrLowDash(char: string): boolean {
    return isAlpha(char) || isDigit(char) || char === Chars.LowDash;
}

export function createScanner(
    text: string
) {
    const originalText = text;
    let tokenStart = 0;
    let current = 0;
    let token: Token | undefined

    return {
        isEOF,
        nextToken,
        currentToken,
    }

    function isEOF () {
        return token?.kind === TokenKind.EndOfFile;
    }

    function currentToken() {
        return token!;
    }

    function nextToken() {
        scan();
        return currentToken();
    }

    function scan() {
        if (current >= text.length) {
            token = createToken(TokenKind.EndOfFile, current, current);
            return;
        }

        const ch = text[current];
        tokenStart = current;

        switch (ch) {
            case Chars.LineFeed:
                current++;
                break;

            case Chars.Semi: {
                let i = 0;
                while (current + i < text.length && text[current + i] !== Chars.LineFeed) {
                    i++;
                }
                current += i;
                break;
            }

            case Chars.Whitespace:
            case Chars.Tab: {
                let i = 0;
                while (isWhiteSpaceOrTab(text[current + i])) {
                    i++;
                }
                current += i;
                break;
            }

            case Chars.Add:
            case Chars.Sub:
            case Chars.Mul:
            case Chars.Div:
            case Chars.Mod:
            case Chars.OpenParen:
            case Chars.CloseParen:
            case Chars.OpenBracket:
            case Chars.CloseBracket:
            case Chars.Dot:
            case Chars.Colon:
            case Chars.Comma:
                current++;
                token = createToken(CharsToTokenKind[ch], tokenStart, current);
                break;
            case Chars.LessThan:
                if (current + 1 < text.length && text[current + 1] === Chars.Equals) {
                    current += 2;
                    token = createToken(TokenKind.LessEqualsThan, tokenStart, current);
                    break;
                }
                current++;
                token = createToken(TokenKind.LessThan, tokenStart, current);
                break;
            case Chars.GreaterThan:
                if (current + 1 < text.length && text[current + 1] === Chars.Equals) {
                    current += 2;
                    token = createToken(TokenKind.GreaterEqualsThan, tokenStart, current);
                    break;
                }
                current++;
                token = createToken(TokenKind.GreaterThan, tokenStart, current);
                break;
            case Chars.Equals:
                if (current + 1 < text.length && text[current + 1] === Chars.Equals) {
                    current += 2;
                    token = createToken(TokenKind.EqualsEquals, tokenStart, current);
                    break;
                }
                current++;
                token = createToken(TokenKind.Equals, tokenStart, current);
                break;
            case Chars.Quote: {
                current++;
                const stringContentStart = current;
                let i = 0
                while (current + i < text.length && text[current + i] !== Chars.Quote) {
                    if (text[current + i] === Chars.BackSlash && current + i + 1 < text.length && text[current + i + 1] === Chars.Quote) {
                        i++;
                    }
                    i++;
                }
                const stringContentEnd = current + i;
                current = stringContentEnd + 1;
                const value = text.substring(stringContentStart, stringContentEnd);
                token = createStringLiteralToken(tokenStart, current, value);
                break;
            }

            case Chars._0:
            case Chars._1:
            case Chars._2:
            case Chars._3:
            case Chars._4:
            case Chars._5:
            case Chars._6:
            case Chars._7:
            case Chars._8:
            case Chars._9: {
                let i = 0;
                while (current + i < text.length && isDigit(text[current + i])) {
                    i++;
                }
                current += i;
                const value = text.substring(tokenStart, current);
                token = createNumberLiteralToken(tokenStart, current, value);
                break;
            }

            default:
                if (isAlpha(ch)) {
                    let i = 0;
                    while (current + i < text.length && isAlphaOrDigitOrLowDash(text[current + i])) {
                        i++;
                    }
                    current += i;
                    const value = text.substring(tokenStart, current);

                    if (value in KeywordsToTokenKind) {
                        token = createToken(KeywordsToTokenKind[value], tokenStart, current);
                        break;
                    }
                    token = createIdentifier(tokenStart, current, value);
                    break;
                }
                throw new Error("Unknown token" + ch)
        }
    }
}