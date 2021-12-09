import { ObjectSlotSignature, TypeDefDeclaration, TypeNode, VariableSlotSignatureDeclaration } from '.';
import {
  Statement,
  ParameterDeclaration,
  BreakExpression,
  ContinueExpression,
  AccessOrAssignmentExpressionOrHigher,
  ArraysExpression,
  ASTNode,
  BinaryShorthand,
  BinaryShorthandTokenSyntaxKind,
  EndOfFileToken,
  Expression,
  ExpressionStatement,
  FunctionCallExpression,
  FunctionStatement,
  FunctionExpression,
  GetShorthand,
  IdentifierToken,
  IfExpression,
  IntegerLiteralExpression,
  IntegerLiteralToken,
  MethodCallExpression,
  MethodSlot,
  NodeArray,
  NullExpression,
  NullKeywordToken,
  ObjectsExpression,
  ObjectSlot,
  ParenExpression,
  PrintingExpression,
  SequenceOfStatements,
  SetShorthand,
  SlotAssignmentExpression,
  SlotLookupExpression,
  SourceFile,
  StringLiteralToken,
  SubToken,
  SyntaxKind,
  ThisExpression,
  Token,
  TokenSyntaxKind,
  VariableAssignmentExpression,
  VariableReferenceExpression,
  VariableSlot,
  VariableStatement,
  WhileExpression,
  StringLiteralExpression,
  MethodSlotSignatureDeclaration,
  ArraysTypeNode,
  IntegerTypeNode,
  TypeReferenceTypeNode,
  NullTypeNode
} from './types';

export function createNode<T extends ASTNode>(kind: T['kind']): T {
  const token = { kind } as T;
  token.pos = -1;
  token.end = -1;
  return token;
}

export function createNodeArray<T extends ASTNode>(
  nodes: readonly T[]
): NodeArray<T> {
  const arr = nodes as NodeArray<T>;
  arr.pos = -1;
  arr.end = -1;
  return arr;
}

export function createToken<T extends TokenSyntaxKind>(kind: T): Token<T> {
  return createNode(kind);
}

export function createStringLiteralToken(value: string): StringLiteralToken {
  const token = createToken(
    SyntaxKind.StringLiteralToken
  ) as StringLiteralToken;
  token.value = value;
  return token;
}

export function createNumberLiteralToken(value: string): IntegerLiteralToken {
  const token = createToken(
    SyntaxKind.IntegerLiteralToken
  ) as IntegerLiteralToken;
  token.value = value;
  return token;
}

export function createIdentifier(text: string): IdentifierToken {
  const token = createToken(SyntaxKind.Identifier) as IdentifierToken;
  token.text = text;
  return token;
}

export function createSourceFile(
  body: SequenceOfStatements<false>,
  eof: EndOfFileToken
): SourceFile {
  const node = createNode<SourceFile>(SyntaxKind.SourceFile);
  node.body = body;
  node.eof = eof;
  return node;
}

export function createIntegerLiteralExpression(
  value: IntegerLiteralToken,
  subToken?: SubToken
): IntegerLiteralExpression {
  const node = createNode<IntegerLiteralExpression>(
    SyntaxKind.IntegerLiteralExpression
  );
  node.value = value;
  node.subToken = subToken;
  return node;
}

export function createStringLiteralExpression(
  value: StringLiteralToken
): StringLiteralExpression {
  const node = createNode<StringLiteralExpression>(
    SyntaxKind.StringLiteralExpression
  );
  node.value = value;
  return node;
}

export function createVariableReferenceExpression(
  name: IdentifierToken
): VariableReferenceExpression {
  const node = createNode<VariableReferenceExpression>(
    SyntaxKind.VariableReferenceExpression
  );
  node.name = name;
  return node;
}

export function createPrintingExpression(
  args: NodeArray<Expression>
): PrintingExpression {
  const node = createNode<PrintingExpression>(SyntaxKind.PrintingExpression);
  node.args = args;
  return node;
}

export function createArraysExpression(
  length: Expression,
  defaultValue?: Expression
): ArraysExpression {
  const node = createNode<ArraysExpression>(SyntaxKind.ArraysExpression);
  node.length = length;
  node.defaultValue = defaultValue;
  return node;
}

