import { AllDeclaration, Declaration, FunctionBase, ParamsAndReturnType, Symbol, SymbolFlag } from ".";
import { VariableStatement, MethodSlotSignatureDeclaration, ObjectSlot, ObjectSlotSignature, TypeNode, VariableSlotSignatureDeclaration, ArraysExpression, ASTNode, BreakExpression, ContinueExpression, Expression, ExpressionStatement, FunctionStatement, ParenExpression, PrintingExpression, FunctionCallExpression, FunctionExpression, IfExpression, MethodCallExpression, ObjectsExpression, SequenceOfStatements, SlotAssignmentExpression, SlotLookupExpression, SourceFile, SyntaxKind, ThisExpression, VariableAssignmentExpression, WhileExpression, BinaryShorthand, GetShorthand, SetShorthand, MethodSlot, VariableSlot, TypeDefDeclaration, ArraysTypeNode, TypeReferenceTypeNode, ParameterDeclaration, VariableReferenceExpression } from "./types";
import { assertKind, first, frontAndTail, isDeclaration, isDef, isExpression } from "./utils";
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
    properties: Map<string, Type>
}

interface FunctionType extends Type {
    kind: TypeKind.Function
    thisType?: Type
    paramTypes: Type[]
    returnType: Type
}

interface UnionType extends Type {
    kind: TypeKind.Union
    types: Type[]
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

        if (isDeclaration(node)) {
            return checkDeclaration(node)
        }

        if (node.kind === SyntaxKind.SequenceOfStatements) {
            return checkSequenceOfStatements(node as SequenceOfStatements);
        }

