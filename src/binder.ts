import { ASTNode, Symbol, FunctionStatement, MethodSlot, ObjectsExpression, Declaration, Parameter, SourceFile, SyntaxKind, VariableSlot, VariableStatement, HasLocalVariables, SymbolFlag, SymbolTable } from "./types";
import { assertDef, getDeclarationSymbolFlags, isDef, isLocalVariableContainer, symbolFlagToDisplayText } from "./utils";
import { forEachChild } from "./visitor";

export function createBinder(file: SourceFile) {
    let container: HasLocalVariables | undefined = undefined;
    let parent: Symbol | undefined = undefined;

    const nodeToLocalsTableMap = new Map<HasLocalVariables, SymbolTable>();
    const declarationToSymbol = new Map<Declaration, Symbol>();

    return {
        bindFile
    }

    function bindFile () {
        bind(file)

        return {
            getSymbolFromDeclaration,
            getLocalsFromNode
        }
    }

    function getSymbolFromDeclaration (declaration: Declaration) {
        return declarationToSymbol.get(declaration);
    }

    function getLocalsFromNode (node: ASTNode): SymbolTable | undefined {
        if (!isLocalVariableContainer(node)) {
            return undefined;
        }

        return nodeToLocalsTableMap.get(node);
    }

    function currentLocalsTable() {
        assertDef(container);

        const existed = nodeToLocalsTableMap.get(container);
        if (isDef(existed)) {
            return existed;
        }

        const symbolTable = createSymbolTable();
        nodeToLocalsTableMap.set(container, symbolTable);
        return symbolTable;
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
            case SyntaxKind.Parameter:
                bindParameter(node as Parameter);
                break;
            case SyntaxKind.ObjectsExpression:
                bindObjectsExpression(node as ObjectsExpression);
            default:
                return forEachChild(node, bind);
        }
    }

    function bindVariableStatement (node: VariableStatement) {
        addLocalVariableToContainer(node.name.id, node);
        forEachChild(node, bind);
    }

    function bindFunctionStatement (node: FunctionStatement) {
        addLocalVariableToContainer(node.name.id, node);
        forEachChild(node, bind);
    }

    function bindParameter (node: Parameter) {
        addLocalVariableToContainer(node.name.id, node);
        forEachChild(node, bind);
    }

    function bindVariableSlot (node: VariableSlot) {
        addMemberToParent(node.name.id, node);
        forEachChild(node, bind);
    }

    function bindMethodSlot (node: MethodSlot) {
        addMemberToParent(node.name.id, node);
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
        setupSymbolDebugInfo(symbol);

        declarationToSymbol.set(declaration, symbol);
        return symbol;
    }

    function createAnonymousSymbol(flags: SymbolFlag, declaration: Declaration) {
        const symbol: Symbol = {
            name: undefined,
            flags,
            declaration,
            parent
        }
        setupSymbolDebugInfo(symbol);

        declarationToSymbol.set(declaration, symbol);
        return symbol;
    }

    function createSymbolTable () {
        return new Map<string, Symbol>()
    }

    function setupSymbolDebugInfo (symbol: Symbol) {
        Object.defineProperty(symbol, '_debugFlags', {
            enumerable: false,
            get () {
                return symbolFlagToDisplayText(symbol.flags);
            }
        });
    }
}
