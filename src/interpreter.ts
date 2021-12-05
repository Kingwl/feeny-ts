import { LocalVariableStatement, NullExpression, ParenExpression, SlotAssignmentExpression, SlotLookupExpression, VariableAssignmentExpression, VariableReferenceExpression, WhileExpression } from ".";
import { ArraysExpression, Expression, IfExpression, LocalExpressionStatement, LocalStatement, PrintingExpression, SyntaxKind } from "./types";
import { GlobalVariableStatement, IntegerLiteralExpression, SequenceOfStatements, SourceFile, Statement, TopLevelExpressionStatement, TopLevelStatement } from "./types";
import { assertDef, isDef, last } from "./utils";

enum ValueType {
    Null,
    Array,
    Object,
    Function,
    Integer,
}

abstract class BaseValue {
    abstract get type(): ValueType;

    abstract print (): string;

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

    isEnvValue(): this is EnvValue {
        return false;
    }
}

class Environment {
    private varValues = new Map<string, VarValues>()
    private codeValues = new Map<string, CodeValues>();

    constructor(private parent?: Environment) {

    }

    hasBinding(name: string): boolean {
        return this.varValues.has(name) || this.codeValues.has(name) || !!this.parent?.hasBinding(name)
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

    getBinding(name: string): BaseValue | undefined {
        return this.varValues.get(name) ?? this.codeValues.get(name) ?? this.parent?.getBinding(name);
    }
}

class NullValue extends BaseValue {
    get type () { return ValueType.Null }

    print(): string {
        return 'null'
    }

    isNull (): true {
        return true
    }
}

abstract class EnvValue extends BaseValue {
    abstract get env(): Environment;

    isEnvValue (): true {
        return true
    }
}

class ArrayValue extends EnvValue {
    get type () { return ValueType.Array }

    static Env = new Environment()
    private _instanceEnv = new Environment(ArrayValue.Env);

    get env () {
        return this._instanceEnv
    }

    private list: BaseValue[];
    constructor(private length: IntegerValue, defaultValue?: BaseValue) {
        super()

        this.list = new Array(length.value);

        if (defaultValue) {
            this.list.fill(defaultValue)
        }
    }

    print(): string {
        return `[${this.list.map(v => v.print()).join(', ')}]`
    }

    isArray(): true {
        return true;
    }
}

class ObjectValue extends EnvValue {
    get type () { return ValueType.Object }

    static Env = new Environment()
    private _instanceEnv = new Environment(ObjectValue.Env);

    get env () {
        return this._instanceEnv
    }

    print(): string {
        return `{[Object object]}`
    }

    isObject(): true {
        return true
    }
}

class IntegerValue extends EnvValue {
    get type () { return ValueType.Integer }

    static Env = new Environment()
    private _instanceEnv = new Environment(IntegerValue.Env);

    get env () {
        return this._instanceEnv
    }

    constructor (public value: number) {
        super();
    }

    print(): string {
        return `${this.value}`
    }

    isInteger(): true {
        return true;
    }
}

class FunctionValue extends BaseValue {
    get type () { return ValueType.Function }

    print(): string {
        return `{[Function function]}`
    }

    isFunction(): true {
        return true
    }
}

class MethodValue extends FunctionValue {
    print(): string {
        return `{[Function method]}`
    }

