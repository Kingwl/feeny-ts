import { ASTNode, SyntaxKind } from "./types";

export function setupDebugInfo (node: ASTNode) {
    node.__debugKind = SyntaxKind[node.kind];
}
