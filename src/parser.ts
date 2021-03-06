import {
  createArraysTypeNode,
  createIntegerTypeNode,
  createMethodSlotSignature,
  createNullTypeNode,
  createTypeDefDeclaration,
  createTypeReferenceTypeNode,
  createVariableSlotSignautre,
  createBreakExpression,
  createContinueExpression,
  createStringLiteralExpression,
  createVariableStatement,
  createIdentifier,
  createArraysExpression,
  createBinaryShorthand,
  createFunctionCallExpression,
  createFunctionStatement,
  createGetShorthand,
  createIfExpression,
  createIntegerLiteralExpression,
  createMethodCallExpression,
  createMethodSlot,
  createNodeArray,
  createNullExpression,
  createObjectsExpression,
  createParenExpression,
  createPrintingExpression,
  createSequenceOfStatements,
  createSetShorthand,
  createSlotAssignmentExpression,
  createSlotLookupExpression,
  createSourceFile,
  createThisExpression,
  createVariableAssignmentExpression,
  createVariableReferenceExpression,
  createVariableSlot,
  createWhileExpression,
  createExpressionStatement,
  createFunctionExpression,
  createParameterDeclaration
} from './factory';
import { createScanner } from './scanner';
import {
  AccessOrAssignmentExpressionOrHigher,
  AllTokens,
  ASTNode,
  ArraysExpression,
  BinaryShorthand,
  EndOfFileToken,
  Expression,
  FunctionStatement,
  IdentifierToken,
  IntegerLiteralExpression,
  IntegerLiteralToken,
  ExpressionStatement,
  MethodSlot,
  NodeArray,
  NullExpression,
  NullKeywordToken,
  ObjectsExpression,
  ObjectSlot,
  PrimaryExpression,
  PrintingExpression,
  SequenceOfStatements,
  StringLiteralToken,
  SubToken,
  SyntaxKind,
  TokenSyntaxKind,
  VariableAssignmentExpression,
  VariableReferenceExpression,
  VariableSlot,
  Statement,
  ObjectSlotSignature,
  TypeNode,
  TypeReferenceTypeNode,
  ParameterDeclaration,
  ObjectsKeywordToken
} from './types';
import {
  BinaryShorthandPriority,
  createFinishNode,
  finishNodeArray,
  getBinaryShorthandPriority,
  isBinaryShorthandToken,
  isKeywordSyntaxKind,
  TokenKindsToKeyword
} from './utils';
import { forEachChild } from './visitor'

function setParent (root: ASTNode) {
  let parent = root;
  forEachChild(root, visitor)

  function visitor (node: ASTNode) {
    Object.defineProperty(node, 'parent', {
      value: parent,
      enumerable: false
    })

    const savedParent = parent;
    parent = node;

    forEachChild(node, visitor)

    parent = savedParent;
  }
}

interface ParseOptions {
  shouldSetParent?: boolean;
}

