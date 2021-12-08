import { VariableStatement, ArraysExpression, ASTNode, BreakExpression, ContinueExpression, Expression, ExpressionStatement, FunctionStatement, ParenExpression, PrintingExpression, FunctionCallExpression, FunctionExpression, IfExpression, MethodCallExpression, ObjectsExpression, SequenceOfStatements, SlotAssignmentExpression, SlotLookupExpression, SourceFile, SyntaxKind, ThisExpression, VariableAssignmentExpression, WhileExpression, BinaryShorthand, GetShorthand, SetShorthand, MethodSlot, VariableSlot } from "./types";
import { assertKind, first, frontAndTail, isExpression } from "./utils";
import { forEachChild } from './visitor'

enum TypeKind {
    Unknown,
    Never,
    Null,
    Integer,
    String,
    Object,
    Function,
    Union
}

interface Type {
    kind: TypeKind

    _debugKind?: string
}

interface UnknownType extends Type {
    kind: TypeKind.Unknown
}

interface NeverType extends Type {
    kind: TypeKind.Never
}

interface NullType extends Type {
    kind: TypeKind.Null
}

interface IntegerType extends Type {
    kind: TypeKind.Integer
}

interface StringType extends Type {
    kind: TypeKind.String
}

interface ObjectType extends Type {
    kind: TypeKind.Object
    properties?: Map<string, Type>
}

interface FunctionType extends Type {
    kind: TypeKind.Function
    thisType?: Type
    parameters?: Type[]
    returnType?: Type
}

interface UnionType extends Type {
    kind: TypeKind.Union
    types?: Type[]
}

