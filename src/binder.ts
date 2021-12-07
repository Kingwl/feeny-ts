import { ASTNode, FunctionExpression, FunctionStatement, MethodSlot, ObjectsExpression, SequenceOfStatements, Declaration, Parameter, SourceFile, SyntaxKind, VariableSlot, VariableStatement } from "./types";
import { assert, assertDef, isDef } from "./utils";
import { forEachChild } from "./visitor";

enum SymbolFlag {
    None = 0,
    Variable = 1 << 0,
    Parameter = 1 << 1,
    Function = 1 << 2,
    VariableSlot = 1 << 3,
    MethodSlot = 1 << 4,
    AnomymousObject = 1 << 5,

    VariableLike = Variable | Parameter | VariableSlot,
    FunctionLike = Function | MethodSlot,
}

function symbolFlagToDisplayText (flags: SymbolFlag) {
    const text = [];
    if (flags & SymbolFlag.Variable) {
        flags &= ~SymbolFlag.Variable;
        text.push(SymbolFlag[SymbolFlag.Variable]);
    }
    if (flags & SymbolFlag.Parameter) {
        flags &= ~SymbolFlag.Parameter;
        text.push(SymbolFlag[SymbolFlag.Parameter]);
    }
    if (flags & SymbolFlag.Function) {
        flags &= ~SymbolFlag.Function;
        text.push(SymbolFlag[SymbolFlag.Function]);
    }
    if (flags & SymbolFlag.VariableSlot) {
        flags &= ~SymbolFlag.VariableSlot;
        text.push(SymbolFlag[SymbolFlag.VariableSlot]);
    }
    if (flags & SymbolFlag.MethodSlot) {
        flags &= ~SymbolFlag.MethodSlot;
        text.push(SymbolFlag[SymbolFlag.MethodSlot]);
    }
    if (flags & SymbolFlag.AnomymousObject) {
        flags &= ~SymbolFlag.AnomymousObject;
        text.push(SymbolFlag[SymbolFlag.AnomymousObject]);
    }

    assert(flags === SymbolFlag.None, `Unknown symbol flag: ${flags}`);
    return text.join(' | ');
}

function getDeclarationSymbolFlags (node: ASTNode): SymbolFlag {
    switch (node.kind) {
        case SyntaxKind.VariableSlot:
            return SymbolFlag.VariableSlot;
        case SyntaxKind.VariableStatement:
            return SymbolFlag.Variable;
        case SyntaxKind.Parameter:
            return SymbolFlag.Parameter;
        case SyntaxKind.FunctionStatement:
            return SymbolFlag.Function;
        case SyntaxKind.MethodSlot:
            return SymbolFlag.MethodSlot;
        case SyntaxKind.ObjectsExpression:
            return SymbolFlag.AnomymousObject;
        default:
            return SymbolFlag.None;
    }
}

export interface Symbol {
    members?: SymbolTable;
    name?: string;
    flags: SymbolFlag;
    declaration: Declaration
    parent?: Symbol;
    _debugFlags?: string
}

interface SymbolTable extends Map<string, Symbol> {

}

type HasLocalVariables = 
    | SequenceOfStatements
    | SourceFile
    | MethodSlot
    | FunctionStatement
    | FunctionExpression

type HasMembers =
    | ObjectsExpression

function isLocalVariableContainer (node: ASTNode): node is HasLocalVariables {
    switch (node.kind) {
        case SyntaxKind.SequenceOfStatements:
        case SyntaxKind.SourceFile:
        case SyntaxKind.MethodSlot:
        case SyntaxKind.FunctionStatement:
        case SyntaxKind.FunctionExpression:
            return true;
        default:
            return false;
    }
}

function isMemberContainer (node: ASTNode): node is HasMembers {
    switch (node.kind) {
        case SyntaxKind.ObjectsExpression:
            return true
        default:
            return false;
    }
}

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