export function createParser(text: string) {
  const scanner = createScanner(text);
  scanner.nextToken();
  const finishNode = createFinishNode(text);

  return {
    parse
  };

  function parse(options?: ParseOptions) {
    const { shouldSetParent = true } = options ?? {}

    const file = parseSourceFile();

    if (shouldSetParent) {
      setParent(file);
    }

    return file;
  }

  function parseExpectdToken<T extends AllTokens>(kind: T['kind']): T {
    const token = scanner.currentToken();
    if (token.kind !== kind) {
      throw new Error('Unexpected token: ' + token.__debugKind);
    }
    scanner.nextToken();
    return token as T;
  }

  function parseOptionalToken<T extends AllTokens>(
    kind: T['kind']
  ): T | undefined {
    const token = scanner.currentToken();
    if (token.kind !== kind) {
      return undefined;
    }
    scanner.nextToken();
    return token as T;
  }

  function parseSourceFile() {
    const pos = scanner.getTokenStart();
    const body = parseSequenceOfStatements(-Infinity, false);
    const eof = parseExpectdToken<EndOfFileToken>(SyntaxKind.EndOfFileToken);

    return finishNode(
      createSourceFile(body, eof),
      pos,
      scanner.getTokenFullStart()
    );
  }

  function parseExpressionStatement(): ExpressionStatement {
    const pos = scanner.getTokenStart();
    const expr = parseExpression();
    return finishNode(
      createExpressionStatement(expr),
      pos,
      scanner.getTokenFullStart()
    );
  }

  function parseStatement(): Statement {
    const token = scanner.currentToken();
    switch (token.kind) {
      case SyntaxKind.VarKeyword:
        return parseVariableStatement();
      case SyntaxKind.DefnKeyword:
        return parseFunctionStatement();
      case SyntaxKind.TypeDefKeyword:
        return parseTypeDefDeclaration();
      default:
        return parseExpressionStatement();
    }
  }

  function parseTypeDefDeclaration() {
    const pos = scanner.getTokenStart();
    parseExpectdToken(SyntaxKind.TypeDefKeyword);
    const name = parseExpectdToken<IdentifierToken>(SyntaxKind.Identifier);

    parseExpectdToken(SyntaxKind.ColonToken);
    const slots = parseObjectSlotListLike(name.leadingIndent, parseObjectSlotSignature);

    return finishNode(
      createTypeDefDeclaration(name, slots),
      pos,
      scanner.getTokenFullStart()
    );
  }

  function parseObjectSlotSignature (): ObjectSlotSignature {
    const token = scanner.currentToken();
    switch (token.kind) {
      case SyntaxKind.VarKeyword:
        return parseVariableSlotSignature();
      case SyntaxKind.MethodKeyword:
        return parseMethodSlotSignature();
      default:
        throw new Error(token.__debugKind);
    }
  }

  function parseMethodSlotSignature() {
    const pos = scanner.getTokenStart();
    parseExpectdToken(SyntaxKind.MethodKeyword);
    const name = parseExpectdToken<IdentifierToken>(SyntaxKind.Identifier);
    const params = parseParameterList();
    parseExpectdToken(SyntaxKind.SubGreaterThanToken);
    const type = parseTypeNode();
    return finishNode(
      createMethodSlotSignature(name, params, type),
      pos,
      scanner.getTokenFullStart()
    );
  }

  function parseVariableSlotSignature () {
    const pos = scanner.getTokenStart();
    parseExpectdToken(SyntaxKind.VarKeyword);
    const name = parseExpectdToken<IdentifierToken>(SyntaxKind.Identifier);
    parseExpectdToken(SyntaxKind.ColonToken);
    const type = parseTypeNode();
    return finishNode(
      createVariableSlotSignautre(name, type),
      pos,
      scanner.getTokenFullStart()
    )
  }

  function parseTypeNode (): TypeNode {
    const token = scanner.currentToken();
    switch (token.kind) {
      case SyntaxKind.IntegerKeyword:
        return parseIntegerTypeNode();
      case SyntaxKind.NullKeyword:
        return parseNullTypeNode();
      case SyntaxKind.ArraysKeyword:
        return parseArraysTypeNode();
      case SyntaxKind.Identifier:
        return parseTypeReferenceTypeNode();
      default:
        throw new Error(token.__debugKind);
    }
  }

  function parseTypeReferenceTypeNode(): TypeReferenceTypeNode {
    const pos = scanner.getTokenStart();
    const name = parseExpectdToken<IdentifierToken>(SyntaxKind.Identifier);
    return finishNode(
      createTypeReferenceTypeNode(name),
      pos,
      scanner.getTokenFullStart()
    )
  }

  function parseNullTypeNode() {
    const pos = scanner.getTokenStart();
    parseExpectdToken(SyntaxKind.NullKeyword);
    return finishNode(
      createNullTypeNode(),
      pos,
      scanner.getTokenFullStart()
    )
  }

  function parseIntegerTypeNode() {
    const pos = scanner.getTokenStart();
    parseExpectdToken(SyntaxKind.IntegerKeyword);
    return finishNode(
      createIntegerTypeNode(),
      pos,
      scanner.getTokenFullStart()
    );
  }

  function parseArraysTypeNode() {
    const pos = scanner.getTokenStart();
    parseExpectdToken(SyntaxKind.ArraysKeyword);
    parseExpectdToken(SyntaxKind.OpenParenToken);
    const type = parseTypeNode();
    parseExpectdToken(SyntaxKind.CloseParenToken);

    return finishNode(
      createArraysTypeNode(type),
      pos,
      scanner.getTokenFullStart()
    );
  }

  function parseVariableStatement() {
    const pos = scanner.getTokenStart();
    parseExpectdToken(SyntaxKind.VarKeyword);
    const name = parseExpectdToken<IdentifierToken>(SyntaxKind.Identifier);
    let type: TypeNode | undefined;
    if (parseOptionalToken(SyntaxKind.ColonToken)) {
      type = parseTypeNode();
    }
    parseExpectdToken(SyntaxKind.EqualsToken);
    const initializer = parseExpression();
    return finishNode(
      createVariableStatement(name, type, initializer),
      pos,
      scanner.getTokenFullStart()
    );
  }

  function parseParameter(): ParameterDeclaration {
    const pos = scanner.getTokenStart();
    const name = parseExpectdToken<IdentifierToken>(SyntaxKind.Identifier);

    let type: TypeNode | undefined;
    if (parseOptionalToken(SyntaxKind.ColonToken)) {
      type = parseTypeNode();
    }
    return finishNode(
      createParameterDeclaration(name, type),
      pos,
      scanner.getTokenFullStart()
    );
  }

  function parseParameterList(): NodeArray<ParameterDeclaration> {
    const pos = scanner.getTokenStart();
    parseExpectdToken(SyntaxKind.OpenParenToken);
    const params: ParameterDeclaration[] = [];
    while (
      !scanner.isEOF() &&
      scanner.currentToken().kind === SyntaxKind.Identifier
    ) {
      const param = parseParameter();
      params.push(param);

      parseOptionalToken(SyntaxKind.CommaToken);
    }
    parseExpectdToken(SyntaxKind.CloseParenToken);

    return finishNodeArray(
      createNodeArray(params),
      pos,
      scanner.getTokenFullStart()
    );
  }

  function parseFunctionStatement(): FunctionStatement {
    const pos = scanner.getTokenStart();
    parseExpectdToken(SyntaxKind.DefnKeyword);
    const name = parseExpectdToken<IdentifierToken>(SyntaxKind.Identifier);
    const params = parseParameterList();

    let type: TypeNode | undefined;
    if (parseOptionalToken(SyntaxKind.SubGreaterThanToken)) {
      type = parseTypeNode();
    }
    const body = parseExpressionStatementOrSequenceOfStatements(true);

    return finishNode(
      createFunctionStatement(name, params, type, body),
      pos,
      scanner.getTokenFullStart()
    );
  }

  function parseIndentStatementList(baseIndent: number): NodeArray<Statement> {
    const pos = scanner.getTokenStart();
    const statements: Statement[] = [];
    const indent = scanner.currentToken().leadingIndent;
    while (
      !scanner.isEOF() &&
      indent > baseIndent &&
      scanner.currentToken().leadingIndent === indent
    ) {
      const statement = parseStatement();
      statements.push(statement);
    }

    return finishNodeArray(
      createNodeArray(statements),
      pos,
      scanner.getTokenFullStart()
    );
  }

  function parseSequenceOfStatements<T extends boolean>(
    baseIndent: number,
    isExpression: T
  ): SequenceOfStatements<T> {
    const pos = scanner.getTokenStart();

    const statements = parseIndentStatementList(baseIndent);

    return finishNode(
      createSequenceOfStatements<T>(statements, isExpression),
      pos,
      scanner.getTokenFullStart()
    );
  }

  function parseExpression(): Expression {
    return parseBinaryShorthandOrHigher();
  }

  function parseBinaryShorthandOrHigher(
    priority = BinaryShorthandPriority.Lowest
  ): BinaryShorthand | Expression {
    const pos = scanner.getTokenStart();
    const expression = parseFunctionCallExpressionOrHigher();
    return parseBinaryShorthandRest(expression, pos, priority);
  }

  function parseBinaryShorthandRest(
    expression: Expression,
    pos: number,
    priority: BinaryShorthandPriority
  ) {
    while (true) {
      const operator = scanner.currentToken();
      if (
        !isBinaryShorthandToken(operator) ||
        scanner.currentTokenhasLineFeed()
      ) {
        break;
      }

      const currentPriority = getBinaryShorthandPriority(operator.kind);
      if (currentPriority <= priority) {
        break;
      }

      scanner.nextToken();
      const right = parseBinaryShorthandOrHigher(currentPriority);

      expression = finishNode(
        createBinaryShorthand(expression, operator, right),
        pos,
        scanner.getTokenFullStart()
      );
    }

    return expression;
  }

  function parseFunctionCallExpressionOrHigher() {
    const pos = scanner.getTokenStart();
    const expression = parseAccessOrAssignmentExpressionOrHigher();
    return parseFunctionCallExpressionRest(expression, pos);
  }

  function parseFunctionCallExpressionRest(
    expression: Expression,
    pos: number
  ) {
    while (true) {
      if (
        scanner.currentTokenhasLineFeed() ||
        scanner.currentToken().kind !== SyntaxKind.OpenParenToken
      ) {
        break;
      }

      const args = parseArgumentsList();
      const callExpression = finishNode(
        createFunctionCallExpression(expression, args),
        pos,
        scanner.getTokenFullStart()
      );
      expression = parseFunctionCallExpressionRest(callExpression, pos);
    }
    return expression;
  }

  function parseAccessOrAssignmentExpressionOrHigher(): AccessOrAssignmentExpressionOrHigher {
    const pos = scanner.getTokenStart();
    const primaryExpression = parsePrimaryExpression();
    return parseSlotOrShorthandOrAssignmentRest(primaryExpression, pos);
  }

  function parseSlotOrShorthandOrAssignmentRest(
    expression: AccessOrAssignmentExpressionOrHigher,
    pos: number
  ): AccessOrAssignmentExpressionOrHigher {
    while (true) {
      if (scanner.currentToken().kind === SyntaxKind.DotToken) {
        expression = parseSlotLookupOrAssignment(expression, pos);
        continue;
      }
      if (scanner.currentToken().kind === SyntaxKind.OpenBracketToken) {
        expression = parseGetShorthandOrSetShorthand(expression, pos);
        continue;
      }

      break;
    }

    return expression;
  }

  function parseIdentifierName() {
    const token = scanner.currentToken();
    if (isKeywordSyntaxKind(token.kind)) {
      const text = TokenKindsToKeyword[token.kind];
      const id = createIdentifier(text);
      scanner.nextToken();
      return id;
    }

    return parseExpectdToken<IdentifierToken>(SyntaxKind.Identifier);
  }

  function parseSlotLookupOrAssignment(
    expression: AccessOrAssignmentExpressionOrHigher,
    pos: number
  ) {
    parseExpectdToken(SyntaxKind.DotToken);
    const name = parseIdentifierName();

    if (parseOptionalToken(SyntaxKind.EqualsToken)) {
      const value = parseExpression();
      return finishNode(
        createSlotAssignmentExpression(expression, name, value),
        pos,
        scanner.getTokenFullStart()
      );
    }
    if (scanner.currentToken().kind === SyntaxKind.OpenParenToken) {
      const args = parseArgumentsList();
      return finishNode(
        createMethodCallExpression(expression, name, args),
        pos,
        scanner.getTokenFullStart()
      );
    }
    return finishNode(
      createSlotLookupExpression(expression, name),
      pos,
      scanner.getTokenFullStart()
    );
  }

  function parseGetShorthandOrSetShorthand(
    expression: AccessOrAssignmentExpressionOrHigher,
    pos: number
  ) {
    const args = parseArgumentsList(
      SyntaxKind.OpenBracketToken,
      SyntaxKind.CloseBracketToken
    );
    if (parseOptionalToken(SyntaxKind.EqualsToken)) {
      const value = parseExpression();
      return finishNode(
        createSetShorthand(expression, args, value),
        pos,
        scanner.getTokenFullStart()
      );
    }
    return finishNode(
      createGetShorthand(expression, args),
      pos,
      scanner.getTokenFullStart()
    );
  }

  function parseArgumentsList(
    openToken: TokenSyntaxKind = SyntaxKind.OpenParenToken,
    closeToken: TokenSyntaxKind = SyntaxKind.CloseParenToken
  ): NodeArray<Expression> {
    const pos = scanner.getTokenStart();
    parseExpectdToken(openToken);
    const args: Expression[] = [];
    while (!scanner.isEOF() && scanner.currentToken().kind !== closeToken) {
      const arg = parseExpression();
      args.push(arg);

      parseOptionalToken(SyntaxKind.CommaToken);
    }
    parseExpectdToken(closeToken);

    return finishNodeArray(createNodeArray(args), pos, scanner.getTokenFullStart());
  }

  function parsePrimaryExpression(): PrimaryExpression {
    const token = scanner.currentToken();
    switch (token.kind) {
      case SyntaxKind.SubToken:
      case SyntaxKind.IntegerLiteralToken:
        return parseIntegerLiteralExpression();
      case SyntaxKind.StringLiteralToken:
        return parseStringLiteralExpression();
      case SyntaxKind.Identifier:
        return parseVariableReferenceOrAssignmentExpression();
      case SyntaxKind.PrintfKeyword:
        return parsePrintingExpression();
      case SyntaxKind.ArraysKeyword:
        return parseArraysExpression();
      case SyntaxKind.NullKeyword:
        return parseNullExpression();
      case SyntaxKind.ObjectsKeyword:
        return parseObjectsExpression();
      case SyntaxKind.IfKeyword:
        return parseIfExpression();
      case SyntaxKind.WhileKeyword:
        return parseWhileExpression();
      case SyntaxKind.ThisKeyword:
        return parseThisExpression();
      case SyntaxKind.OpenParenToken:
        return parseParenExpression();
      case SyntaxKind.DefnKeyword:
        return parseFunctionExpression();
      case SyntaxKind.BreakKeyword:
        return parseBreakExpression();
      case SyntaxKind.ContinueKeyword:
        return parseContinueExpression();
      default:
        throw new Error(token.__debugKind);
    }
  }

  function parseContinueExpression() {
    const pos = scanner.getTokenStart();
    parseExpectdToken(SyntaxKind.ContinueKeyword);
    return finishNode(createContinueExpression(), pos, scanner.getTokenFullStart());
  }

  function parseBreakExpression() {
    const pos = scanner.getTokenStart();
    parseExpectdToken(SyntaxKind.BreakKeyword);
    return finishNode(createBreakExpression(), pos, scanner.getTokenFullStart());
  }

  function parseStringLiteralExpression() {
    const pos = scanner.getTokenStart();
    const token = parseExpectdToken<StringLiteralToken>(
      SyntaxKind.StringLiteralToken
    );
    return finishNode(
      createStringLiteralExpression(token),
      pos,
      scanner.getTokenFullStart()
    );
  }

  function parseFunctionExpression() {
    const pos = scanner.getTokenStart();
    parseExpectdToken(SyntaxKind.DefnKeyword);
    const name = parseExpectdToken<IdentifierToken>(SyntaxKind.Identifier);
    const params = parseParameterList();

    let type: TypeNode | undefined;
    if (parseOptionalToken(SyntaxKind.SubGreaterThanToken)) {
      type = parseTypeNode();
    }

    const body = parseExpressionStatementOrSequenceOfStatements(true);

    return finishNode(
      createFunctionExpression(name, params, type, body),
      pos,
      scanner.getTokenFullStart()
    );
  }

  function parseParenExpression() {
    const pos = scanner.getTokenStart();
    parseExpectdToken(SyntaxKind.OpenParenToken);
    const expression = parseExpression();
    parseExpectdToken(SyntaxKind.CloseParenToken);

    return finishNode(
      createParenExpression(expression),
      pos,
      scanner.getTokenFullStart()
    );
  }

  function parseThisExpression() {
    const pos = scanner.getTokenStart();
    parseExpectdToken(SyntaxKind.ThisKeyword);
    return finishNode(createThisExpression(), pos, scanner.getTokenFullStart());
  }

  function parseExpressionStatementOrSequenceOfStatements<T extends boolean>(
    isExpression: T
  ) {
    const colonToken = parseOptionalToken(SyntaxKind.ColonToken);
    if (colonToken && scanner.currentTokenhasLineFeed()) {
      return parseSequenceOfStatements(colonToken.leadingIndent, isExpression);
    }
    return parseExpressionStatement();
  }

  function parseIfExpression() {
    const pos = scanner.getTokenStart();
    parseExpectdToken(SyntaxKind.IfKeyword);
    const condition = parseExpression();

    const thenStatement = parseExpressionStatementOrSequenceOfStatements(true);

    let elseStatement: SequenceOfStatements<true> | ExpressionStatement | undefined;
    const elseToken = parseOptionalToken(SyntaxKind.ElseKeyword);
    if (elseToken) {
      elseStatement = parseExpressionStatementOrSequenceOfStatements(true);
    }

    return finishNode(
      createIfExpression(condition, thenStatement, elseStatement),
      pos,
      scanner.getTokenFullStart()
    );
  }

  function parseWhileExpression() {
    const pos = scanner.getTokenStart();
    parseExpectdToken(SyntaxKind.WhileKeyword);
    const condition = parseExpression();
    const body = parseExpressionStatementOrSequenceOfStatements(false);

    return finishNode(
      createWhileExpression(condition, body),
      pos,
      scanner.getTokenFullStart()
    );
  }

  function parseIntegerLiteralExpression(): IntegerLiteralExpression {
    const pos = scanner.getTokenStart();
    const subToken = parseOptionalToken<SubToken>(SyntaxKind.SubToken);

    const token = parseExpectdToken<IntegerLiteralToken>(
      SyntaxKind.IntegerLiteralToken
    );
    return finishNode(
      createIntegerLiteralExpression(token, subToken),
      pos,
      scanner.getTokenFullStart()
    );
  }

  function parseVariableReferenceOrAssignmentExpression():
    | VariableReferenceExpression
    | VariableAssignmentExpression {
    const pos = scanner.getTokenStart();
    const token = parseExpectdToken<IdentifierToken>(SyntaxKind.Identifier);

    const expression = finishNode(
      createVariableReferenceExpression(token),
      pos,
      scanner.getTokenFullStart()
    )

    if (scanner.currentToken().kind === SyntaxKind.EqualsToken) {
      parseExpectdToken(SyntaxKind.EqualsToken);
      const value = parseExpression();

      return finishNode(
        createVariableAssignmentExpression(expression, value),
        pos,
        scanner.getTokenFullStart()
      );
    }

    return expression;
  }

  function parsePrintingExpression(): PrintingExpression {
    const pos = scanner.getTokenStart();
    parseExpectdToken(SyntaxKind.PrintfKeyword);
    const args = parseArgumentsList();
    return finishNode(
      createPrintingExpression(args),
      pos,
      scanner.getTokenFullStart()
    );
  }

  function parseArraysExpression(): ArraysExpression {
    const pos = scanner.getTokenStart();
    parseExpectdToken(SyntaxKind.ArraysKeyword);
    parseExpectdToken(SyntaxKind.OpenParenToken);
    const length = parseExpression();
    if (scanner.currentToken().kind === SyntaxKind.CloseParenToken) {
      scanner.nextToken();
      return finishNode(
        createArraysExpression(length),
        pos,
        scanner.getTokenFullStart()
      );
    }
    parseOptionalToken(SyntaxKind.CommaToken);
    const defaultValue = parseExpression();
    parseExpectdToken(SyntaxKind.CloseParenToken);

    return finishNode(
      createArraysExpression(length, defaultValue),
      pos,
      scanner.getTokenFullStart()
    );
  }

  function parseNullExpression(): NullExpression {
    const pos = scanner.getTokenStart();
    const token = parseExpectdToken<NullKeywordToken>(SyntaxKind.NullKeyword);
    return finishNode(
      createNullExpression(token),
      pos,
      scanner.getTokenFullStart()
    );
  }

  function isStartOfObjectSlot(): boolean {
    const token = scanner.currentToken();
    return (
      token.kind === SyntaxKind.VarKeyword ||
      token.kind === SyntaxKind.MethodKeyword
    );
  }

  function parseObjectSlotListLike<T extends ObjectSlot | ObjectSlotSignature>(indent: number, factory: () => T): NodeArray<T> {
    const pos = scanner.getTokenStart();
    const slots: T[] = [];
    const slotIndent = scanner.currentToken().leadingIndent;
    while (
      slotIndent > indent &&
      !scanner.isEOF() &&
      isStartOfObjectSlot() &&
      scanner.currentToken().leadingIndent === slotIndent
    ) {
      const slot = factory();
      slots.push(slot);
    }

    return finishNodeArray(
      createNodeArray(slots),
      pos,
      scanner.getTokenFullStart()
    );
  }

  function parseObjectSlot(): ObjectSlot {
    const token = scanner.currentToken();
    switch (token.kind) {
      case SyntaxKind.VarKeyword:
        return parseVariableSlot();
      case SyntaxKind.MethodKeyword:
        return parseMethodSlot();
      default:
        throw new Error(token.__debugKind);
    }
  }

  function parseVariableSlot(): VariableSlot {
    const pos = scanner.getTokenStart();

    parseExpectdToken(SyntaxKind.VarKeyword);
    const name = parseIdentifierName();
    let type: TypeNode | undefined;
    if (parseOptionalToken(SyntaxKind.ColonToken)) {
      type = parseTypeNode();
    }
    parseExpectdToken(SyntaxKind.EqualsToken);
    const initializer = parseExpression();

    return finishNode(
      createVariableSlot(name, type, initializer),
      pos,
      scanner.getTokenFullStart()
    );
  }

  function parseMethodSlot(): MethodSlot {
    const pos = scanner.getTokenStart();
    parseExpectdToken(SyntaxKind.MethodKeyword);
    const name = parseIdentifierName();
    const params = parseParameterList();

    let type: TypeNode | undefined;
    if (parseOptionalToken(SyntaxKind.SubGreaterThanToken)) {
      type = parseTypeNode();
    }

    const body = parseExpressionStatementOrSequenceOfStatements(true);

    return finishNode(
      createMethodSlot(name, params, type, body),
      pos,
      scanner.getTokenFullStart()
    );
  }

  function parseObjectsExpression(): ObjectsExpression {
    const pos = scanner.getTokenStart();
    const objectKeyword = parseExpectdToken<ObjectsKeywordToken>(SyntaxKind.ObjectsKeyword);

    let extendsClause: Expression | undefined;
    if (parseOptionalToken(SyntaxKind.OpenParenToken)) {
      extendsClause = parseExpression();
      parseExpectdToken(SyntaxKind.CloseParenToken);
    }
    parseExpectdToken(SyntaxKind.ColonToken);

    const slots = parseObjectSlotListLike(objectKeyword.leadingIndent, parseObjectSlot);

    return finishNode(
      createObjectsExpression(objectKeyword, extendsClause, slots),
      pos,
      scanner.getTokenFullStart()
    );
  }
}