export function createNullExpression(token: NullKeywordToken): NullExpression {
  const node = createNode<NullExpression>(SyntaxKind.NullExpression);
  node.token = token;
  return node;
}

export function createObjectsExpression(
  extendsClause: Expression | undefined,
  slots: NodeArray<ObjectSlot>
): ObjectsExpression {
  const node = createNode<ObjectsExpression>(SyntaxKind.ObjectsExpression);
  node.extendsClause = extendsClause;
  node.slots = slots;
  return node;
}

export function createVariableSlot(
  name: IdentifierToken,
  type: TypeNode | undefined,
  initializer: Expression
): VariableSlot {
  const node = createNode<VariableSlot>(SyntaxKind.VariableSlot);
  node.name = name;
  node.type = type;
  node.initializer = initializer;
  return node;
}

export function createVariableStatement(
  name: IdentifierToken,
  type: TypeNode | undefined,
  initializer: Expression
): VariableStatement {
  const node = createNode<VariableStatement>(SyntaxKind.VariableStatement);
  node.name = name;
  node.type = type;
  node.initializer = initializer;
  return node;
}

export function createExpressionStatement(
  expression: Expression
): ExpressionStatement {
  const node = createNode<ExpressionStatement>(SyntaxKind.ExpressionStatement);
  node.expression = expression;
  return node;
}

export function createSequenceOfStatements<T extends boolean>(
  statements: NodeArray<Statement>,
  isExpression: T
): SequenceOfStatements<T> {
  const node = createNode<SequenceOfStatements<T>>(
    SyntaxKind.SequenceOfStatements
  );
  node.statements = statements;
  node.isExpression = isExpression;
  return node;
}

export function createFunctionStatement(
  name: IdentifierToken,
  params: NodeArray<ParameterDeclaration>,
  type: TypeNode | undefined,
  body: SequenceOfStatements<true> | ExpressionStatement
): FunctionStatement {
  const node = createNode<FunctionStatement>(SyntaxKind.FunctionStatement);
  node.name = name;
  node.params = params;
  node.type = type;
  node.body = body;
  return node;
}

export function createBreakExpression(): BreakExpression {
  const node = createNode<BreakExpression>(SyntaxKind.BreakExpression);
  return node;
}

export function createContinueExpression(): ContinueExpression {
  const node = createNode<ContinueExpression>(SyntaxKind.ContinueExpression);
  return node;
}

export function createMethodSlot(
  name: IdentifierToken,
  params: NodeArray<ParameterDeclaration>,
  type: TypeNode | undefined,
  body: SequenceOfStatements<true> | ExpressionStatement
): MethodSlot {
  const node = createNode<MethodSlot>(SyntaxKind.MethodSlot);
  node.name = name;
  node.params = params;
  node.type = type;
  node.body = body;
  return node;
}

export function createIfExpression(
  condition: Expression,
  thenStatement: SequenceOfStatements<true> | ExpressionStatement,
  elseStatement?: SequenceOfStatements<true> | ExpressionStatement
): IfExpression {
  const node = createNode<IfExpression>(SyntaxKind.IfExpression);
  node.condition = condition;
  node.thenStatement = thenStatement;
  node.elseStatement = elseStatement;
  return node;
}

export function createWhileExpression(
  condition: Expression,
  body: SequenceOfStatements | ExpressionStatement
): WhileExpression {
  const node = createNode<WhileExpression>(SyntaxKind.WhileExpression);
  node.condition = condition;
  node.body = body;
  return node;
}

export function createSlotLookupExpression(
  expression: AccessOrAssignmentExpressionOrHigher,
  name: IdentifierToken
): SlotLookupExpression {
  const node = createNode<SlotLookupExpression>(
    SyntaxKind.SlotLookupExpression
  );
  node.expression = expression;
  node.name = name;
  return node;
}

export function createSlotAssignmentExpression(
  expression: AccessOrAssignmentExpressionOrHigher,
  name: IdentifierToken,
  value: Expression
): SlotAssignmentExpression {
  const node = createNode<SlotAssignmentExpression>(
    SyntaxKind.SlotAssignmentExpression
  );
  node.expression = expression;
  node.name = name;
  node.value = value;
  return node;
}

export function createGetShorthand(
  expression: AccessOrAssignmentExpressionOrHigher,
  args: NodeArray<Expression>
): GetShorthand {
  const node = createNode<GetShorthand>(SyntaxKind.GetShorthand);
  node.expression = expression;
  node.args = args;
  return node;
}

