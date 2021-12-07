import { isVarValues, isCodeValues } from './utils';
import {
  IntegerValue,
  ArrayValue,
  ObjectValue,
  NullValue,
  BooleanValue,
  FunctionValue,
  BuiltinFunction,
  BaseValue
} from './values';

export interface Context {
  stdout: (str: string) => void;
}

export enum ValueType {
  Null,
  Boolean,
  Array,
  Object,
  Function,
  Integer,
  String
}

export type VarValues =
  | IntegerValue
  | ArrayValue
  | ObjectValue
  | NullValue
  | BooleanValue;
export type CodeValues = FunctionValue | BuiltinFunction;
export type AllValues = VarValues | CodeValues;

export interface CallFrame {
  thisValue: BaseValue | undefined;
  name: string;
  envStack: Environment[];
  parent: CallFrame | undefined;
  insideLoop: boolean;
}

export class Environment {
  private varValues = new Map<string, VarValues>();
  private codeValues = new Map<string, CodeValues>();

  constructor(private parent?: Environment) {}

  private setValues(name: string, value: BaseValue) {
    if (isVarValues(value)) {
      this.varValues.set(name, value);
    } else if (isCodeValues(value)) {
      this.codeValues.set(name, value);
    } else {
      throw new Error('Invalid value type');
    }
  }

  hasBinding(name: string): boolean {
    return this.varValues.has(name) || this.codeValues.has(name);
  }

  addBinding(name: string, value: BaseValue) {
    this.setValues(name, value);
  }

  setBinding(name: string, value: BaseValue) {
    if (!this.hasBinding(name)) {
      this.parent?.setBinding(name, value);
    } else {
      this.setValues(name, value);
    }
  }

  getBinding(name: string): BaseValue | undefined {
    return (
      this.varValues.get(name) ??
      this.codeValues.get(name) ??
      this.parent?.getBinding(name)
    );
  }
}
