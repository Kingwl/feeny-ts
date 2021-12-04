import { ArraysExpression, ObjectsExpression, SyntaxKind } from "./types";
import { createNodeArray, createSourceFile, createGlobalVariableStatement, createIntegerLiteralExpression, createTopLevelExpressionStatement, createVariableReferenceExpression } from './factory'
import { createScanner } from "./scanner"
import { finishNode, finishNodeArray, isBinaryShorthandToken } from './utils'
import { GlobalVariableStatement, NodeArray, TopLevelStatement } from "./types";
import { AllTokens, Expression, FunctionStatement, IdentifierToken, IntegerLiteralExpression, IntegerLiteralToken, SequenceOfStatements, Token, TopLevelExpressionStatement, VariableReferenceExpression } from "./types";
import { BinaryShorthand, createArraysExpression, createBinaryShorthand, createFunctionCallExpression, createFunctionStatement, createGetShorthand, createIfExpression, createLocalExpressionStatement, createLocalVariableStatement, createMethodCallExpression, createMethodSlot, createNullExpression, createObjectsExpression, createPrintingExpression, createSequenceOfStatements, createSetShorthand, createVariableAssignmentExpression, createVariableSlot, createWhileExpression, LocalExpressionStatement, LocalStatement, LocalVariableStatement, MethodSlot, NullExpression, NullToken, ObjectSlot, PrimaryExpression, PrintingExpression, StringLiteralToken, VariableSlot } from ".";

export function createParser(text: string) {
    const scanner = createScanner(text);
    scanner.nextToken();

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

        const statements = parseTopLevelStatementList();
        
        return finishNode(
            createSourceFile(statements),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parseTopLevelStatementList (): NodeArray<TopLevelStatement> {
        const statements: TopLevelStatement[] = [];
        const pos = scanner.getTokenStart();

        while (!scanner.isEOF()) {
            const stmt = parseTopLevelStatement();
            statements.push(stmt);
        }
        
        return finishNodeArray(
            createNodeArray(statements),
            pos,
            scanner.getCurrentPos()
        )
    }
    
    function parseLocalStatementList (endToken: SyntaxKind): NodeArray<LocalStatement> {
        const statements: LocalStatement[] = [];
        const pos = scanner.getTokenStart();

        while (!scanner.isEOF() && scanner.currentToken().kind !== endToken) {
            const stmt = parseLocalStatement();
            statements.push(stmt);

            parseOptionalToken(SyntaxKind.CommaToken);
        }
        
        return finishNodeArray(
            createNodeArray(statements),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parseLocalStatement(): LocalStatement {
        const token = scanner.currentToken();
        switch (token.kind) {
            case SyntaxKind.VarKeyword:
                return parseLocalVariableStatement();
            case SyntaxKind.OpenParenToken:
                return parseSequenceOfStatements();
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
            case SyntaxKind.OpenParenToken:
                return parseSequenceOfStatements();
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
        parseExpectdToken(SyntaxKind.ColonToken);
        const body = parseLocalStatement();

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

    function parseSequenceOfStatements(): SequenceOfStatements {
        const pos = scanner.getTokenStart();
        parseExpectdToken(SyntaxKind.OpenParenToken);
        const statements = parseLocalStatementList(SyntaxKind.CloseParenToken);
        parseExpectdToken(SyntaxKind.CloseParenToken);

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
        if (isBinaryShorthandToken(scanner.currentToken())) {
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
        const expression = parseSlotOrShorthandOrAssignmentOrHigher();
        if (scanner.currentToken().kind === SyntaxKind.OpenParenToken) {
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

    function parseSlotOrShorthandOrAssignmentOrHigher () {
        const pos = scanner.getTokenStart();
        const primaryExpression = parsePrimaryExpression();;
        if (scanner.currentToken().kind === SyntaxKind.DotToken) {
            return parseSlotLookupOrAssignment(primaryExpression, pos)
        }
        if (scanner.currentToken().kind === SyntaxKind.OpenBracketToken) {
            return parseGetShorthandOrGetShorthand(primaryExpression, pos);
        }
        if (scanner.currentToken().kind === SyntaxKind.EqualsToken) {
            return VariableAssignmentExpression(primaryExpression, pos);
        }
        return primaryExpression;
    }


    function VariableAssignmentExpression(expression: PrimaryExpression, pos: number) {
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

    function parseSlotLookupOrAssignment(expression: PrimaryExpression, pos: number) {
        parseExpectdToken(SyntaxKind.DotToken);
        const name = parseExpectdToken<IdentifierToken>(SyntaxKind.Identifier);

        if (parseOptionalToken(SyntaxKind.EqualsToken)) {
            const value = parseExpression();
            return finishNode(
                createSlotAssignment(
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
            createSlotLookup(
                expression,
                name
            ),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parseGetShorthandOrGetShorthand (expression: PrimaryExpression, pos: number) {
        parseExpectdToken(SyntaxKind.OpenBracketToken);
        const argsExpression = parseExpression();
        parseExpectdToken(SyntaxKind.CloseBracketToken);

        if (parseOptionalToken(SyntaxKind.EqualsToken)) {
            const value = parseExpression();
            return finishNode(
                createSetShorthand(
                    expression,
                    argsExpression,
                    value
                ),
                pos,
                scanner.getCurrentPos()
            )
        }
        return finishNode(
            createGetShorthand(
                expression,
                argsExpression
            ),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parseArgumentsList(): NodeArray<Expression> {
        const pos = scanner.getTokenStart();
        parseOptionalToken(SyntaxKind.OpenParenToken);
        const args: Expression[] = [];
        while (!scanner.isEOF() && scanner.currentToken().kind !== SyntaxKind.CloseParenToken) {
            const arg = parseExpression();
            args.push(arg);

            parseOptionalToken(SyntaxKind.CommaToken);
        }
        parseExpectdToken(SyntaxKind.CloseParenToken);

        return finishNodeArray(
            createNodeArray(args),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parsePrimaryExpression(): PrimaryExpression {
        const token = scanner.currentToken();
        switch (token.kind) {
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
            default:
                throw new Error(token.__debugKind);
        }
    }

    function parseIfExpression() {
        const pos = scanner.getTokenStart();
        parseExpectdToken(SyntaxKind.IfKeyword);
        const condition = parseExpression();
        parseExpectdToken(SyntaxKind.ColonToken);
        const thenStatement = parseLocalStatement();
        let elseStatement: LocalStatement | undefined;
        if (parseOptionalToken(SyntaxKind.ElseKeyword)) {
            parseExpectdToken(SyntaxKind.ColonToken);
            elseStatement = parseLocalStatement();
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
        parseExpectdToken(SyntaxKind.ColonToken);
        const body = parseLocalStatement();

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
        const token = parseExpectdToken<IntegerLiteralToken>(SyntaxKind.IntegerLiteralToken);
        return finishNode(
            createIntegerLiteralExpression(token),
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

    function parseObjectSlotList(ident: number = 0): NodeArray<ObjectSlot> {
        const pos = scanner.getTokenStart();
        const slots: ObjectSlot[] = [];
        while (!scanner.isEOF() && scanner.currentToken().leadingIndent > ident && isStartOfObjectSlot()) {
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
        parseExpectdToken(SyntaxKind.ColonToken);
        const body = parseLocalStatement();

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

function createSlotAssignment(expression: PrimaryExpression, name: IdentifierToken, value: Expression): any {
    throw new Error("Function not implemented.");
}


function createSlotLookup(expression: PrimaryExpression, name: IdentifierToken): any {
    throw new Error("Function not implemented.");
}
