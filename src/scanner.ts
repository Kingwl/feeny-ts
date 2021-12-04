import { createIdentifier, createNumberLiteralToken, createStringLiteralToken, createToken } from "./factory";
import { Token, SyntaxKind, TokenSyntaxKind } from "./types";
import { Chars, CharsToTokenKind, createFinishNode, getIndent, isAlpha, isAlphaOrDigitOrLowDashOrDash, isDef, isDigit, isKeyword, isWhiteSpaceOrTab, KeywordsToTokenKind, setupDebugInfo } from "./utils";


export function createScanner(
    text: string
) {
    const originalText = text;
    let tokenFullStart = 0;
    let tokenStart = 0;
    let current = 0;
    let token: Token<TokenSyntaxKind> | undefined
    let leadingIndent: number = 0
    let shouldUpdateIndent = true
    let hasLineFeed = false;

    const finishNode = createFinishNode(text)
    
    return {
        isEOF,
        nextToken,
        currentToken,
        getTokenStart,
        getCurrentPos,
        currentTokenhasLineFeed
    }

    function currentTokenhasLineFeed() {
        return hasLineFeed
    }

    function getTokenStart () {
        return tokenStart;
    }

    function getCurrentPos () {
        return current;
    }

    function isEOF () {
        return token?.kind === SyntaxKind.EndOfFileToken;
    }

    function currentToken() {
        return token!;
    }

    function nextToken() {
        scan();
        return currentToken();
    }

    function scan() {

        beforeWorker();
        worker();
        afterWorker();

        function beforeWorker () {
            hasLineFeed = false;
            tokenFullStart = current;
        }

        function afterWorker () {
            if (token) {
                shouldUpdateIndent = false;

                token.fullPos = tokenFullStart;
                token.leadingIndent = leadingIndent;
            }
        }

        function worker () {
            if (current >= text.length) {
                token = finishNode(createToken(SyntaxKind.EndOfFileToken), current, current);
                return;
            }
    
            let ch = text[current];
            tokenStart = current;
    
            switch (ch) {
                case Chars.LineFeed:
                    current++;
                    leadingIndent = 0;
                    shouldUpdateIndent = true;
                    hasLineFeed = true;
                    worker();
                    break;
    
                case Chars.Semi: {
                    let i = 0;
                    while (current + i < text.length && text[current + i] !== Chars.LineFeed) {
                        i++;
                    }
                    current += i;
                    worker();
                    break;
                }
    
                case Chars.Whitespace:
                case Chars.Tab: {
                    let i = 0;
                    while (isWhiteSpaceOrTab(text[current + i])) {
                        if (shouldUpdateIndent) {
                            leadingIndent += getIndent(text[current + i]);
                        }
                        i++;
                    }
                    current += i;
                    worker();
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
                    token = finishNode(createToken(CharsToTokenKind[ch]), tokenStart, current);
                    break;
                case Chars.LessThan:
                    if (current + 1 < text.length && text[current + 1] === Chars.Equals) {
                        current += 2;
                        token = finishNode(createToken(SyntaxKind.LessEqualsThanToken), tokenStart, current);
                        break;
                    }
                    current++;
                    token = finishNode(createToken(SyntaxKind.LessThanToken), tokenStart, current);
                    break;
                case Chars.GreaterThan:
                    if (current + 1 < text.length && text[current + 1] === Chars.Equals) {
                        current += 2;
                        token = finishNode(createToken(SyntaxKind.GreaterEqualsThanToken), tokenStart, current);
                        break;
                    }
                    current++;
                    token = finishNode(createToken(SyntaxKind.GreaterThanToken), tokenStart, current);
                    break;
                case Chars.Equals:
                    if (current + 1 < text.length && text[current + 1] === Chars.Equals) {
                        current += 2;
                        token = finishNode(createToken(SyntaxKind.EqualsEqualsToken), tokenStart, current);
                        break;
                    }
                    current++;
                    token = finishNode(createToken(SyntaxKind.EqualsToken), tokenStart, current);
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
                    token = finishNode(createStringLiteralToken(value), tokenStart, current);
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
                    token = finishNode(createNumberLiteralToken(value), tokenStart, current);
                    break;
                }
    
                default:
                    if (isAlpha(ch)) {
                        let i = 0;
                        while (current + i < text.length && isAlphaOrDigitOrLowDashOrDash(text[current + i])) {
                            i++;
                        }
                        current += i;
                        const value = text.substring(tokenStart, current);
                        if (isKeyword(value)) {
                            token = finishNode(createToken(KeywordsToTokenKind[value]), tokenStart, current);
                            break;
                        }
                        token = finishNode(createIdentifier(value), tokenStart, current);
                        break;
                    }
                    throw new Error("Unknown token: " + ch)
            }
        }
    }
}