export function createSetShorthand(
  expression: AccessOrAssignmentExpressionOrHigher,
  args: NodeArray<Expression>,
  value: Expression
): SetShorthand {
  const node = createNode<SetShorthand>(SyntaxKind.SetShorthand);
  node.expression = expression;
  node.args = args;
  node.value = value;
  return node;
}

export function createVariableAssignmentExpression(
  expression: VariableReferenceExpression,
  value: Expression
): VariableAssignmentExpression {
  const node = createNode<VariableAssignmentExpression>(
    SyntaxKind.VariableAssignmentExpression
  );
  node.expression = expression;
  node.value = value;
  return node;
}

export function createMethodCallExpression(
  expression: AccessOrAssignmentExpressionOrHigher,
  name: IdentifierToken,
  args: NodeArray<Expression>
): MethodCallExpression {
  const node = createNode<MethodCallExpression>(
    SyntaxKind.MethodCallExpression
  );
  node.expression = expression;
  node.name = name;
  node.args = args;
  return node;
}

export function createFunctionCallExpression(
  expression: Expression,
  args: NodeArray<Expression>
): FunctionCallExpression {
  const node = createNode<FunctionCallExpression>(
    SyntaxKind.FunctionCallExpression
  );
  node.expression = expression;
  node.args = args;
  return node;
}

export function createFunctionExpression(
  name: IdentifierToken,
  params: NodeArray<ParameterDeclaration>,
  type: TypeNode | undefined,
  body: SequenceOfStatements<true> | ExpressionStatement
) {
  const node = createNode<FunctionExpression>(SyntaxKind.FunctionExpression);
  node.name = name;
  node.params = params;
  node.type = type;
  node.body = body;
  return node;
}

export function createBinaryShorthand(
  left: Expression,
  operator: Token<BinaryShorthandTokenSyntaxKind>,
  right: Expression
): BinaryShorthand {
  const node = createNode<BinaryShorthand>(SyntaxKind.BinaryShorthand);
  node.left = left;
  node.operator = operator;
  node.right = right;
  return node;
}

export function createThisExpression() {
  const node = createNode<ThisExpression>(SyntaxKind.ThisExpression);
  return node;
}

export function createParenExpression(expression: Expression) {
  const node = createNode<ParenExpression>(SyntaxKind.ParenExpression);
  node.expression = expression;
  return node;
}

export function createParameterDeclaration(name: IdentifierToken, type: TypeNode | undefined) {
  const node = createNode<ParameterDeclaration>(SyntaxKind.ParameterDeclaration);
  node.name = name;
  node.type = type;
  return node;
}

export function createTypeDefDeclaration(name: IdentifierToken, slots: NodeArray<ObjectSlotSignature>) {
  const node = createNode<TypeDefDeclaration>(SyntaxKind.TypeDefDeclaration);
  node.name = name;
  node.slots = slots;
  return node;
}

export function createVariableSlotSignautre(name: IdentifierToken, type: TypeNode) {
  const node = createNode<VariableSlotSignatureDeclaration>(SyntaxKind.VariableSlotSignatureDeclaration);
  node.name = name;
  node.type = type;
  return node;
}

export function createMethodSlotSignature(name: IdentifierToken, params: NodeArray<ParameterDeclaration>, type: TypeNode) {
  const node = createNode<MethodSlotSignatureDeclaration>(SyntaxKind.MethodSlotSignatureDeclaration);
  node.name = name;
  node.params = params;
  node.type = type;
  return node;
}

export function createIntegerTypeNode() {
  const node = createNode<IntegerTypeNode>(SyntaxKind.IntegerTypeNode);
  return node;
}

export function createNullTypeNode() {
  const node = createNode<NullTypeNode>(SyntaxKind.NullTypeNode);
  return node;
}

export function createArraysTypeNode(type: TypeNode) {
  const node = createNode<ArraysTypeNode>(SyntaxKind.ArraysTypeNode);
  node.type = type;
  return node;
}

export function createTypeReferenceTypeNode(name: IdentifierToken) {
  const node = createNode<TypeReferenceTypeNode>(SyntaxKind.TypeReferenceTypeNode);
  node.name = name;
  return node;
}