import { assertDef } from '../utils';
import { VarValues, CodeValues } from './types';
import { BaseValue } from './values';

export function assertThisValue<T extends BaseValue>(
  value: T | undefined
): asserts value is NonNullable<T> {
  assertDef(value, "'This' cannot be null");
}

export function assertArgumentsLength(expected: number, actual: number) {
  if (expected !== actual) {
    throw new Error(
      `Arguments mis match, expected ${expected}, actual: ${actual}`
    );
  }
}

export function isVarValues(value: BaseValue): value is VarValues {
  return (
    value.isInteger() ||
    value.isNull() ||
    value.isObject() ||
    value.isArray() ||
    value.isString()
  );
}

export function isCodeValues(value: BaseValue): value is CodeValues {
  return value.isFunction();
}