export function createChecker(file: SourceFile) {
    const unknownType = createUnknownType();
    const errorType = createNeverType();
    const neverType = createNeverType();
    const nullType = createNullType();
    const integerType = createIntegerType();
    const stringType = createStringType();

    const typeCheckCache = new Map<ASTNode, Type | undefined>();

    return {
        checkFile,
    }

    function checkFile () {
        check(file);

        return {
            check
        }
    }

    function check (node: ASTNode): Type | undefined {
        if (typeCheckCache.has(node)) {
            return typeCheckCache.get(node);
        }

        const type = checkWorker(node);
        typeCheckCache.set(node, type);
        return type;
    }

    function checkWorker (node: ASTNode) {
        if (isExpression(node)) {
            return checkExpression(node)
        }

        switch (node.kind) {
            case SyntaxKind.FunctionStatement:
                return checkFunctionStatement(node as FunctionStatement)
            case SyntaxKind.VariableStatement:
                return checkVariableStatement(node as VariableStatement)
            case SyntaxKind.SequenceOfStatements:
                return checkSequenceOfStatements(node as SequenceOfStatements);
            case SyntaxKind.MethodSlot:
                return checkMethodSlot(node as MethodSlot);
            case SyntaxKind.VariableSlot:
                return checkVariableSlot(node as VariableSlot);
            default:
                forEachChild(node, check);
                return undefined;
        }
    }

    function checkExpression (node: Expression): Type {
        switch (node.kind) {
            case SyntaxKind.IntegerLiteralExpression:
                return integerType
            case SyntaxKind.StringLiteralExpression:
                return stringType
            case SyntaxKind.NullKeyword:
                return nullType;
            case SyntaxKind.PrintingExpression:
                assertKind<PrintingExpression>(node)
                return checkPrintingExpression(node);
            case SyntaxKind.ArraysExpression:
                assertKind<ArraysExpression>(node)
                return checkArraysExpression(node);
            case SyntaxKind.ObjectsExpression:
                assertKind<ObjectsExpression>(node)
                return checkObjectsExpression(node);
            case SyntaxKind.MethodCallExpression:
                assertKind<MethodCallExpression>(node)
                return checkMethodCallExpression(node);
            case SyntaxKind.SlotLookupExpression:
                assertKind<SlotLookupExpression>(node)
                return checkSlotLookupExpression(node);
            case SyntaxKind.SlotAssignmentExpression:
                assertKind<SlotAssignmentExpression>(node)
                return checkSlotAssignmentExpression(node);
            case SyntaxKind.FunctionCallExpression:
                assertKind<FunctionCallExpression>(node)
                return checkFunctionCallExpression(node);
            case SyntaxKind.VariableAssignmentExpression:
                assertKind<VariableAssignmentExpression>(node)
                return checkVariableAssignmentExpression(node);
            case SyntaxKind.IfExpression:
                assertKind<IfExpression>(node)
                return checkIfExpression(node);
            case SyntaxKind.WhileExpression:
                assertKind<WhileExpression>(node)
                return checkWhileExpression(node);
            case SyntaxKind.ThisExpression:
                assertKind<ThisExpression>(node)
                return checkThisExpression(node);
            case SyntaxKind.ParenExpression:
                assertKind<ParenExpression>(node)
                return checkParenExpression(node);
            case SyntaxKind.FunctionExpression:
                assertKind<FunctionExpression>(node)
                return checkFunctionLike(node);
            case SyntaxKind.BreakExpression:
            case SyntaxKind.ContinueExpression:
                assertKind<BreakExpression | ContinueExpression>(node);
                return checkBreakOrContinueStatement(node);
            case SyntaxKind.BinaryShorthand:
                assertKind<BinaryShorthand>(node);
                return checkBinaryShorthand(node);
            case SyntaxKind.GetShorthand:
                assertKind<GetShorthand>(node);
                return checkGetShorthand(node);
            case SyntaxKind.SetShorthand:
                assertKind<SetShorthand>(node);
                return checkSetShorthand(node);
            default:
                forEachChild(node, check);
                return errorType;
        }
    }

    function isRelatedTo(source: Type, target: Type) {
        return true
    }

    function checkVariableAssignmentExpression(node: VariableAssignmentExpression) {
        const target = checkExpression(node.expression);
        const type = checkExpression(node.value)
        isRelatedTo(type, target);
        return type;
    }
    
    function checkIfExpression(node: IfExpression) {
        checkExpression(node.condition);
        
        const thenType = checkSequenceOfStatementsOrExpressionStatement(node.thenStatement);
        const elseType = node.elseStatement ? checkSequenceOfStatementsOrExpressionStatement(node.elseStatement) : nullType;

        const type = createUnionType([
            thenType,
            elseType
        ])
        return type
    }
    
    function checkWhileExpression(node: WhileExpression) {
        checkExpression(node.condition);
        check(node.body);
        return nullType
    }

    function checkBreakOrContinueStatement(node: BreakExpression | ContinueExpression) {
        return neverType
    }

    function checkFunctionLike(node: FunctionExpression | FunctionStatement) {
        return errorType
    }

    function checkParenExpression(node: ParenExpression) {
        return checkExpression(node)
    }

    function checkThisExpression(node: ThisExpression) {
        return errorType
    }

    function checkFunctionCallExpression(node: FunctionCallExpression) {
        return errorType
    }

    function checkSlotAssignmentExpression(node: SlotAssignmentExpression) {
        const targetType = checkExpression(node.expression);
        const valueType = checkExpression(node.value);
        isRelatedTo(valueType, targetType);
        return valueType
    }

    function checkSlotLookupExpression(node: SlotLookupExpression) {
        return errorType
    }

    function checkMethodCallExpression(node: MethodCallExpression) {
        return errorType
    }

    function checkObjectsExpression(node: ObjectsExpression) {
        return createObjectType();
    }

    function checkArraysExpression(node: ArraysExpression) {
        check(node.length);

        const itemType = node.defaultValue ? checkExpression(node.defaultValue) : neverType;
        return createArrayType(itemType);
    }

    function checkPrintingExpression (node: PrintingExpression) {
        forEachChild(node, check);
        return nullType
    }

    function checkFunctionStatement(node: FunctionStatement): Type {
        return errorType
    }

    function checkVariableStatement(node: VariableStatement): Type {
        return errorType
    }

    function checkExpressionStatement(node: ExpressionStatement) {
        return checkExpression(node.expression);
    }

    function checkSequenceOfStatementsOrExpressionStatement(node: SequenceOfStatements<true> | ExpressionStatement): Type
    function checkSequenceOfStatementsOrExpressionStatement(node: SequenceOfStatements<boolean> | ExpressionStatement): Type | undefined
    function checkSequenceOfStatementsOrExpressionStatement<T extends boolean>(node: SequenceOfStatements<T> | ExpressionStatement): Type | undefined {
        if (node.kind === SyntaxKind.SequenceOfStatements) {
            return checkSequenceOfStatements(node);
        } else {
            return checkExpressionStatement(node);
        }
    }

    function checkSequenceOfStatements(node: SequenceOfStatements<true>): Type
    function checkSequenceOfStatements(node: SequenceOfStatements): Type | undefined
    function checkSequenceOfStatements<T extends boolean>(node: SequenceOfStatements<T>): Type | undefined {
        if (!node.isExpression) {
            forEachChild(node, check);
            return undefined;
        }

        const [ front, tail ] = frontAndTail(node.statements)
        front.forEach(check);

        if (tail.kind !== SyntaxKind.ExpressionStatement) {
            return errorType
        }

        return checkExpressionStatement(tail as ExpressionStatement);
    }

    function checkBinaryShorthand(node: BinaryShorthand): Type {
        return errorType
    }
    
    function checkGetShorthand(node: GetShorthand): Type {
        return errorType
    }
    
    function checkSetShorthand(node: SetShorthand): Type {
        return errorType
    }
    
    function checkMethodSlot(arg0: MethodSlot) {
        return errorType
    }
    
    function checkVariableSlot(arg0: VariableSlot) {
        return errorType
    }

    function createUnknownType () {
        const type: UnknownType = {
            kind: TypeKind.Unknown
        }
        setupTypeDebugInfo(type);
        return type
    }
    
    function createNeverType () {
        const type: NeverType = {
            kind: TypeKind.Never
        }
        setupTypeDebugInfo(type);
        return type
    }
    
    function createNullType () {
        const type: NullType = {
            kind: TypeKind.Null
        }
        setupTypeDebugInfo(type);
        return type
    }
    
    function createIntegerType () {
        const type: IntegerType = {
            kind: TypeKind.Integer
        }
        setupTypeDebugInfo(type);
        return type
    }
    
    function createStringType () {
        const type: StringType = {
            kind: TypeKind.String
        }
        setupTypeDebugInfo(type);
        return type
    }
    
    function createObjectType () {
        const type: ObjectType = {
            kind: TypeKind.Object
        }
        setupTypeDebugInfo(type);
        return type
    }
    
    function createFunctionType () {
        const type: FunctionType = {
            kind: TypeKind.Function
        }
        setupTypeDebugInfo(type);
        return type
    }
    
    function createUnionType (types: Type[]): Type {
        if (!types.length) {
            return neverType
        }

        if (types.length === 1) {
            return first(types)
        }
    
        const type: UnionType = {
            kind: TypeKind.Union,
            types
        }
        setupTypeDebugInfo(type);
        return type
    }

    function setupTypeDebugInfo (type: Type) {
        Object.defineProperty(type, '_debugKind', {
            get () {
                return TypeKind[type.kind]
            }
        })
    }

    function createArrayType (itemType: Type) {
        const arrayType = createObjectType();
        const getMethod = createGetMethod();
        const setMethod = createSetMethod();
        const lengthMethod = createLengthMethod();

        const properties = new Map<string, Type>();
        properties.set("get", getMethod);
        properties.set("set", setMethod);
        properties.set("length", lengthMethod);
        arrayType.properties = properties;
        return arrayType

        function createGetMethod () {
            const type = createFunctionType();
            type.parameters = [integerType];
            type.thisType = arrayType;
            type.returnType = unknownType;
            return type
        }

        function createSetMethod () {
            const type = createFunctionType();
            type.parameters = [integerType, unknownType];
            type.thisType = arrayType;
            type.returnType = unknownType;
            return type
        }

        function createLengthMethod () {
            const type = createFunctionType();
            type.parameters = [];
            type.thisType = arrayType;
            type.returnType = integerType;
            return type
        }
    }
}
