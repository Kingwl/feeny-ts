import { IntegerTypeNode, NullKeywordToken, VariableSlotSignatureDeclaration, SourceFile, ArraysExpression, ExpressionStatement, GetShorthand, ObjectsExpression, ParameterDeclaration, PrintingExpression, VariableAssignmentExpression, ASTNode, BinaryShorthand, FunctionExpression, FunctionStatement, IfExpression, MethodCallExpression, MethodSlot, ParenExpression, SequenceOfStatements, SetShorthand, SlotAssignmentExpression, SlotLookupExpression, SyntaxKind, VariableSlot, VariableStatement, WhileExpression, FunctionCallExpression, TypeDefDeclaration, MethodSlotSignatureDeclaration, ArraysTypeNode } from "./types";
import { assertKind, isBinaryShorthandTokenSyntaxKind, isDef, isKeywordSyntaxKind } from "./utils";

export function forEachChild<T>(node: ASTNode, cb: (node: ASTNode) => T | undefined): T | undefined {
    return visitNode(node);

    function visitNode(node: ASTNode | undefined): T | undefined {
        if (!isDef(node)) {
            return undefined
        }

        if (node.kind === SyntaxKind.EndOfFileToken) {
            return undefined;
        }

        if (node.kind === SyntaxKind.Identifier) {
            return undefined;
        }

        if (isKeywordSyntaxKind(node.kind) || isBinaryShorthandTokenSyntaxKind(node.kind)) {
            return undefined;
        }

        switch (node.kind) {
            case SyntaxKind.StringLiteralExpression:
            case SyntaxKind.IntegerLiteralExpression:
            case SyntaxKind.VariableReferenceExpression:
            case SyntaxKind.TypeReferenceTypeNode:
            case SyntaxKind.NullExpression:
            case SyntaxKind.BreakExpression:
            case SyntaxKind.ContinueExpression:
            case SyntaxKind.ThisExpression:
                return undefined;

            case SyntaxKind.SourceFile:
                assertKind<SourceFile>(node);
                return cb(node.body);
            case SyntaxKind.PrintingExpression:
                assertKind<PrintingExpression>(node);
                return visitNodes(node.args)
            case SyntaxKind.ArraysExpression:
                assertKind<ArraysExpression>(node);
                return cb(node.length) || node.defaultValue && cb(node.defaultValue)
            case SyntaxKind.ObjectsExpression:
                assertKind<ObjectsExpression>(node);
                return node.extendsClause && cb(node.extendsClause) || visitNodes(node.slots)
            case SyntaxKind.FunctionCallExpression:
                assertKind<FunctionCallExpression>(node);
                return cb(node.expression) || visitNodes(node.args)
            case SyntaxKind.MethodCallExpression:
                assertKind<MethodCallExpression>(node);
                return cb(node.expression) || cb(node.name) || visitNodes(node.args)
            case SyntaxKind.SlotLookupExpression:
                assertKind<SlotLookupExpression>(node);
                return cb(node.expression) || cb(node.name)
            case SyntaxKind.SlotAssignmentExpression:
                assertKind<SlotAssignmentExpression>(node);
                return cb(node.expression) || cb(node.name) || cb(node.value)
            case SyntaxKind.FunctionExpression:
                assertKind<FunctionExpression>(node);
                return cb(node.name) || visitNodes(node.params) || cb(node.body)
            case SyntaxKind.VariableAssignmentExpression:
                assertKind<VariableAssignmentExpression>(node);
                return cb(node.expression) || cb(node.value)
            case SyntaxKind.IfExpression:
                assertKind<IfExpression>(node);
                return cb(node.condition) || cb(node.thenStatement) || node.elseStatement && cb(node.elseStatement)
            case SyntaxKind.WhileExpression:
                assertKind<WhileExpression>(node);
                return cb(node.condition) || cb(node.body)
            case SyntaxKind.ParenExpression:
                assertKind<ParenExpression>(node);
                return cb(node.expression)
            case SyntaxKind.VariableSlot:
                assertKind<VariableSlot>(node);
                return cb(node.name) || node.type && cb(node.type) || cb(node.initializer)
            case SyntaxKind.MethodSlot:
                assertKind<MethodSlot>(node);
                return cb(node.name) || node.type && cb(node.type) || visitNodes(node.params) || cb(node.body)
            case SyntaxKind.ParameterDeclaration:
                assertKind<ParameterDeclaration>(node);
                return cb(node.name) || node.type && cb(node.type)
            case SyntaxKind.VariableStatement:
                assertKind<VariableStatement>(node);
                return cb(node.name) || node.type && cb(node.type) || cb(node.initializer)
            case SyntaxKind.ExpressionStatement:
                assertKind<ExpressionStatement>(node);
                return cb(node.expression)
            case SyntaxKind.FunctionStatement:
                assertKind<FunctionStatement>(node);
                return cb(node.name) || visitNodes(node.params) || node.type && cb(node.type) || cb(node.body)
            case SyntaxKind.SequenceOfStatements:
                assertKind<SequenceOfStatements>(node);
                return visitNodes(node.statements)
            case SyntaxKind.BinaryShorthand:
                assertKind<BinaryShorthand>(node);
                return cb(node.left) || cb(node.operator) || cb(node.right)
            case SyntaxKind.GetShorthand:
                assertKind<GetShorthand>(node);
                return cb(node.expression) || visitNodes(node.args)
            case SyntaxKind.SetShorthand:
                assertKind<SetShorthand>(node);
                return cb(node.expression) || visitNodes(node.args) || cb(node.value)
            case SyntaxKind.TypeDefDeclaration:
                assertKind<TypeDefDeclaration>(node);
                return cb(node.name) || visitNodes(node.slots)
            case SyntaxKind.MethodSlotSignatureDeclaration:
                assertKind<MethodSlotSignatureDeclaration>(node);
                return cb(node.name) || visitNodes(node.params) || node.type && cb(node.type) || cb(node.type)
            case SyntaxKind.VariableSlotSignatureDeclaration:
                assertKind<VariableSlotSignatureDeclaration>(node);
                return cb(node.name) || cb(node.type)
            case SyntaxKind.IntegerTypeNode:
            case SyntaxKind.NullTypeNode:
                assertKind<IntegerTypeNode | NullKeywordToken>(node);
                return undefined
            case SyntaxKind.ArraysTypeNode:
                assertKind<ArraysTypeNode>(node);
                return cb(node.type)
            default:
                throw new Error(`Unknown node kind: ${node.__debugKind}`)
        }
    }

    function visitNodes(nodes: ReadonlyArray<ASTNode> | undefined): T | undefined {
        if (!isDef(nodes)) {
            return undefined
        }

        for (const node of nodes) {
            const result = cb(node);
            if (isDef(result)) {
                return result
            }
        }
        return undefined
    }
}
