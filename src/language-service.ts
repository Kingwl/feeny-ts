import { Declaration,ObjectsExpression, FunctionStatement, MethodSlot, MethodSlotSignatureDeclaration, ParameterDeclaration, SyntaxKind, TypeDefDeclaration, VariableSlot, VariableSlotSignatureDeclaration, VariableStatement } from "./types";
import { createBinder } from "./binder";
import { createChecker } from "./checker";
import { createParser } from "./parser";
import { assertKind, findCurrentToken } from "./utils";

function getDeclarationAnchor (decl: Declaration) {
    switch (decl.kind) {
        case SyntaxKind.VariableStatement:
        case SyntaxKind.VariableSlot:
        case SyntaxKind.FunctionStatement:
        case SyntaxKind.MethodSlot:
        case SyntaxKind.ParameterDeclaration:
        case SyntaxKind.TypeDefDeclaration:
        case SyntaxKind.VariableSlotSignatureDeclaration:
        case SyntaxKind.MethodSlotSignatureDeclaration:
            assertKind<VariableStatement | VariableSlot | FunctionStatement | MethodSlot | ParameterDeclaration | TypeDefDeclaration | VariableSlotSignatureDeclaration | MethodSlotSignatureDeclaration>(decl)
            return decl.name
        case SyntaxKind.ObjectsExpression:
            assertKind<ObjectsExpression>(decl)
            return decl.objectToken
        default:
            return decl
    }
}

export function createLanguageService (text: string) {
    const parser = createParser(text);
    const file = parser.parse();
    const binder = createBinder(file);
    binder.bindFile();
    const checker = createChecker(file, binder.createBuiltinSymbol);

    return {
        getDiagnostics,
        goToDefinition,
        getCurrentToken
    }

    function getDiagnostics () {
        return checker.diagnostics
    }

    function getCurrentToken (pos: number) {
        const currentToken = findCurrentToken(file, pos);
        return currentToken;
    }

    function goToDefinition(pos: number) {
        const currentToken = findCurrentToken(file, pos);
        if (!currentToken) {
            return undefined;
        }
        const symbol = checker.getSymbolAtNode(currentToken);
        if (!symbol?.declaration) {
            return undefined
        }
        return getDeclarationAnchor(symbol.declaration);
    }
}