        forEachChild(node, check);
        return undefined;
    }

    function checkDeclaration (node: Declaration): Type {
        switch (node.kind) {
            case SyntaxKind.FunctionStatement:
                return checkFunctionStatement(node as FunctionStatement)
            case SyntaxKind.VariableStatement:
                return checkVariableStatement(node as VariableStatement)
            case SyntaxKind.TypeDefDeclaration:
                return checkTypeDefDeclaration(node as TypeDefDeclaration);
            case SyntaxKind.MethodSlot:
                return checkMethodSlot(node as MethodSlot);
            case SyntaxKind.VariableSlot:
                return checkVariableSlot(node as VariableSlot);
            case SyntaxKind.MethodSlotSignatureDeclaration:
                return checkMethodSlotSignature(node as MethodSlotSignatureDeclaration);
            case SyntaxKind.VariableSlotSignatureDeclaration:
                return checkVariableSlotSignature(node as VariableSlotSignatureDeclaration);
            case SyntaxKind.ParameterDeclaration:
                return checkParameterDeclaration(node as ParameterDeclaration);
            case SyntaxKind.ObjectsExpression:
                return checkObjectsExpression(node as ObjectsExpression);
            default:
                throw new Error(`Unknown declaration kind ${node}`)
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
            case SyntaxKind.VariableReferenceExpression:
                assertKind<VariableReferenceExpression>(node);
                return checkVariableReferenceExpression(node);
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
                return checkFunctionExpression(node);
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

    function checkVariableReferenceExpression(node: VariableReferenceExpression): Type {
        const symbol = resolveName(node.name.text, node, SymbolFlag.Value);
        if (!symbol) {
            return unknownType
        }
        return checkDeclaration(symbol.declaration) 
    }

    function checkVariableSlotSignatureOrMethodSlotSignature(node: ObjectSlotSignature): Type {
        switch (node.kind) {
            case SyntaxKind.VariableSlotSignatureDeclaration:
                return checkVariableSlotSignature(node as VariableSlotSignatureDeclaration);
            case SyntaxKind.MethodSlotSignatureDeclaration:
                return checkMethodSlotSignature(node as MethodSlotSignatureDeclaration);
            default:
                throw new Error(`Unknown kind ${node.__debugKind}`)
        }
    }

    function checkVariableSlotOrMethodSlot(node: ObjectSlot) {
        switch (node.kind) {
            case SyntaxKind.VariableSlot:
                return checkVariableSlot(node as VariableSlot);
            case SyntaxKind.MethodSlot:
                return checkMethodSlot(node as MethodSlot);
            default:
                throw new Error(`Unknown kind ${node.__debugKind}`)
        }
    }

    function checkTypeNode(node: TypeNode): Type {
        switch (node.kind) {
            case SyntaxKind.NullTypeNode:
                return nullType;
            case SyntaxKind.IntegerTypeNode:
                return integerType;
            case SyntaxKind.ArraysTypeNode:
                return checkArraysTypeNode(node as ArraysTypeNode);
            case SyntaxKind.TypeReferenceTypeNode:
                return checkTypeReferenceTypeNode(node as TypeReferenceTypeNode);
            default:
                throw new Error(`Unknown kind ${node.__debugKind}`)
        }
    }

    function resolveName (name: string, location: ASTNode, flag: SymbolFlag): Symbol | undefined {
        let current: ASTNode | undefined = location
        while (current) {
            const matched = current.locals?.get(name);
            if (isDef(matched) && matched.flags & flag) {
                return matched;
            }

            current = current.parent
        }
        return undefined;
    }

    function checkTypeReferenceTypeNode(node: TypeReferenceTypeNode): Type {
        return errorType
    }

    function checkArraysTypeNode(node: ArraysTypeNode): Type {
        const type = checkTypeNode(node.type);
        return createArrayType(type)
    }

    function checkMethodSlot(node: MethodSlot) {
        const type = checkParamsAndReturnType(node)
        check(node.body);
        return type;
    }
    
    function checkVariableSlot(node: VariableSlot) {
        if (node.type) {
            return checkTypeNode(node.type)
        }

        return unknownType
    }

    function checkVariableSlotSignature(node: VariableSlotSignatureDeclaration): Type {
        return checkTypeNode(node.type)
    }

    function checkMethodSlotSignature(node: MethodSlotSignatureDeclaration): Type {
        return checkParamsAndReturnType(node);
    }

    function checkTypeDefDeclaration(node: TypeDefDeclaration) {
        const properties = new Map<string, Type>();
        node.slots.forEach(slot => {
            const slotType = checkVariableSlotSignatureOrMethodSlotSignature(slot);
            properties.set(slot.name.text, slotType);
        })
        return createObjectType(properties);
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

    function checkParameterDeclaration(node: ParameterDeclaration) {
        if (node.type) {
            checkTypeNode(node.type)
        }
        return unknownType
    }

    function checkParamsAndReturnType(node: ParamsAndReturnType) {
        const paramTypes: Type[] = [];
        node.params.forEach(param => {
            const paramType = checkParameterDeclaration(param)
            paramTypes.push(paramType)
        })
        const returnType = node.type ? checkTypeNode(node.type) : unknownType;
        return createFunctionType(undefined, paramTypes, returnType);
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
        const properties = new Map<string, Type>();
        node.slots.forEach(slot => {
            const slotType = checkVariableSlotOrMethodSlot(slot);
            properties.set(slot.name.text, slotType);
        })
        return createObjectType(properties);
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
        const type = checkParamsAndReturnType(node)
        check(node.body);
        return type;
    }

    function checkFunctionExpression(node: FunctionExpression) {
        const type = checkParamsAndReturnType(node)
        check(node.body);
        return type;
    }

    function checkVariableStatement(node: VariableStatement): Type {
        if (node.type) {
            return checkTypeNode(node.type)
        }
        return unknownType
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
    
    function createObjectType (properties: Map<string, Type>) {
        const type: ObjectType = {
            kind: TypeKind.Object,
            properties
        }
        setupTypeDebugInfo(type);
        return type
    }
    
    function createFunctionType (thisType: Type | undefined, paramTypes: Type[], returnType: Type) {
        const type: FunctionType = {
            kind: TypeKind.Function,
            thisType,
            paramTypes,
            returnType
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
        const properties = new Map<string, Type>();
        const arrayType = createObjectType(properties);

        const getMethod = createGetMethod();
        const setMethod = createSetMethod();
        const lengthMethod = createLengthMethod();

        properties.set("get", getMethod);
        properties.set("set", setMethod);
        properties.set("length", lengthMethod);
        return arrayType

        function createGetMethod () {
            return createFunctionType(
                arrayType,
                [integerType],
                itemType
            )
        }

        function createSetMethod () {
            return createFunctionType(
                arrayType,
                [integerType, itemType],
                nullType
            )
        }

        function createLengthMethod () {
            return createFunctionType(
                arrayType,
                [],
                integerType
            );
        }
    }
}
