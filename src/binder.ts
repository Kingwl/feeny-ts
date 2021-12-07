import { ASTNode, SourceFile } from "./types";

class Symbol {
    constructor(
        public name: string,
        public declaration: ASTNode
    ) {

    }
}

class SymbolTable {

}

export function createBinder(file: SourceFile) {

    function bind () {

    }
}
