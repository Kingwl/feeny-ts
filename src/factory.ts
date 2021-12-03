import { TokenSyntaxKind } from "./types";
import { GenericToken, IdentifierToken, IntegerLiteralToken, StringLiteralToken, SyntaxKind } from "./types";

export function createToken <K extends TokenSyntaxKind>(kind: K, pos: number, end: number): GenericToken<K> {
    const token = { kind } as GenericToken<K>
    token.pos = pos;
    token.end = end;

    return token
}

export function createStringLiteralToken(pos: number, end: number, value: string): StringLiteralToken {
    const token = { kind: SyntaxKind.StringToken } as StringLiteralToken
    token.pos = pos;
    token.end = end;
    token.value = value;
    return token;
}

export function createNumberLiteralToken(pos: number, end: number, value: string): IntegerLiteralToken {
    const token = { kind: SyntaxKind.IntegerToken } as IntegerLiteralToken
    token.pos = pos;
    token.end = end;
    token.value = value;
    return token;
}

export function createIdentifier(pos: number, end: number, id: string): IdentifierToken {
    const token = { kind: SyntaxKind.Identifier } as IdentifierToken
    token.pos = pos;
    token.end = end;
    token.id = id;
    return token;
}