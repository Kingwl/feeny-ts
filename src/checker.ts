import { BinaryShorthandToken, Declaration, FunctionBase, NodeArray, ParamsAndReturnType, Symbol, SymbolFlag, TextSpan } from ".";
import { VariableStatement, MethodSlotSignatureDeclaration, ObjectSlot, ObjectSlotSignature, TypeNode, VariableSlotSignatureDeclaration, ArraysExpression, ASTNode, BreakExpression, ContinueExpression, Expression, ExpressionStatement, FunctionStatement, ParenExpression, PrintingExpression, FunctionCallExpression, FunctionExpression, IfExpression, MethodCallExpression, ObjectsExpression, SequenceOfStatements, SlotAssignmentExpression, SlotLookupExpression, SourceFile, SyntaxKind, ThisExpression, VariableAssignmentExpression, WhileExpression, BinaryShorthand, GetShorthand, SetShorthand, MethodSlot, VariableSlot, TypeDefDeclaration, ArraysTypeNode, TypeReferenceTypeNode, ParameterDeclaration, VariableReferenceExpression, Type, TypeKind, Diangostic, IdentifierToken } from "./types";
import { assert, assertDef, assertKind, findAncestor, first, frontAndTail, isDeclaration, isDef, isExpression, shorthandTokenToOperator } from "./utils";
import { forEachChild } from './visitor'


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
    properties: Map<string, Symbol>
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

