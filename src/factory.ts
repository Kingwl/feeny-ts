import { BinaryShorthandTokenSyntaxKind, Expression, FunctionStatement, GlobalVariableStatement, IfExpression, LocalStatement, MethodSlot, NodeArray, NullToken, ObjectSlot, PrimaryExpression, SequenceOfStatements, SlotLookupExpression, Statement, TokenSyntaxKind, TopLevelExpressionStatement, TopLevelStatement, VariableReferenceExpression } from ".";
import { ArraysExpression, ASTNode, BinaryShorthand, FunctionCallExpression, GetShorthand, IntegerLiteralExpression, LocalExpressionStatement, LocalVariableStatement, MethodCallExpression, NullExpression, ObjectsExpression, PrintingExpression, SetShorthand, SlotAssignmentExpression, SourceFile, TextSpan, ThisExpression, Token, VariableAssignmentExpression, VariableSlot, WhileExpression } from "./types";
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

export function createFunctionStatement(name: IdentifierToken, params: NodeArray<IdentifierToken>, body: LocalStatement): FunctionStatement {
    const node = createNode<FunctionStatement>(SyntaxKind.FunctionStatement)
    node.name = name;
    node.params = params;
    node.body = body;
    return node;
}

export function createMethodSlot(name: IdentifierToken, params: NodeArray<IdentifierToken>, body: LocalStatement): MethodSlot {
    const node = createNode<MethodSlot>(SyntaxKind.MethodSlot)
    node.name = name;
    node.params = params;
    node.body = body;
    return node;
}

export function createIfExpression(condition: Expression, thenStatement: LocalStatement, elseStatement?: LocalStatement): IfExpression {
    const node = createNode<IfExpression>(SyntaxKind.IfExpression)
    node.condition = condition;
    node.thenStatement = thenStatement;
    node.elseStatement = elseStatement;
    return node;
}

export function createWhileExpression(condition: Expression, body: LocalStatement): WhileExpression {
    const node = createNode<WhileExpression>(SyntaxKind.WhileExpression);
    node.condition = condition;
    node.body = body;
    return node;
}

export function createSlotLookupExpression(expression: PrimaryExpression, name: IdentifierToken): SlotLookupExpression {
    const node = createNode<SlotLookupExpression>(SyntaxKind.SlotLookupExpression)
    node.expression = expression;
    node.name = name;
    return node;
}

export function createSlotAssignmentExpression(expression: PrimaryExpression, name: IdentifierToken, value: Expression): SlotAssignmentExpression {
    const node = createNode<SlotAssignmentExpression>(SyntaxKind.SlotAssignmentExpression)
    node.expression = expression;
    node.name = name;
    node.value = value;
    return node;
}

export function createGetShorthand(expression: PrimaryExpression, argExpression: Expression): GetShorthand {
    const node = createNode<GetShorthand>(SyntaxKind.GetShorthand);
    node.expression = expression;
    node.argExpression = argExpression;
    return node;
}

export function createSetShorthand(expression: PrimaryExpression, argExpression: Expression, value: Expression): SetShorthand {
    const node = createNode<SetShorthand>(SyntaxKind.SetShorthand);
    node.expression = expression;
    node.argExpression = argExpression;
    node.value = value;
    return node;
}

export function createVariableAssignmentExpression(expression: PrimaryExpression, value: Expression): VariableAssignmentExpression {
    const node = createNode<VariableAssignmentExpression>(SyntaxKind.VariableAssignmentExpression)
    node.expression = expression;
    node.value = value;
    return node;
}

export function createMethodCallExpression(expression: PrimaryExpression, name: IdentifierToken, args: NodeArray<Expression>): MethodCallExpression {
    const node = createNode<MethodCallExpression>(SyntaxKind.MethodCallExpression)
    node.expression = expression;
    node.name = name;
    node.args = args;
    return node;
}

export function createFunctionCallExpression(expression: Expression, args: NodeArray<Expression>): FunctionCallExpression {
    const node = createNode<FunctionCallExpression>(SyntaxKind.FunctionCallExpression)
    node.expression = expression;
    node.args = args;
    return node;
}

export function createBinaryShorthand(left: Expression, operator: Token<BinaryShorthandTokenSyntaxKind>, right: Expression): BinaryShorthand {
    const node = createNode<BinaryShorthand>(SyntaxKind.BinaryShorthand)
    node.left = left;
    node.operator = operator;
    node.right = right;
    return node;
}

export function createThisExpression() {
    const node = createNode<ThisExpression>(SyntaxKind.ThisExpression)
    return node;
}