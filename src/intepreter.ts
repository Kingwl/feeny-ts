import { ASTNode, LocalStatement, SyntaxKind } from ".";
import { SequenceOfStatements, SourceFile, Statement, TopLevelStatement } from "./types";

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

export function createIntepreter(file: SourceFile) {
    const globalEnv = new Environment()
    const envStack = [globalEnv];

    evaluate(file);

    function evaluate(node: ASTNode) {
        switch (node.kind) {
            case SyntaxKind.SourceFile:

        }
    }
}