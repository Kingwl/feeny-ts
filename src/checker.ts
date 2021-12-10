import { AllDeclaration, BinaryShorthandToken, Declaration, FunctionBase, NodeArray, ParamsAndReturnType, Symbol, SymbolFlag } from ".";
import { VariableStatement, MethodSlotSignatureDeclaration, ObjectSlot, ObjectSlotSignature, TypeNode, VariableSlotSignatureDeclaration, ArraysExpression, ASTNode, BreakExpression, ContinueExpression, Expression, ExpressionStatement, FunctionStatement, ParenExpression, PrintingExpression, FunctionCallExpression, FunctionExpression, IfExpression, MethodCallExpression, ObjectsExpression, SequenceOfStatements, SlotAssignmentExpression, SlotLookupExpression, SourceFile, SyntaxKind, ThisExpression, VariableAssignmentExpression, WhileExpression, BinaryShorthand, GetShorthand, SetShorthand, MethodSlot, VariableSlot, TypeDefDeclaration, ArraysTypeNode, TypeReferenceTypeNode, ParameterDeclaration, VariableReferenceExpression } from "./types";
import { assertKind, first, frontAndTail, isDeclaration, isDef, isExpression, shorthandTokenToOperator } from "./utils";
import { forEachChild } from './visitor'

enum TypeKind {
    Unknown,
    Never,
    Null,
    Integer,
    Boolean,
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

interface BooleanType extends Type {
    kind: TypeKind.Boolean
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
    const booleanType = createBooleanType();

    const typeCheckCache = new Map<ASTNode, Type | undefined>();
    const diagnostics: string[] = []

    return {
        checkFile,
    }

    function checkFile () {
        check(file);

        return {
            check,
            diagnostics
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
                return neverType;
        }
    }

    function isRelatedTo(from: Type, to: Type) {
        if (from === to) {
            return true
        }
        return false
    }

    function checkAssignment(value: Type, decl: Type) {
        if (!isRelatedTo(value, decl)) {
            diagnostics.push(`Cannot assign`)
        }
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
        const symbol = resolveName(node.name.text, node, SymbolFlag.Value);
        if (!symbol) {
            return unknownType
        }
        return checkDeclaration(symbol.declaration) 
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
        const decl = node.type ? checkTypeNode(node.type) : undefined
        const value = checkExpression(node.initializer)

        if (decl) {
            checkAssignment(value, decl);
            return decl
        }

        return value
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
        const decl = checkExpression(node.expression);
        const value = checkExpression(node.value)
        checkAssignment(value, decl);
        return value;
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
            return checkTypeNode(node.type)
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
        return unknownType
    }

    function checkFunctionCallLike (type: Type, args: Type[]) {
        if (type.kind !== TypeKind.Function) {
            diagnostics.push(`Is not callable`)
            return errorType
        }
        const functionType = type as FunctionType;
        
        if (args.length !== functionType.paramTypes.length) {
            diagnostics.push(`Function arguments count not match`)
        }
        for (let i = 0; i < args.length; i++) {
            checkAssignment(args[i], functionType.paramTypes[i]);
        }
        return functionType.returnType
    }

    function checkFunctionCallExpression(node: FunctionCallExpression) {
        const type = checkExpression(node.expression);
        const args = node.args.map(checkExpression);
        return checkFunctionCallLike(type, args);
    }

    function checkSlotAssignmentExpression(node: SlotAssignmentExpression) {
        const decl = checkExpression(node.expression);
        const value = checkExpression(node.value);
        checkAssignment(value, decl);
        return value
    }

    function checkSlotLookupExpression(node: SlotLookupExpression) {
        const type = checkExpression(node.expression);
        const propType = getPropertyFromType(type, node.name.text)
        if (!propType) {
            diagnostics.push("Cannot find property")
            return errorType
        }
        return propType;
    }

    function checkMethodCallExpression(node: MethodCallExpression) {
        const type = checkExpression(node.expression);
        const args = node.args.map(checkExpression);
        const propType = getPropertyFromType(type, node.name.text);
        if (!propType) {
            diagnostics.push("Cannot find property")
            return errorType
        }
        return checkFunctionCallLike(propType, args);
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
        const itemType = node.defaultValue ? checkExpression(node.defaultValue) : unknownType;
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
        const decl = node.type ? checkTypeNode(node.type) : undefined
        const value = checkExpression(node.initializer);

        if (decl) {
            checkAssignment(value, decl)
            return decl
        }

        return value
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
            diagnostics.push('Must be expression')
            return errorType
        }

        return checkExpressionStatement(tail as ExpressionStatement);
    }

    function checkBuiltinIntagerShorthand (operator: BinaryShorthandToken): Type {
        switch(operator.kind) {
            case SyntaxKind.AddToken:
            case SyntaxKind.SubToken:
            case SyntaxKind.MulToken:
            case SyntaxKind.DivToken:
            case SyntaxKind.ModToken:
                return integerType;
            case SyntaxKind.GreaterThanToken:
            case SyntaxKind.GreaterEqualsThanToken:
            case SyntaxKind.LessThanToken:
            case SyntaxKind.LessEqualsThanToken:
            case SyntaxKind.EqualsEqualsToken:
                return booleanType;
            default:
                throw new Error(`Unexpected operator ${operator.kind}`)
        }
    }

    function checkBinaryShorthand(node: BinaryShorthand): Type {
        const left = checkExpression(node.left);
        const operator = node.operator;
        const right = checkExpression(node.right);

        if (left.kind === TypeKind.Integer && right.kind === TypeKind.Integer) {
            return checkBuiltinIntagerShorthand(operator)
        }
        const operatorName = shorthandTokenToOperator(operator.kind);
        const methodType = getPropertyFromType(left, operatorName);
        if (!methodType) {
            diagnostics.push("Cannot find shorthand method")
            return errorType
        }
        return checkFunctionCallLike(methodType, [right]);
    }

    function getPropertyFromType (type: Type, propertyName: string): Type | undefined {
        if (type.kind !== TypeKind.Object) {
            return undefined
        }
        const objectType = type as ObjectType;
        return objectType.properties.get(propertyName)
    }
    
    function checkGetShorthand(node: GetShorthand): Type {
        const expression = checkExpression(node.expression);
        const args = node.args.map(checkExpression);

        const getMethodType = getPropertyFromType(expression, 'get');
        if (!getMethodType) {
            diagnostics.push("Cannot find get shorthand method")
            return errorType
        }

        return checkFunctionCallLike(getMethodType, args);
    }
    
    function checkSetShorthand(node: SetShorthand): Type {
        const expression = checkExpression(node.expression);
        const args = node.args.map(checkExpression);
        const value = checkExpression(node.value);

        const setMethodType = getPropertyFromType(expression, 'set');
        if (!setMethodType) {
            diagnostics.push("Cannot find set shorthand method")
            return errorType
        }

        return checkFunctionCallLike(setMethodType, [...args, value]);
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

    function createBooleanType() {
        const type: BooleanType = {
            kind: TypeKind.Boolean
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