    isMethod(): true {
        return true
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

export function createInterpreter(file: SourceFile) {
    const globalEnv = new Environment()
    const envStack = [globalEnv];

    return {
        evaluate
    }

    function currentEnv () {
        return last(envStack)
    }

    function pushEnv (env: Environment) {
        envStack.push(env)
    }

    function popEnv() {
        return envStack.pop()
    }

    function runInEnv<R = void>(cb: () => R) {
        const parent = currentEnv();
        const env = new Environment(parent);
        pushEnv(env);
        const result = cb();
        popEnv()
        return result
    }

    function evaluate () {
        evaluateSourceFile(file);
    }

    function evaluateSourceFile(sourceFile: SourceFile) {
        evaluateTopLevelSequenceOfStatements(sourceFile.body)
    }

    function evaluateLocalSequenceOfStatements(seqs: SequenceOfStatements<LocalStatement>) {
        const front = seqs.statements.slice(0, seqs.statements.length - 1)
        const last = seqs.statements[seqs.statements.length - 1]

        front.forEach(evaluateStatement);

        if (last.kind !== SyntaxKind.LocalExpressionStatement) {
            throw new Error("Invalid statement")
        }
        return evaluateLocalExpressionStatement(last);
    }

    function evaluateTopLevelSequenceOfStatements(seqs: SequenceOfStatements<TopLevelStatement>) {
        seqs.statements.forEach(evaluateStatement)
    }

    function evaluateStatement(stmt: Statement) {
        switch(stmt.kind) {
            case SyntaxKind.SequenceOfStatements:
                return evaluateLocalSequenceOfStatements(stmt as SequenceOfStatements<LocalStatement>)
            case SyntaxKind.GlobalVariableStatement:
                return evaluateGlobalVariableStatement(stmt as GlobalVariableStatement)
            case SyntaxKind.TopLevelExpressionStatement:
                return evaluateTopLevelExpressionStatement(stmt as TopLevelExpressionStatement)
            case SyntaxKind.LocalExpressionStatement:
                return evaluateLocalExpressionStatement(stmt as LocalExpressionStatement)
            case SyntaxKind.LocalVariableStatement:
                return evaluateLocalVariableStatement(stmt as LocalVariableStatement)
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
            case SyntaxKind.NullExpression:
                return evaluateNullExpression(expr as NullExpression);
            case SyntaxKind.ArraysExpression:
                return evaluateArraysExpression(expr as ArraysExpression);
            case SyntaxKind.IfExpression:
                return evaluateIfExpression(expr as IfExpression);
            case SyntaxKind.ParenExpression:
                return evaluateParenExpression(expr as ParenExpression);
            case SyntaxKind.WhileExpression:
                return evaluateWhileExpression(expr as WhileExpression);
            case SyntaxKind.VariableReferenceExpression:
                return evaluateVariableReferenceExpression(expr as VariableReferenceExpression);
            case SyntaxKind.VariableAssignmentExpression:
                return evaluateVariableAssignmentExpression(expr as VariableAssignmentExpression);
            case SyntaxKind.SlotLookupExpression:
                return evaluateSlotLookupExpression(expr as SlotLookupExpression);
            case SyntaxKind.SlotAssignmentExpression:
                return evaluatSlotAssignmentExpression(expr as SlotAssignmentExpression);
            default:
                throw new Error("Invalid expression: " + expr.__debugKind)
        }
    }

    function evaluateVariableAssignmentExpression(expr: VariableAssignmentExpression) {
        const env = currentEnv();
        const value = evaluateExpression(expr.value);

        env.addBinding(expr.id.id, value);
        return value
    }

    function evaluatSlotAssignmentExpression(expr: SlotAssignmentExpression) {
        const left = evaluateExpression(expr.expression);
        if (!left.isEnvValue()) {
            throw new Error("Invalid left value type: " + left.type)
        }

        const right = evaluateExpression(expr.value);
        left.env.addBinding(expr.name.id, right)
        return right;
    }

    function evaluateSlotLookupExpression(expr: SlotLookupExpression) {
        const left = evaluateExpression(expr.expression);
        if (!left.isEnvValue()) {
            throw new Error("Invalid left value type: " + left.type)
        }
        
        const result = left.env.getBinding(expr.name.id)
        assertDef(result);
        return result
    }

    function evaluateVariableReferenceExpression(expr: VariableReferenceExpression) {
        const env = currentEnv();
        const value = env.getBinding(expr.id.id)

        assertDef(value, "Cannot find reference: " + expr.id.id)
        return value
    }

    function evaluateWhileExpression(expr: WhileExpression) {
        while(!evaluateExpression(expr.condition).isNull()) {
            runInEnv(() => {
                return evaluateLocalStatementOrLocalSequenceOfStatements(expr.body);
            })
        }

        return new NullValue();
    }

    function evaluateParenExpression(expr: ParenExpression) {
        return evaluateExpression(expr.expression)
    }

    function evaluateLocalStatementOrLocalSequenceOfStatements (stmt: LocalExpressionStatement | SequenceOfStatements<LocalStatement>): BaseValue {
        if (stmt.kind === SyntaxKind.SequenceOfStatements) {
            return evaluateLocalSequenceOfStatements(stmt);
        } else {
            return evaluateLocalExpressionStatement(stmt)
        }
    }

    function evaluateIfExpression(expr: IfExpression) {
        const condition = evaluateExpression(expr.condition);
        const thenStatement = expr.thenStatement;
        const elseStatement = expr.elseStatement;

        if (!condition.isNull()) {
            return runInEnv(() => {
                return evaluateLocalStatementOrLocalSequenceOfStatements(thenStatement)
            });
        } else if(elseStatement) {
            return runInEnv(() => {
                return evaluateLocalStatementOrLocalSequenceOfStatements(elseStatement)
            });
        } else {
            return new NullValue()
        }
    }

    function evaluateArraysExpression(expr: ArraysExpression) {
        const length = evaluateExpression(expr.length);
        const defaultValue = expr.defaultValue ? evaluateExpression(expr.defaultValue) : undefined;
        if (!length.isInteger()) {
            throw new TypeError("Invalid length")
        }

        return new ArrayValue(length, defaultValue);
    }

    function evaluateNullExpression(expr: NullExpression) {
        return new NullValue()
    }

    function evaluatePrintingExpression(expr: PrintingExpression): NullValue {
        console.log(expr.format.value, ...expr.args.map(evaluateExpression).map(x => x.print()))
        return new NullValue()
    }

    function evaluateIntegerLiteralExpression(expr: IntegerLiteralExpression): IntegerValue {
        const isNegative = !!expr.subToken
        const value = Number(expr.value.value)
        return new IntegerValue(value * (isNegative ? -1 : 1))
    }

    function evaluateGlobalVariableStatement(stmt: GlobalVariableStatement) {
        const value = evaluateExpression(stmt.initializer)
        globalEnv.addBinding(stmt.name.id, value)
    }

    function evaluateLocalVariableStatement(stmt: LocalVariableStatement) {
        const env = currentEnv();
        const value = evaluateExpression(stmt.initializer)
        env.addBinding(stmt.name.id, value)
    }

    function evaluateTopLevelExpressionStatement(stmt: TopLevelExpressionStatement) {
        evaluateExpression(stmt.expression)
    }

    function evaluateLocalExpressionStatement(stmt: LocalExpressionStatement) {
        return evaluateExpression(stmt.expression)
    }
}
