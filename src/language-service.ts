import { createBinder } from "./binder";
import { createChecker } from "./checker";
import { createParser } from "./parser";
import { findCurrentToken } from "./utils";

export function createLanguageService (text: string) {
    const parser = createParser(text);
    const file = parser.parse();
    const binder = createBinder(file);
    binder.bindFile();
    const checker = createChecker(file);
    const checkResult = checker.checkFile();
    const { check, diagnostics } = checkResult;

    return {
        getDiagnostics,
        goToDefinition,
        getCurrentToken
    }

    function getDiagnostics () {
        return diagnostics
    }

    function getCurrentToken (pos: number) {
        const currentToken = findCurrentToken(file, pos);
        return currentToken;
    }

    function goToDefinition(pos: number) {
        
    }
}