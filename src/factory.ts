import { AllTokens, ASTNode } from ".";
import { IdentifierToken, IntegerLiteralToken, StringLiteralToken, SyntaxKind } from "./types";

export function finishNode<T extends ASTNode> (node: T, pos: number, end: number): T {
    node.pos = pos;
    node.end = end;
    return node;
}

export function createNode <T extends ASTNode>(kind: T["kind"]): T {
    const token = { kind } as T
    token.pos = -1;
    token.end = -1;
    return token
}

export function createToken<T extends AllTokens>(kind: T['kind']): T {
    return createNode(kind)
}

export function createStringLiteralToken(value: string): StringLiteralToken {
    const token = createToken<StringLiteralToken>(SyntaxKind.StringToken)
    token.value = value;
    return token;
}

export function createNumberLiteralToken(value: string): IntegerLiteralToken {
    const token = createToken<IntegerLiteralToken>(SyntaxKind.IntegerToken)
    token.value = value;
    return token;
}

export function createIdentifier(id: string): IdentifierToken {
    const token = createToken<IdentifierToken>(SyntaxKind.Identifier);
    token.id = id;
    return token;
}
