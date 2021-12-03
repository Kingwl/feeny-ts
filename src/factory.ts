import { Expression, GlobalVariableStatement, LocalStatement, NodeArray, NullToken, ObjectSlot, SequenceOfStatements, TokenSyntaxKind, TopLevelExpressionStatement, TopLevelStatement, VariableReferenceExpression } from ".";
import { ArraysExpression, ASTNode, IntegerLiteralExpression, LocalExpressionStatement, LocalVariableStatement, NullExpression, ObjectsExpression, PrintingExpression, SourceFile, TextSpan, Token, VariableSlot } from "./types";
import { IdentifierToken, IntegerLiteralToken, StringLiteralToken, SyntaxKind } from "./types";


export function createNode <T extends ASTNode>(kind: T["kind"]): T {
    const token = { kind } as T
    token.pos = -1;
    token.end = -1;
    return token
}

export function createNodeArray<T extends ASTNode>(nodes: readonly T[]): NodeArray<T> {
    const arr = nodes as NodeArray<T>
    arr.pos = -1;
    arr.end = -1;
    return arr;
}

export function createToken<T extends TokenSyntaxKind>(kind: T): Token<T> {
    return createNode(kind)
}

export function createStringLiteralToken(value: string): StringLiteralToken {
    const token = createToken(SyntaxKind.StringLiteralToken) as StringLiteralToken
    token.value = value;
    return token;
}

export function createNumberLiteralToken(value: string): IntegerLiteralToken {
    const token = createToken(SyntaxKind.IntegerLiteralToken) as IntegerLiteralToken
    token.value = value;
    return token;
}

export function createIdentifier(id: string): IdentifierToken {
    const token = createToken(SyntaxKind.Identifier) as IdentifierToken;
    token.id = id;
    return token;
}

export function createSourceFile(statements: NodeArray<TopLevelStatement>): SourceFile {
    const node = createNode<SourceFile>(SyntaxKind.SourceFile);
    node.statements = statements;
    return node;
}

export function createGlobalVariableStatement(name: IdentifierToken, initializer: Expression): GlobalVariableStatement {
    const node = createNode<GlobalVariableStatement>(SyntaxKind.GlobalVariableStatement)
    node.name = name;
    node.initializer = initializer;
    return node;
}

export function createTopLevelExpressionStatement(expression: Expression): TopLevelExpressionStatement {
    const node = createNode<TopLevelExpressionStatement>(SyntaxKind.TopLevelExpressionStatement)
    node.expression = expression;
    return node;
}

export function createIntegerLiteralExpression(value: IntegerLiteralToken): IntegerLiteralExpression {
    const node = createNode<IntegerLiteralExpression>(SyntaxKind.IntegerLiteralExpression)
    node.value = value;
    return node;
}

export function createVariableReferenceExpression(id: IdentifierToken): VariableReferenceExpression {
    const node = createNode<VariableReferenceExpression>(SyntaxKind.VariableReferenceExpression)
    node.id = id;
    return node;
}

export function createPrintingExpression(value: StringLiteralToken, args: NodeArray<Expression>): PrintingExpression {
    const node = createNode<PrintingExpression>(SyntaxKind.PrintingExpression);
    node.format = value;
    node.args = args;
    return node
}

export function createArraysExpression(length: Expression, defaultValue?: Expression): ArraysExpression {
    const node = createNode<ArraysExpression>(SyntaxKind.ArraysExpression)
    node.length = length;
    node.defaultValue = defaultValue;
    return node
}

export function createNullExpression(token: NullToken): NullExpression {
    const node = createNode<NullExpression>(SyntaxKind.NullExpression)
    node.token = token;
    return node
}

export function createObjectsExpression(extendsClause: Expression | undefined, slots: NodeArray<ObjectSlot>): ObjectsExpression {
    const node = createNode<ObjectsExpression>(SyntaxKind.ObjectsExpression)
    node.extendsClause = extendsClause;
    node.slots = slots;
    return node
}

export function createVariableSlot(name: IdentifierToken, initializer: Expression): VariableSlot {
    const node = createNode<VariableSlot>(SyntaxKind.VariableSlot)
    node.name = name;
    node.initializer = initializer;
    return node
}

export function createLocalVariableStatement(name: IdentifierToken, initializer: Expression): LocalVariableStatement {
    const node = createNode<LocalVariableStatement>(SyntaxKind.LocalVariableStatement)
    node.name = name;
    node.initializer = initializer;
    return node
}

export function createLocalExpressionStatement(expression: Expression): LocalExpressionStatement {
    const node = createNode<LocalExpressionStatement>(SyntaxKind.LocalExpressionStatement)
    node.expression = expression;
    return node
}

export function createSequenceOfStatements(statements: NodeArray<LocalStatement>): SequenceOfStatements {
    const node = createNode<SequenceOfStatements>(SyntaxKind.SequenceOfStatements)
    node.statements = statements;
    return node;
}