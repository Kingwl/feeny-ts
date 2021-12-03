import { ArraysExpression, ObjectsExpression, SyntaxKind } from "./types";
import { createNodeArray, createSourceFile, createGlobalVariableStatement, createIntegerLiteralExpression, createTopLevelExpressionStatement, createVariableReferenceExpression } from './factory'
import { createScanner } from "./scanner"
import { finishNode, finishNodeArray } from './utils'
import { GlobalVariableStatement, NodeArray, TopLevelStatement } from "./types";
import { AllTokens, Expression, FunctionStatement, IdentifierToken, IntegerLiteralExpression, IntegerLiteralToken, SequenceOfStatements, Token, TopLevelExpressionStatement, VariableReferenceExpression } from "./types";
import { createArraysExpression, createFunctionStatement, createLocalExpressionStatement, createLocalVariableStatement, createNullExpression, createObjectsExpression, createPrintingExpression, createSequenceOfStatements, createVariableSlot, LocalExpressionStatement, LocalStatement, LocalVariableStatement, MethodSlot, NullExpression, NullToken, ObjectSlot, PrintingExpression, StringLiteralToken, VariableSlot } from ".";

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

            if (scanner.currentToken().kind === SyntaxKind.CommaToken) {
                scanner.nextToken();
            }
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

            if (scanner.currentToken().kind === SyntaxKind.CommaToken) {
                scanner.nextToken();
            }
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

            if (scanner.currentToken().kind === SyntaxKind.CommaToken) {
                scanner.nextToken();
            }
        }
        return finishNodeArray(
            createNodeArray(expressions),
            pos,
            scanner.getCurrentPos()
        )
    }

    function parseExpression(): Expression {
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
            default:
                throw new Error(token.__debugKind);

        }
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
        throw new Error()
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