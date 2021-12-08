import { ASTNode, Symbol, FunctionStatement, MethodSlot, ObjectsExpression, Declaration, ParameterDeclaration, SourceFile, SyntaxKind, VariableSlot, VariableStatement, HasLocalVariables, SymbolFlag } from "./types";
import { assertDef, getDeclarationSymbolFlags, isLocalVariableContainer, setupSymbolDebugInfo, symbolFlagToDisplayText } from "./utils";
import { forEachChild } from "./visitor";

export function createBinder(file: SourceFile) {
    let container: HasLocalVariables | undefined = undefined;
    let parent: Symbol | undefined = undefined;

    return {
        bindFile
    }

    function bindFile () {
        bind(file)
    }

    function currentLocalsTable() {
        assertDef(container);

        if (!container.locals) {
            container.locals = createSymbolTable();
        }
        return container.locals;
    }

    function bind (node: ASTNode) {
        const savedContainer = container;
        if (isLocalVariableContainer(node)) {
            container = node;
        }

        bindWorker(node);
        container = savedContainer;
    }

    function bindWorker (node: ASTNode) {
        switch (node.kind) {
            case SyntaxKind.VariableStatement:
                bindVariableStatement(node as VariableStatement);
                break
            case SyntaxKind.FunctionStatement:
                bindFunctionStatement(node as FunctionStatement);
                break;
            case SyntaxKind.VariableSlot:
                bindVariableSlot(node as VariableSlot);
                break;
            case SyntaxKind.MethodSlot:
                bindMethodSlot(node as MethodSlot);
                break;
            case SyntaxKind.ParameterDeclaration:
                bindParameterDeclaration(node as ParameterDeclaration);
                break;
            case SyntaxKind.ObjectsExpression:
                bindObjectsExpression(node as ObjectsExpression);
            default:
                return forEachChild(node, bind);
        }
    }

    function bindVariableStatement (node: VariableStatement) {
        addLocalVariableToContainer(node.name.text, node);
        forEachChild(node, bind);
    }

    function bindFunctionStatement (node: FunctionStatement) {
        addLocalVariableToContainer(node.name.text, node);
        forEachChild(node, bind);
    }

    function bindParameterDeclaration (node: ParameterDeclaration) {
        addLocalVariableToContainer(node.name.text, node);
        forEachChild(node, bind);
    }

    function bindVariableSlot (node: VariableSlot) {
        addMemberToParent(node.name.text, node);
        forEachChild(node, bind);
    }

    function bindMethodSlot (node: MethodSlot) {
        addMemberToParent(node.name.text, node);
        forEachChild(node, bind);
    }

    function bindObjectsExpression (node: ObjectsExpression) {
        const flags = getDeclarationSymbolFlags(node);
        const symbol = createAnonymousSymbol(flags, node);
        const savedParent = parent;
        parent = symbol;

        forEachChild(node, bind);

        parent = savedParent;
    }

    function addLocalVariableToContainer (name: string, declaration: Declaration) {
        const flags = getDeclarationSymbolFlags(declaration);
        const symbol = createSymbol(name, flags, declaration);
        currentLocalsTable().set(name, symbol);
        return symbol;
    }

    function addMemberToParent (name: string, member: Declaration) {
        const flags = getDeclarationSymbolFlags(member);
        const symbol = createSymbol(name, flags, member);

        if (parent) {
            if (!parent.members) {
                parent.members = createSymbolTable();
            }

            parent.members.set(name, symbol);
        }

        return symbol;
    }

    function createSymbol(name: string, flags: SymbolFlag, declaration: Declaration) {
        const symbol: Symbol = {
            name,
            flags,
            declaration,
            parent
        };
        declaration.symbol = symbol;
        setupSymbolDebugInfo(symbol);
        return symbol;
    }

    function createAnonymousSymbol(flags: SymbolFlag, declaration: Declaration) {
        const symbol: Symbol = {
            name: undefined,
            flags,
            declaration,
            parent
        }
        declaration.symbol = symbol;
        setupSymbolDebugInfo(symbol);
        return symbol;
    }

    function createSymbolTable () {
        return new Map<string, Symbol>()
    }
}
