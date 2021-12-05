import { createArraysExpression, createBinaryShorthand, createFunctionCallExpression, createFunctionStatement, createGetShorthand, createGlobalVariableStatement, createIfExpression, createIntegerLiteralExpression, createLocalExpressionStatement, createLocalVariableStatement, createMethodCallExpression, createMethodSlot, createNodeArray, createNullExpression, createObjectsExpression, createParenExpression, createPrintingExpression, createSequenceOfStatements, createSetShorthand, createSlotAssignmentExpression, createSlotLookupExpression, createSourceFile, createThisExpression, createTopLevelExpressionStatement, createVariableAssignmentExpression, createVariableReferenceExpression, createVariableSlot, createWhileExpression } from './factory';
import { createScanner } from "./scanner";
import { AccessOrAssignmentExpressionOrHigher, AllTokens, ArraysExpression, BinaryShorthand, EndOfFileToken, Expression, FunctionStatement, GlobalVariableStatement, IdentifierToken, IntegerLiteralExpression, IntegerLiteralToken, LocalExpressionStatement, LocalStatement, LocalVariableStatement, MethodSlot, NodeArray, NullExpression, NullToken, ObjectsExpression, ObjectSlot, PrimaryExpression, PrintingExpression, SequenceOfStatements, StringLiteralToken, SubToken, SyntaxKind, TokenSyntaxKind, TopLevelExpressionStatement, TopLevelStatement, VariableReferenceExpression, VariableSlot } from "./types";
import { createFinishNode, finishNodeArray, isBinaryShorthandToken } from './utils';

