import { ArraysExpression, ASTNode, BreakExpression, ContinueExpression, Expression, ExpressionStatement, FunctionStatement, ParenExpression, PrintingExpression, FunctionCallExpression, FunctionExpression, IfExpression, MethodCallExpression, ObjectsExpression, SequenceOfStatements, SlotAssignmentExpression, SlotLookupExpression, SourceFile, SyntaxKind, ThisExpression, VariableAssignmentExpression, WhileExpression } from "./types";
import { assertKind, isExpression } from "./utils";
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

interface UnknownType {
    kind: TypeKind.Unknown
}

interface NeverType {
    kind: TypeKind.Never
}

interface NullType {
    kind: TypeKind.Null
}

interface IntegerType {
    kind: TypeKind.Integer
}

interface StringType {
    kind: TypeKind.String
}

interface ObjectType {
    kind: TypeKind.Object
    properties?: Map<string, Type>
}

interface FunctionType {
    kind: TypeKind.Function
    thisType?: Type
    parameters?: Type[]
    returnType?: Type
}

interface UnionType {
    kind: TypeKind.Union
    types?: Type[]
}

function createUnknownType () {
    const type: UnknownType = {
        kind: TypeKind.Unknown
    }
    return type
}

function createNeverType () {
    const type: NeverType = {
        kind: TypeKind.Never
    }
    return type
}

function createNullType () {
    const type: NullType = {
        kind: TypeKind.Null
    }
    return type
}

function createIntegerType () {
    const type: IntegerType = {
        kind: TypeKind.Integer
    }
    return type
}

function createStringType () {
    const type: StringType = {
        kind: TypeKind.String
    }
    return type
}

function createObjectType () {
    const type: ObjectType = {
        kind: TypeKind.Object
    }
    return type
}

function createFunctionType () {
    const type: FunctionType = {
        kind: TypeKind.Function
    }
    return type
}

function createUnionType () {
    const type: UnionType = {
        kind: TypeKind.Union
    }
    return type
}

export function createChecker(file: SourceFile) {
    const unknownType = createUnknownType();
    const errorType = createNeverType();
    const neverType = createNeverType();
    const nullType = createNullType();
    const integerType = createIntegerType();
    const stringType = createStringType();

    function check (node: ASTNode): Type | undefined {
        if (isExpression(node)) {
            return checkExpression(node)
        }

        return forEachChild(node, check);
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
            default:
                forEachChild(node, check);
                return errorType;
        }
    }

    function checkVariableAssignmentExpression(node: VariableAssignmentExpression) {
        checkExpression(node.expression);
        const type = checkExpression(node.value)
        return type;
    }

    function checkSequenceOfStatementsOrExpression(node: SequenceOfStatements<true> | ExpressionStatement): Type
    function checkSequenceOfStatementsOrExpression(node: SequenceOfStatements<false> | ExpressionStatement): Type | undefined
    function checkSequenceOfStatementsOrExpression(node: SequenceOfStatements | ExpressionStatement): Type | undefined {
        return neverType
    }
    
    function checkIfExpression(node: IfExpression) {
        checkExpression(node.condition);
        
        const thenType = checkSequenceOfStatementsOrExpression(node.thenStatement);
        const elseType = node.elseStatement ? checkSequenceOfStatementsOrExpression(node.elseStatement) : nullType;

        const type = createUnionType()
        type.types = [
            thenType,
            elseType
        ];
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
        return errorType
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