export function createChecker(file: SourceFile, createBuiltinSymbol: (flag: SymbolFlag) => Symbol) {
    let uid = 0;
    const unknownType = createUnknownType();
    const errorType = createNeverType();
    const neverType = createNeverType();
    const nullType = createNullType();
    const integerType = createIntegerType();
    const stringType = createStringType();
    const booleanType = createBooleanType();

    const typeCheckCache = new Map<ASTNode, Type | undefined>();
    const diagnostics: Diangostic[] = []
    const symbolResolveCache = new Map<ASTNode, Symbol | undefined>();
    const symbolTypeCache = new Map<Symbol, Type>();

    check(file);

    return {
        check,
        checkExpression,
        checkDeclaration,
        getSymbolAtNode,
        isNeverType,
        diagnostics
    }

    function addDiagnosticForNode(node: ASTNode, message: string) {
        diagnostics.push({
            message,
            span: {
                pos: node.pos,
                end: node.end
            }
        })
    }

    function isNeverType (type: Type) {
        return type === neverType
    }

    function getTypeFromSymbol (symbol: Symbol) {
        if (symbolTypeCache.has(symbol)) {
            return symbolTypeCache.get(symbol)!
        }

        let type: Type | undefined
        if (symbol.type) {
            type = symbol.type
        } else if (symbol.declaration) {
            type = checkDeclaration(symbol.declaration)
        } else {
            type = unknownType
        }
        symbolTypeCache.set(symbol, type)
        return type
    }

    function getSymbolAtNode (node: ASTNode): Symbol | undefined {
        switch (node.kind) {
            case SyntaxKind.VariableReferenceExpression:
            case SyntaxKind.TypeReferenceTypeNode:
                assertKind<VariableReferenceExpression | TypeReferenceTypeNode>(node)
                if (!symbolResolveCache.has(node)) {
                    check(node);
                }
                return symbolResolveCache.get(node);
            case SyntaxKind.Identifier: {
                assertKind<IdentifierToken>(node)
                if (node.parent) {
                    switch (node.parent.kind) {
                        case SyntaxKind.SlotAssignmentExpression:
                        case SyntaxKind.SlotLookupExpression: {
                            assertKind<SlotAssignmentExpression | SlotLookupExpression>(node.parent);
                            if (node.parent.name !== node) {
                                return undefined;
                            }

                            const type = checkExpression(node.parent.expression);
                            return getPropertyFromType(type, node.parent.name.text)
                        }
                    }
                }
            }
            case SyntaxKind.ThisKeyword:
                return node.parent ? getSymbolAtNode(node.parent) : undefined;
            
            case SyntaxKind.ThisExpression: {
                assertKind<ThisExpression>(node);
                const container = findThisContainer(node);
                return container?.symbol
            }
            default:
                return undefined;
        }
    }

    function check (node: ASTNode): Type {
        if (typeCheckCache.has(node)) {
            return typeCheckCache.get(node)!;
        }

        const type = checkWithoutCache(node);
        typeCheckCache.set(node, type);
        return type;
    }

    function checkWithoutCache (node: ASTNode): Type {
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
        return neverType;
    }

    function checkDeclaration (node: Declaration): Type {
        if (typeCheckCache.has(node)) {
            return typeCheckCache.get(node)!;
        }

        const type = checkDeclarationWithoutCache(node);
        typeCheckCache.set(node, type);
        return type;
    }

    function checkDeclarationWithoutCache (node: Declaration) {
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
        if (typeCheckCache.has(node)) {
            return typeCheckCache.get(node)!;
        }

        const type = checkExpressionWithoutCache(node);
        typeCheckCache.set(node, type);
        return type;
    }

    function checkExpressionWithoutCache (node: Expression): Type {
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

    function checkAssignment(value: Type, decl: Type, errorNode: ASTNode) {
        if (!isRelatedTo(value, decl)) {
            addDiagnosticForNode(errorNode, `Cannot assign`)
        }
    }

    function checkVariableReferenceExpression(node: VariableReferenceExpression): Type {
        let symbol: Symbol | undefined
        if (symbolResolveCache.has(node)) {
            symbol = symbolResolveCache.get(node);
        } else {
            symbol = resolveName(node.name.text, node, SymbolFlag.Value);
            symbolResolveCache.set(node, symbol);
        }

        if (!symbol?.declaration) {
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
        let symbol: Symbol | undefined
        if (symbolResolveCache.has(node)) {
            symbol = symbolResolveCache.get(node);
        } else {
            symbol = resolveName(node.name.text, node, SymbolFlag.TypeDef);
            symbolResolveCache.set(node, symbol)
        }
        
        if (!symbol?.declaration) {
            return unknownType
        }
        return checkDeclaration(symbol.declaration) 
    }

    function checkArraysTypeNode(node: ArraysTypeNode): Type {
        const type = checkTypeNode(node.type);
        return createArrayType(type)
    }

    function checkMethodSlot(node: MethodSlot) {
        const type = checkParamsAndReturnType(node, undefined)
        check(node.body);
        return type;
    }
    
    function checkVariableSlot(node: VariableSlot) {
        const decl = node.type ? checkTypeNode(node.type) : undefined
        const value = checkExpression(node.initializer)

        if (decl) {
            checkAssignment(value, decl, node.initializer);
            return decl
        }

        return value
    }

    function checkVariableSlotSignature(node: VariableSlotSignatureDeclaration): Type {
        return checkTypeNode(node.type)
    }

    function checkMethodSlotSignature(node: MethodSlotSignatureDeclaration): Type {
        return checkParamsAndReturnType(node, undefined);
    }

    function checkTypeDefDeclaration(node: TypeDefDeclaration) {
        const properties = new Map<string, Symbol>();
        node.slots.forEach(slot => {
            checkVariableSlotSignatureOrMethodSlotSignature(slot);
            assertDef(slot.symbol);
            properties.set(slot.name.text, slot.symbol);
        })
        const type = createObjectType(properties);
        if (node.symbol) {
            type.symbol = node.symbol;
        }
        return type;
    }

    function checkVariableAssignmentExpression(node: VariableAssignmentExpression) {
        const decl = checkExpression(node.expression);
        const value = checkExpression(node.value)
        checkAssignment(value, decl, node.value);
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

    function checkParamsAndReturnType(node: ParamsAndReturnType, body: FunctionBase["body"] | undefined) {
        const paramTypes: Type[] = [];
        node.params.forEach(param => {
            const paramType = checkParameterDeclaration(param)
            paramTypes.push(paramType)
        })

        let returnType: Type = unknownType;
        if (node.type) {
            returnType = checkTypeNode(node.type)
        } else if (body) {
            returnType = checkSequenceOfStatementsOrExpressionStatement(body)
        }
        return createFunctionType(undefined, paramTypes, returnType);
    }

    function checkParenExpression(node: ParenExpression) {
        return checkExpression(node)
    }

    function findThisContainer (node: ThisExpression) {
        const methodSlot = findAncestor(node, x => x.kind === SyntaxKind.MethodSlot);
        if (!methodSlot?.parent) {
            return undefined
        }
        assert(methodSlot.parent.kind === SyntaxKind.ObjectsExpression);
        assertKind<ObjectsExpression>(methodSlot.parent)
        return methodSlot.parent
    }

    function checkThisExpression(node: ThisExpression) {
        const container = findThisContainer(node);
        if (!container) {
            return unknownType
        }
        return check(container)
    }

    function checkFunctionCallLike (type: Type, args: Type[], callNode: ASTNode, argsNode: readonly Expression[]) {
        if (type.kind !== TypeKind.Function) {
            addDiagnosticForNode(callNode, `Is not callable`)
            return errorType
        }
        const functionType = type as FunctionType;
        
        if (args.length !== functionType.paramTypes.length) {
            addDiagnosticForNode(callNode, `Function arguments count not match`)
        }
        for (let i = 0; i < args.length; i++) {
            checkAssignment(args[i], functionType.paramTypes[i], argsNode[i]);
        }
        return functionType.returnType
    }

    function checkFunctionCallExpression(node: FunctionCallExpression) {
        const type = checkExpression(node.expression);
        const args = node.args.map(checkExpression);
        return checkFunctionCallLike(type, args, node.expression, node.args);
    }

    function checkSlotAssignmentExpression(node: SlotAssignmentExpression) {
        const decl = checkExpression(node.expression);
        const value = checkExpression(node.value);
        checkAssignment(value, decl, node.value);
        return value
    }

    function checkSlotLookupExpression(node: SlotLookupExpression) {
        const type = checkExpression(node.expression);
        const prop = getPropertyFromType(type, node.name.text)
        if (!prop) {
            addDiagnosticForNode(node.name, `Property ${node.name.text} not found`)
            return errorType
        }
        return getTypeFromSymbol(prop);
    }

    function checkMethodCallExpression(node: MethodCallExpression) {
        const type = checkExpression(node.expression);
        const args = node.args.map(checkExpression);
        const prop = getPropertyFromType(type, node.name.text);
        if (!prop) {
            addDiagnosticForNode(node.name, `Property ${node.name.text} not found`)
            return errorType
        }
        const propType = getTypeFromSymbol(prop);
        return checkFunctionCallLike(propType, args, node.expression, node.args);
    }

    function checkObjectsExpression(node: ObjectsExpression) {
        const properties = new Map<string, Symbol>();
        const type = createObjectType(properties);
        typeCheckCache.set(node, type);

        node.slots.forEach(slot => {
            checkVariableSlotOrMethodSlot(slot);
            assertDef(slot.symbol);
            properties.set(slot.name.text, slot.symbol);
        })
        return type;
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
        const type = checkParamsAndReturnType(node, node.body)
        check(node.body);
        return type;
    }

    function checkFunctionExpression(node: FunctionExpression) {
        const type = checkParamsAndReturnType(node, node.body)
        check(node.body);
        return type;
    }

    function checkVariableStatement(node: VariableStatement): Type {
        const decl = node.type ? checkTypeNode(node.type) : undefined
        const value = checkExpression(node.initializer);

        if (decl) {
            checkAssignment(value, decl, node.initializer)
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

    function checkSequenceOfStatements(node: SequenceOfStatements): Type {
        if (!node.isExpression) {
            forEachChild(node, check);
            return neverType;
        }

        const [ front, tail ] = frontAndTail(node.statements)
        front.forEach(check);

        if (tail.kind !== SyntaxKind.ExpressionStatement) {
            addDiagnosticForNode(tail, `Expected expression statement`)
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
        const prop = getPropertyFromType(left, operatorName);
        if (!prop) {
            addDiagnosticForNode(operator, `Property ${operatorName} not found`)
            return errorType
        }
        const methodType = getTypeFromSymbol(prop);
        return checkFunctionCallLike(methodType, [right], operator, [node.right]);
    }

    function getPropertyFromType (type: Type, propertyName: string): Symbol | undefined {
        if (type.kind !== TypeKind.Object) {
            return undefined
        }
        const objectType = type as ObjectType;
        return objectType.properties.get(propertyName)
    }
    
    function checkGetShorthand(node: GetShorthand): Type {
        const expression = checkExpression(node.expression);
        const args = node.args.map(checkExpression);

        const prop = getPropertyFromType(expression, 'get');
        if (!prop) {
            addDiagnosticForNode(node.expression, `Property get not found`)
            return errorType
        }

        const propType = getTypeFromSymbol(prop);
        return checkFunctionCallLike(propType, args, node.expression, node.args);
    }
    
    function checkSetShorthand(node: SetShorthand): Type {
        const expression = checkExpression(node.expression);
        const args = node.args.map(checkExpression);
        const value = checkExpression(node.value);

        const prop = getPropertyFromType(expression, 'set');
        if (!prop) {
            addDiagnosticForNode(node.expression, `Property set not found`)
            return errorType
        }

        const propType = getTypeFromSymbol(prop);
        return checkFunctionCallLike(propType, [...args, value], node.expression, [...node.args, node.value]);
    }

    function createUnknownType () {
        const type: UnknownType = {
            id: uid++,
            kind: TypeKind.Unknown
        }
        setupTypeDebugInfo(type);
        return type
    }
    
    function createNeverType () {
        const type: NeverType = {
            id: uid++,
            kind: TypeKind.Never
        }
        setupTypeDebugInfo(type);
        return type
    }
    
    function createNullType () {
        const type: NullType = {
            id: uid++,
            kind: TypeKind.Null
        }
        setupTypeDebugInfo(type);
        return type
    }
    
    function createIntegerType () {
        const type: IntegerType = {
            id: uid++,
            kind: TypeKind.Integer
        }
        setupTypeDebugInfo(type);
        return type
    }

    function createBooleanType() {
        const type: BooleanType = {
            id: uid++,
            kind: TypeKind.Boolean
        }
        setupTypeDebugInfo(type);
        return type
    }
    
    function createStringType () {
        const type: StringType = {
            id: uid++,
            kind: TypeKind.String
        }
        setupTypeDebugInfo(type);
        return type
    }
    
    function createObjectType (properties: Map<string, Symbol>) {
        const type: ObjectType = {
            id: uid++,
            kind: TypeKind.Object,
            properties
        }
        setupTypeDebugInfo(type);
        return type
    }
    
    function createFunctionType (thisType: Type | undefined, paramTypes: Type[], returnType: Type) {
        const type: FunctionType = {
            id: uid++,
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
            id: uid++,
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
        const properties = new Map<string, Symbol>();
        const arrayType = createObjectType(properties);

        const getMethodType = createGetMethod();
        const setMethodType = createSetMethod();
        const lengthMethodType = createLengthMethod();

        const getMethod = createBuiltinSymbol(SymbolFlag.MethodSlot)
        getMethod.type = getMethodType
        const setMethod = createBuiltinSymbol(SymbolFlag.MethodSlot)
        setMethod.type = setMethodType
        const lengthMethod = createBuiltinSymbol(SymbolFlag.MethodSlot)
        lengthMethod.type = lengthMethodType

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
