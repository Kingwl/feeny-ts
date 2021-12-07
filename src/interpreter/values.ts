import { SequenceOfStatements, ExpressionStatement } from '../types';
import { Environment, ValueType } from './types';

export abstract class BaseValue {
  abstract get type(): ValueType;

  abstract print(): string;

  isNull(): this is NullValue {
    return false;
  }

  isBoolean(): this is BooleanValue {
    return false;
  }

  isArray(): this is ArrayValue {
    return false;
  }

  isString(): this is StringValue {
    return false;
  }

  isObject(): this is ObjectValue {
    return false;
  }

  isFunction(): this is FunctionValue {
    return false;
  }

  isInteger(): this is IntegerValue {
    return false;
  }

  isEnvValue(): this is EnvValue {
    return false;
  }
}

export class NullValue extends BaseValue {
  get type() {
    return ValueType.Null;
  }

  static Instance = new NullValue();

  print(): string {
    return 'null';
  }

  isNull(): true {
    return true;
  }
}

export abstract class EnvValue extends BaseValue {
  abstract get env(): Environment;

  isEnvValue(): true {
    return true;
  }
}

export class BooleanValue extends EnvValue {
  get type() {
    return ValueType.Boolean;
  }

  static True = new BooleanValue(true);
  static False = new BooleanValue(false);

  static Env = new Environment();
  private _instanceEnv = new Environment(BooleanValue.Env);

  get env() {
    return this._instanceEnv;
  }

  constructor(public value: boolean) {
    super();
  }

  isBoolean(): true {
    return true;
  }

  print(): string {
    return `${this.value}`;
  }
}

export class ArrayValue extends EnvValue {
  get type() {
    return ValueType.Array;
  }

  static Env = new Environment();
  private _instanceEnv = new Environment(ArrayValue.Env);

  get env() {
    return this._instanceEnv;
  }

  constructor(public length: IntegerValue, defaultValue?: BaseValue) {
    super();

    if (defaultValue) {
      for (let i = 0; i < length.value; i++) {
        this.env.addBinding(`${i}`, defaultValue);
      }
    }
  }

  print(): string {
    const list: BaseValue[] = [];
    for (let i = 0; i < this.length.value; i++) {
      const value = this.env.getBinding(`${i}`);
      if (value) {
        list.push(value);
      } else {
        list.push(NullValue.Instance);
      }
    }
    return `[${list.map(v => v.print()).join(', ')}]`;
  }

  isArray(): true {
    return true;
  }
}

export class ObjectValue extends EnvValue {
  get type() {
    return ValueType.Object;
  }

  private _instanceEnv: Environment;

  get env() {
    return this._instanceEnv;
  }

  constructor(parent?: BaseValue) {
    super();

    if (parent) {
      if (!parent.isEnvValue()) {
        throw new TypeError('Invalid extends');
      }

      this._instanceEnv = new Environment(parent.env);
    } else {
      this._instanceEnv = new Environment();
    }
  }

  print(): string {
    return `{[Object object]}`;
  }

  isObject(): true {
    return true;
  }
}

export class IntegerValue extends EnvValue {
  get type() {
    return ValueType.Integer;
  }

  static Env = new Environment();
  private _instanceEnv = new Environment(IntegerValue.Env);

  get env() {
    return this._instanceEnv;
  }

  constructor(public value: number) {
    super();
  }

  print(): string {
    return `${this.value}`;
  }

  isInteger(): true {
    return true;
  }
}

export class StringValue extends BaseValue {
  get type() {
    return ValueType.String;
  }

  constructor(public value: string) {
    super();
  }

  print(): string {
    return this.value;
  }

  isString(): true {
    return true;
  }
}

export abstract class FunctionValue extends BaseValue {
  get type() {
    return ValueType.Function;
  }

  constructor(public name: string, public params: string[]) {
    super();
  }

  print(): string {
    return `{[Function function]}`;
  }

  isFunction(): true {
    return true;
  }

  isBuiltin(): this is BuiltinFunction {
    return false;
  }

  isRuntime(): this is RuntimeFunction {
    return false;
  }
}

export class RuntimeFunction extends FunctionValue {
  constructor(
    name: string,
    params: string[],
    public body: SequenceOfStatements | ExpressionStatement,
    public closureEnv: Environment
  ) {
    super(name, params);
  }

  isRuntime(): true {
    return true;
  }
}

export class BuiltinFunction extends FunctionValue {
  constructor(
    name: string,
    params: string[],
    public fn: (
      thisValue: BaseValue | undefined,
      args: BaseValue[]
    ) => BaseValue
  ) {
    super(name, params);
  }

  print(): string {
    return `{[Function builtin]}`;
  }

  isBuiltin(): true {
    return true;
  }
}
