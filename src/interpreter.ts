import { Expression, LocalStatement, PrintingExpression, SyntaxKind } from "./types";
import { GlobalVariableStatement, IntegerLiteralExpression, SequenceOfStatements, SourceFile, Statement, TopLevelExpressionStatement, TopLevelStatement } from "./types";
import { isExpression, isStatement } from "./utils";

enum ValueType {
    Null,
    Array,
    Object,
    Function,
    Method,
    Integer,
}

abstract class BaseValue {
    abstract get type(): ValueType;

    isNull(): this is NullValue {
        return false
    }

    isArray(): this is ArrayValue {
        return false;
    }

    isObject(): this is ObjectValue {
        return false;
    }

    isFunction(): this is FunctionValue {
        return false;
    }

    isMethod(): this is MethodValue {
        return false;
    }

    isInteger(): this is IntegerValue {
        return false
    }
}

class NullValue extends BaseValue {
    get type () { return ValueType.Null }

    isNull (): true {
        return true
    }
}

class ArrayValue extends BaseValue {
    get type () { return ValueType.Array }

    isArray(): true {
        return true;
    }
}

class ObjectValue extends BaseValue {
    get type () { return ValueType.Object }

    isObject(): true {
        return true
    }
}

class FunctionValue extends BaseValue {
    get type () { return ValueType.Function }

    isFunction(): true {
        return true
    }
}

class MethodValue extends BaseValue {
    get type () { return ValueType.Method }

    isMethod(): true {
        return true
    }
}

class IntegerValue extends BaseValue {
    get type () { return ValueType.Integer }

    constructor (public value: number) {
        super();
    }

    isInteger(): true {
        return true;
    }
}

type VarValues = IntegerValue | ArrayValue | ObjectValue | NullValue
type CodeValues = FunctionValue | MethodValue
type AllValues = VarValues | CodeValues

function isVarValues (value: BaseValue): value is VarValues {
    return value.isInteger() || value.isNull() || value.isObject() || value.isArray();
}

function isCodeValues (value: BaseValue): value is CodeValues {
    return value.isFunction() || value.isMethod()
}

class Environment {
    private varValues = new Map<string, VarValues>()
    private codeValues = new Map<string, CodeValues>();

    hasBinding(name: string) {
        return this.varValues.has(name) || this.codeValues.has(name) 
    }

    addBinding(name: string, value: BaseValue) {
        if (isVarValues(value)) {
            this.varValues.set(name, value)
        } else if (isCodeValues(value)) {
            this.codeValues.set(name, value)
        } else {
            throw new Error("Invalid value type")
        }
    }

    getBinding(name: string) {
        return this.varValues.get(name) ?? this.codeValues.get(name)
    }
}

export function createInterpreter(file: SourceFile) {
    const globalEnv = new Environment()
    const envStack = [globalEnv];

    return {
        evaluate
    }

    function evaluate () {
        evaluateSourceFile(file);
    }

    function evaluateSourceFile(sourceFile: SourceFile) {
        evaluateStatement(sourceFile.body)
    }

    function evaluateStatement(stmt: Statement) {
        switch(stmt.kind) {
            case SyntaxKind.SequenceOfStatements:
                return evaluateSequenceOfStatements(stmt as SequenceOfStatements<LocalStatement | TopLevelStatement>)
            case SyntaxKind.GlobalVariableStatement:
                return evaluateGlobalVariableStatement(stmt as GlobalVariableStatement)
            case SyntaxKind.TopLevelExpressionStatement:
                return evaluateTopLevelExpressionStatement(stmt as TopLevelExpressionStatement)
            default:
                throw new Error("Invalid statement")
        }
    }

    function evaluateExpression(expr: Expression): BaseValue {
        switch(expr.kind) {
            case SyntaxKind.IntegerLiteralExpression:
                return evaluateIntegerLiteralExpression(expr as IntegerLiteralExpression);
            case SyntaxKind.PrintingExpression:
                return evaluatePrintingExpression(expr as PrintingExpression);
            default:
                throw new Error("Invalid expression")
        }
    }

    function evaluatePrintingExpression(expr: PrintingExpression): NullValue {
        console.log(expr.format.value, ...expr.args.map(evaluateExpression))
        return new NullValue()
    }

    function evaluateIntegerLiteralExpression(expr: IntegerLiteralExpression): IntegerValue {
        const isNegative = !!expr.subToken
        const value = Number(expr.value.value)
        return new IntegerValue(value * (isNegative ? -1 : 1))
    }

    function evaluateSequenceOfStatements(seqs: SequenceOfStatements<LocalStatement | TopLevelStatement>) {
        seqs.statements.forEach(evaluateStatement)
    }

    function evaluateGlobalVariableStatement(stmt: GlobalVariableStatement) {
        const value = evaluateExpression(stmt.initializer)
        globalEnv.addBinding(stmt.name.id, value)
    }

    function evaluateTopLevelExpressionStatement(stmt: TopLevelExpressionStatement) {
        evaluateExpression(stmt.expression)
    }
}
