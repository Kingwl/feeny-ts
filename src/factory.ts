import { AllTokens, GenericToken, IdentifierToken, IntegerLiteralToken, StringLiteralToken, Token, TokenKind } from "./types";

export function createToken <K extends TokenKind>(kind: K, pos: number, end: number): GenericToken<K> {
    const token = { kind } as GenericToken<K>
    token.pos = pos;
    token.end = end;
    return token
}

export function createStringLiteralToken(pos: number, end: number, value: string): StringLiteralToken {
    const token = { kind: TokenKind.String } as StringLiteralToken
    token.pos = pos;
    token.end = end;
    token.value = value;
    return token;
}

export function createNumberLiteralToken(pos: number, end: number, value: string): IntegerLiteralToken {
    const token = { kind: TokenKind.Integer } as IntegerLiteralToken
    token.pos = pos;
    token.end = end;
    token.value = value;
    return token;
}

export function createIdentifier(pos: number, end: number, id: string): IdentifierToken {
    const token = { kind: TokenKind.Identifier } as IdentifierToken
    token.pos = pos;
    token.end = end;
    token.id = id;
    return token;
}