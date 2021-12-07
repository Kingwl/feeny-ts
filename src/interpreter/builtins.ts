import { assertThisValue, assertArgumentsLength } from './utils';
import {
  BaseValue,
  BuiltinFunction,
  IntegerValue,
  BooleanValue,
  NullValue,
  ArrayValue
} from './values';

function createIntegerValueBuiltinFunction(
  cb: (a: number, b: number) => BaseValue
) {
  return (thisValue: BaseValue | undefined, args: BaseValue[]) => {
    assertThisValue(thisValue);

    assertArgumentsLength(1, args.length);
    const [right] = args;
    if (!thisValue.isInteger()) {
      throw new TypeError('Invalid this value, expected integers.');
    }
    if (!right.isInteger()) {
      throw new TypeError('Invalid arguments, expected integers.');
    }

    return cb(thisValue.value, right.value);
  };
}

export function setupBuiltin() {
  const integerBuiltinFunctionAdd = new BuiltinFunction(
    'add',
    ['b'],
    createIntegerValueBuiltinFunction((a, b) => {
      return new IntegerValue(a + b);
    })
  );

  const integerBuiltinFunctionSub = new BuiltinFunction(
    'sub',
    ['b'],
    createIntegerValueBuiltinFunction((a, b) => {
      return new IntegerValue(a - b);
    })
  );

  const integerBuiltinFunctionMul = new BuiltinFunction(
    'mul',
    ['b'],
    createIntegerValueBuiltinFunction((a, b) => {
      return new IntegerValue(a * b);
    })
  );

  const integerBuiltinFunctionDiv = new BuiltinFunction(
    'div',
    ['b'],
    createIntegerValueBuiltinFunction((a, b) => {
      return new IntegerValue(Math.trunc(a / b));
    })
  );

  const integerBuiltinFunctionMod = new BuiltinFunction(
    'mod',
    ['b'],
    createIntegerValueBuiltinFunction((a, b) => {
      return new IntegerValue(a % b);
    })
  );

  const integerBuiltinFunctionLt = new BuiltinFunction(
    'lt',
    ['b'],
    createIntegerValueBuiltinFunction((a, b) => {
      return new BooleanValue(a < b);
    })
  );

  const integerBuiltinFunctionGt = new BuiltinFunction(
    'gt',
    ['b'],
    createIntegerValueBuiltinFunction((a, b) => {
      return new BooleanValue(a > b);
    })
  );

  const integerBuiltinFunctionLe = new BuiltinFunction(
    'le',
    ['b'],
    createIntegerValueBuiltinFunction((a, b) => {
      return new BooleanValue(a <= b);
    })
  );

  const integerBuiltinFunctionGe = new BuiltinFunction(
    'ge',
    ['b'],
    createIntegerValueBuiltinFunction((a, b) => {
      return new BooleanValue(a >= b);
    })
  );

  const integerBuiltinFunctionEq = new BuiltinFunction(
    'eq',
    ['b'],
    createIntegerValueBuiltinFunction((a, b) => {
      return new BooleanValue(a === b);
    })
  );

  IntegerValue.Env.addBinding('add', integerBuiltinFunctionAdd);
  IntegerValue.Env.addBinding('sub', integerBuiltinFunctionSub);
  IntegerValue.Env.addBinding('mul', integerBuiltinFunctionMul);
  IntegerValue.Env.addBinding('div', integerBuiltinFunctionDiv);
  IntegerValue.Env.addBinding('mod', integerBuiltinFunctionMod);
  IntegerValue.Env.addBinding('lt', integerBuiltinFunctionLt);
  IntegerValue.Env.addBinding('gt', integerBuiltinFunctionGt);
  IntegerValue.Env.addBinding('le', integerBuiltinFunctionLe);
  IntegerValue.Env.addBinding('ge', integerBuiltinFunctionGe);
  IntegerValue.Env.addBinding('eq', integerBuiltinFunctionEq);

  const arraysBuiltinFunctionGet = new BuiltinFunction(
    'get',
    ['index'],
    (thisValue: BaseValue | undefined, args: BaseValue[]) => {
      assertThisValue(thisValue);

      if (!thisValue.isArray()) {
        throw new TypeError('Invalid this value, expected Array');
      }

      assertArgumentsLength(1, args.length);
      const [indexValue] = args;
      if (!indexValue.isInteger()) {
        throw new TypeError('Invalid arguments, expected Integer');
      }

      const index = indexValue.value;
      if (index < 0 || index >= thisValue.length.value) {
        throw new Error('Index out of range');
      }

      const result = thisValue.env.getBinding(`${index}`);
      return result ?? NullValue.Instance;
    }
  );

  const arraysBuiltinFunctionSet = new BuiltinFunction(
    'set',
    ['index', 'value'],
    (thisValue: BaseValue | undefined, args: BaseValue[]) => {
      assertThisValue(thisValue);

      if (!thisValue.isArray()) {
        throw new TypeError('Invalid this value, expected Array');
      }

      assertArgumentsLength(2, args.length);
      const [indexValue, value] = args;
      if (!indexValue.isInteger()) {
        throw new TypeError('Invalid arguments, expected Integer');
      }

      const index = indexValue.value;
      thisValue.env.addBinding(`${index}`, value);
      return NullValue.Instance;
    }
  );

  const arraysBuiltinFunctionLength = new BuiltinFunction(
    'length',
    [],
    (thisValue: BaseValue | undefined, args: BaseValue[]) => {
      assertThisValue(thisValue);

      if (!thisValue.isArray()) {
        throw new TypeError('Invalid this value, expected Array');
      }

      return thisValue.length;
    }
  );

  ArrayValue.Env.addBinding('get', arraysBuiltinFunctionGet);
  ArrayValue.Env.addBinding('set', arraysBuiltinFunctionSet);
  ArrayValue.Env.addBinding('length', arraysBuiltinFunctionLength);
}