export function createParser(text: string) {
    const scanner = createScanner(text);
    scanner.nextToken();
    const finishNode = createFinishNode(text)

    return {
        parseSourceFile
    }

    function parseExpectdToken<T extends AllTokens>(kind: T['kind']): T {
        const token = scanner.currentToken();
        if (token.kind !== kind) {
            throw new Error("Unexpected token: " + token.__debugKind);
        }
        scanner.nextToken();
        return token as T;
    }

    function parseOptionalToken<T extends AllTokens>(kind: T['kind']): T | undefined {
        const token = scanner.currentToken();
        if (token.kind !== kind) {
            return undefined;
        }
        scanner.nextToken();
        return token as T;
    }

    function parseSourceFile () {
        const pos = scanner.getTokenStart();
        const body = parseSequenceOfStatements(-Infinity, parseTopLevelStatement);
        const eof = parseExpectdToken<EndOfFileToken>(SyntaxKind.EndOfFileToken);
        
        return finishNode(
            createSourceFile(body, eof),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parseLocalStatement(): LocalStatement {
        const token = scanner.currentToken();

        switch (token.kind) {
            case SyntaxKind.VarKeyword:
                return parseLocalVariableStatement();
            default:
                return parseLocalExpressionStatement();
        }
    }

    function parseLocalVariableStatement(): LocalVariableStatement {
        return parseVariableStatementLike(createLocalVariableStatement)
    }

    function parseLocalExpressionStatement(): LocalExpressionStatement {
        const pos = scanner.getTokenStart();
        const expr = parseExpression();
        return finishNode(
            createLocalExpressionStatement(expr),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parseTopLevelStatement(): TopLevelStatement {
        const token = scanner.currentToken();
        switch (token.kind) {
            case SyntaxKind.VarKeyword:
                return parseGlobalVarStatement();
            case SyntaxKind.DefnKeyword:
                return parseFunctionStatement();
            default:
                return parseTopLevelExpressionStatement();
        }
    }

    function parseVariableStatementLike<T extends GlobalVariableStatement | LocalVariableStatement>(
        factory: (
            name: IdentifierToken,
            initializer: Expression
        ) => T
    ) {
        const pos = scanner.getTokenStart();
        parseExpectdToken(SyntaxKind.VarKeyword);
        const name = parseExpectdToken<IdentifierToken>(SyntaxKind.Identifier);
        parseExpectdToken(SyntaxKind.EqualsToken);
        const initializer = parseExpression()
        return finishNode(
            factory(
                name,
                initializer
            ),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parseGlobalVarStatement(): GlobalVariableStatement {
        return parseVariableStatementLike(createGlobalVariableStatement);
    }

    function parseParameterList(): NodeArray<IdentifierToken> {
        const pos = scanner.getTokenStart();
        parseExpectdToken(SyntaxKind.OpenParenToken);
        const params: IdentifierToken[] = [];
        while (!scanner.isEOF() && scanner.currentToken().kind === SyntaxKind.Identifier) {
            const param = parseExpectdToken<IdentifierToken>(SyntaxKind.Identifier)
            params.push(param);

            parseOptionalToken(SyntaxKind.CommaToken);
        }
        parseExpectdToken(SyntaxKind.CloseParenToken);

        return finishNodeArray(
            createNodeArray(params),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parseFunctionStatement(): FunctionStatement {
        const pos = scanner.getTokenStart();
        parseExpectdToken(SyntaxKind.DefnKeyword);
        const name = parseExpectdToken<IdentifierToken>(SyntaxKind.Identifier);
        const params = parseParameterList();
        const body = parseLocalSequenceOfStatements()

        return finishNode(
            createFunctionStatement(
                name,
                params,
                body,
            ),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parseIndentStatementList<T extends LocalStatement | TopLevelStatement>(baseIndent: number, factory: () => T): NodeArray<T> {
        const pos = scanner.getTokenStart();
        const statements: T[] = [];
        const indent = scanner.currentToken().leadingIndent;
        while (!scanner.isEOF() && indent > baseIndent && scanner.currentToken().leadingIndent === indent) {
            const statement = factory();
            statements.push(statement);
        }

        return finishNodeArray(
            createNodeArray(statements),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parseSequenceOfStatements<T extends LocalStatement | TopLevelStatement>(baseIndent: number, factory: () => T): SequenceOfStatements<T> {
        const pos = scanner.getTokenStart();

        const statements = parseIndentStatementList(baseIndent, factory);
    
        return finishNode(
            createSequenceOfStatements(statements),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parseTopLevelExpressionStatement(): TopLevelExpressionStatement {
        const pos = scanner.getTokenStart();
        return finishNode(
            createTopLevelExpressionStatement(
                parseExpression(),
            ),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parseExpressionList(endToken: SyntaxKind): NodeArray<Expression> {
        const expressions: Expression[] = [];
        const pos = scanner.getTokenStart();

        while (!scanner.isEOF() && scanner.currentToken().kind !== endToken) {
            expressions.push(parseExpression());

            parseOptionalToken(SyntaxKind.CommaToken);
        }
        return finishNodeArray(
            createNodeArray(expressions),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parseExpression(): Expression {
        return parseShorthandOrHigher();
    }

    function parseShorthandOrHigher() {
        const pos = scanner.getTokenStart();
        const expression = parseFunctionCallExpressionOrHigher();
        if (isBinaryShorthandToken(scanner.currentToken()) && !scanner.currentTokenhasLineFeed()) {
            return parseBinaryShorthand(expression, pos)
        }
        return expression
    }


    function parseBinaryShorthand(left: Expression, pos: number): BinaryShorthand {
        const operator = scanner.currentToken();
        if (!isBinaryShorthandToken(operator)) {
            throw new Error(`Expected binary shorthand token, got ${operator.kind}`);
        }
        scanner.nextToken();
        const right = parseExpression();

        return finishNode(
            createBinaryShorthand(
                left,
                operator,
                right
            ),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parseFunctionCallExpressionOrHigher() {
        const pos = scanner.getTokenStart();
        const expression = parseAccessOrAssignmentExpressionOrHigher();
        if (!scanner.currentTokenhasLineFeed() && scanner.currentToken().kind === SyntaxKind.OpenParenToken) {
            const args = parseArgumentsList();
            return finishNode(
                createFunctionCallExpression(
                    expression,
                    args
                ),
                pos,
                scanner.getCurrentPos()
            )
        }
        return expression;
    }

    function parseAccessOrAssignmentExpressionOrHigher (): AccessOrAssignmentExpressionOrHigher {
        const pos = scanner.getTokenStart();
        const primaryExpression = parsePrimaryExpression();
        return parseSlotOrShorthandOrAssignmentRest(primaryExpression, pos);
    }

    function parseSlotOrShorthandOrAssignmentRest(expression: AccessOrAssignmentExpressionOrHigher, pos: number): AccessOrAssignmentExpressionOrHigher {
        while (true) {
            if (scanner.currentToken().kind === SyntaxKind.DotToken) {
                expression = parseSlotLookupOrAssignment(expression, pos)
                pos = scanner.getCurrentPos();
                continue
            }
            if (scanner.currentToken().kind === SyntaxKind.OpenBracketToken) {
                expression = parseGetShorthandOrGetShorthand(expression, pos);
                pos = scanner.getCurrentPos();
                continue
            }
            if (scanner.currentToken().kind === SyntaxKind.EqualsToken) {
                expression = parseVariableAssignmentExpression(expression, pos);
                pos = scanner.getCurrentPos();
                continue
            }

            break;
        }

        return expression
    }


    function parseVariableAssignmentExpression(expression: AccessOrAssignmentExpressionOrHigher, pos: number) {
        parseExpectdToken(SyntaxKind.EqualsToken);
        const value = parseExpression();
        return finishNode(
            createVariableAssignmentExpression(
                expression,
                value
            ),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parseSlotLookupOrAssignment(expression: AccessOrAssignmentExpressionOrHigher, pos: number) {
        parseExpectdToken(SyntaxKind.DotToken);
        const name = parseExpectdToken<IdentifierToken>(SyntaxKind.Identifier);

        if (parseOptionalToken(SyntaxKind.EqualsToken)) {
            const value = parseExpression();
            return finishNode(
                createSlotAssignmentExpression(
                    expression,
                    name,
                    value
                ),
                pos,
                scanner.getCurrentPos()
            )
        }
        if (scanner.currentToken().kind === SyntaxKind.OpenParenToken) {
            const args = parseArgumentsList();
            return finishNode(
                createMethodCallExpression(
                    expression,
                    name,
                    args
                ),
                pos,
                scanner.getCurrentPos()
            )
        }
        return finishNode(
            createSlotLookupExpression(
                expression,
                name
            ),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parseGetShorthandOrGetShorthand (expression: AccessOrAssignmentExpressionOrHigher, pos: number) {
        const args = parseArgumentsList(SyntaxKind.OpenBracketToken, SyntaxKind.CloseBracketToken)
        if (parseOptionalToken(SyntaxKind.EqualsToken)) {
            const value = parseExpression();
            return finishNode(
                createSetShorthand(
                    expression,
                    args,
                    value
                ),
                pos,
                scanner.getCurrentPos()
            )
        }
        return finishNode(
            createGetShorthand(
                expression,
                args
            ),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parseArgumentsList(openToken: TokenSyntaxKind = SyntaxKind.OpenParenToken, closeToken: TokenSyntaxKind = SyntaxKind.CloseParenToken): NodeArray<Expression> {
        const pos = scanner.getTokenStart();
        parseExpectdToken(openToken);
        const args: Expression[] = [];
        while (!scanner.isEOF() && scanner.currentToken().kind !==closeToken) {
            const arg = parseExpression();
            args.push(arg);

            parseOptionalToken(SyntaxKind.CommaToken);
        }
        parseExpectdToken(closeToken);

        return finishNodeArray(
            createNodeArray(args),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parsePrimaryExpression(): PrimaryExpression {
        const token = scanner.currentToken();
        switch (token.kind) {
            case SyntaxKind.SubToken:
            case SyntaxKind.IntegerLiteralToken:
                return parseIntegerLiteralExpression()
            case SyntaxKind.Identifier:
                return parseVariableReferenceExpression();
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
            default:
                throw new Error(token.__debugKind);
        }
    }

    function parseParenExpression() {
        const pos = scanner.getTokenStart();
        parseExpectdToken(SyntaxKind.OpenParenToken);
        const expression = parseExpression();
        parseExpectdToken(SyntaxKind.CloseParenToken);

        return finishNode(
            createParenExpression(expression),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parseThisExpression() {
        const pos = scanner.getTokenStart();
        parseExpectdToken(SyntaxKind.ThisKeyword);
        return finishNode(
            createThisExpression(),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parseLocalSequenceOfStatements() {
        const colonToken = parseOptionalToken(SyntaxKind.ColonToken);
        if (colonToken && scanner.currentTokenhasLineFeed()) {
            return parseSequenceOfStatements(colonToken.leadingIndent, parseLocalStatement)
        }
        return parseLocalStatement();
    }

    function parseIfExpression() {
        const pos = scanner.getTokenStart();
        parseExpectdToken(SyntaxKind.IfKeyword);
        const condition = parseExpression();

        const thenStatement = parseLocalSequenceOfStatements();
       
        let elseStatement: SequenceOfStatements | Expression | undefined;
        const elseToken = parseOptionalToken(SyntaxKind.ElseKeyword);
        if (elseToken) {
            elseStatement = parseLocalSequenceOfStatements();
        }

        return finishNode(
            createIfExpression(
                condition,
                thenStatement,
                elseStatement
            ),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parseWhileExpression() {
        const pos = scanner.getTokenStart();
        parseExpectdToken(SyntaxKind.WhileKeyword);
        const condition = parseExpression();
        const body = parseLocalSequenceOfStatements();

        return finishNode(
            createWhileExpression(
                condition,
                body
            ),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parseIntegerLiteralExpression(): IntegerLiteralExpression {
        const pos = scanner.getTokenStart();
        const subToken = parseOptionalToken<SubToken>(SyntaxKind.SubToken);

        const token = parseExpectdToken<IntegerLiteralToken>(SyntaxKind.IntegerLiteralToken);
        return finishNode(
            createIntegerLiteralExpression(token, subToken),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parseVariableReferenceExpression(): VariableReferenceExpression {
        const pos = scanner.getTokenStart();
        const token = parseExpectdToken<IdentifierToken>(SyntaxKind.Identifier);
        return finishNode(
            createVariableReferenceExpression(token),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parsePrintingExpression(): PrintingExpression {
        const pos = scanner.getTokenStart();
        parseExpectdToken(SyntaxKind.PrintfKeyword);
        parseExpectdToken(SyntaxKind.OpenParenToken);
        const format = parseExpectdToken<StringLiteralToken>(SyntaxKind.StringLiteralToken);
        parseOptionalToken(SyntaxKind.CommaToken);
        const args = parseExpressionList(SyntaxKind.CloseParenToken);
        parseExpectdToken(SyntaxKind.CloseParenToken);
        return finishNode(
            createPrintingExpression(format, args),
            pos,
            scanner.getCurrentPos()
        )
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
                scanner.getCurrentPos()
            )
        }
        parseOptionalToken(SyntaxKind.CommaToken);
        const defaultValue = parseExpression();
        parseExpectdToken(SyntaxKind.CloseParenToken);
        
        return finishNode(
            createArraysExpression(length, defaultValue),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parseNullExpression(): NullExpression {
        const pos = scanner.getTokenStart();
        const token = parseExpectdToken<NullToken>(SyntaxKind.NullKeyword);
        return finishNode(
            createNullExpression(token),
            pos,
            scanner.getCurrentPos()
        )
    }

    function isStartOfObjectSlot(): boolean {
        const token = scanner.currentToken();
        return token.kind === SyntaxKind.VarKeyword || token.kind === SyntaxKind.MethodKeyword;
    }

    function parseObjectSlotList(indent: number): NodeArray<ObjectSlot> {
        const pos = scanner.getTokenStart();
        const slots: ObjectSlot[] = [];
        const slotIndent = scanner.currentToken().leadingIndent;
        while (slotIndent > indent && !scanner.isEOF() && isStartOfObjectSlot() && scanner.currentToken().leadingIndent === slotIndent) {
            const slot = parseObjectSlot();
            slots.push(slot);
        }

        return finishNodeArray(
            createNodeArray(slots),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parseObjectSlot(): ObjectSlot {
        const token = scanner.currentToken();
        switch(token.kind) {
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
        const name = parseExpectdToken<IdentifierToken>(SyntaxKind.Identifier);
        parseExpectdToken(SyntaxKind.EqualsToken);
        const initializer = parseExpression();

        return finishNode(
            createVariableSlot(name, initializer),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parseMethodSlot(): MethodSlot {
        const pos = scanner.getTokenStart();
        parseExpectdToken(SyntaxKind.MethodKeyword);
        const name = parseExpectdToken<IdentifierToken>(SyntaxKind.Identifier);
        const params = parseParameterList();
        const body = parseLocalSequenceOfStatements();

        return finishNode(
            createMethodSlot(name, params, body),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parseObjectsExpression(): ObjectsExpression {
        const pos = scanner.getTokenStart();
        const objectKeyword = parseExpectdToken(SyntaxKind.ObjectsKeyword);

        let extendsClause: Expression | undefined;
        if (parseOptionalToken(SyntaxKind.OpenParenToken)) {
            extendsClause = parseExpression();
            parseExpectdToken(SyntaxKind.CloseParenToken);
        }
        parseExpectdToken(SyntaxKind.ColonToken);

        const slots = parseObjectSlotList(objectKeyword.leadingIndent);

        return finishNode(
            createObjectsExpression(extendsClause, slots),
            pos,
            scanner.getCurrentPos()
        )
    }
}
