import {
  BinaryShorthand,
  BinaryShorthandTokenSyntaxKind,
  FunctionCallExpression,
  GetShorthand,
  LocalVariableStatement,
  MethodCallExpression,
  NullExpression,
  ObjectsExpression,
  ObjectSlot,
  ParenExpression,
  SetShorthand,
  SlotAssignmentExpression,
  SlotLookupExpression,
  VariableAssignmentExpression,
  VariableReferenceExpression,
  WhileExpression
} from '.';
import {
  ArraysExpression,
  Expression,
  FunctionStatement,
  IfExpression,
  LocalExpressionStatement,
  LocalStatement,
  MethodSlot,
  PrintingExpression,
  SyntaxKind,
  ThisExpression,
  VariableSlot
} from './types';
import {
  GlobalVariableStatement,
  IntegerLiteralExpression,
  SequenceOfStatements,
  SourceFile,
  Statement,
  TopLevelExpressionStatement,
  TopLevelStatement
} from './types';
import { assertDef, isDef, last } from './utils';

enum ValueType {
  Null,
  Boolean,
  Array,
  Object,
  Function,
  Integer
}

abstract class BaseValue {
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

class Environment {
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

class NullValue extends BaseValue {
  get type() {
    return ValueType.Null;
  }

  print(): string {
    return 'null';
  }

  isNull(): true {
    return true;
  }
}

abstract class EnvValue extends BaseValue {
  abstract get env(): Environment;

  isEnvValue(): true {
    return true;
  }
}

class BooleanValue extends EnvValue {
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

class ArrayValue extends EnvValue {
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
        list.push(new NullValue());
      }
    }
    return `[${list.map(v => v.print()).join(', ')}]`;
  }

  isArray(): true {
    return true;
  }
}

class ObjectValue extends EnvValue {
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

class IntegerValue extends EnvValue {
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

abstract class FunctionValue extends BaseValue {
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

class RuntimeFunction extends FunctionValue {
  constructor(
    name: string,
    params: string[],
    public body: SequenceOfStatements<LocalStatement> | LocalExpressionStatement
  ) {
    super(name, params);
  }

  isRuntime(): true {
    return true;
  }
}

class BuiltinFunction extends FunctionValue {
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

function createIntegerValueBuiltinFunction(
  cb: (a: number, b: number) => BaseValue
) {
  return (thisValue: BaseValue | undefined, args: BaseValue[]) => {
    assertDef(thisValue, 'Cannot find this value');

    if (args.length !== 1) {
      throw new Error('Arguments mis match');
    }
    const [right] = args;
    if (!thisValue.isInteger() || !right.isInteger()) {
      throw new TypeError('Invalid arguments');
    }
    return cb(thisValue.value, right.value);
  };
}

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
    return new IntegerValue(Math.floor(a / b));
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
    assertDef(thisValue, 'Cannot find this value');
    if (!thisValue.isArray()) {
      throw new TypeError('Invalid arguments');
    }
    if (args.length !== 1) {
      throw new Error('Arguments mis match');
    }
    const [indexValue] = args;
    if (!indexValue.isInteger()) {
      throw new TypeError('Invalid arguments');
    }

    const index = indexValue.value;
    if (index < 0 || index >= thisValue.length.value) {
      throw new Error('Index out of range');
    }

    const result = thisValue.env.getBinding(`${index}`);
    return result ?? new NullValue();
  }
);

const arraysBuiltinFunctionSet = new BuiltinFunction(
  'set',
  ['index', 'value'],
  (thisValue: BaseValue | undefined, args: BaseValue[]) => {
    assertDef(thisValue, 'Cannot find this value');
    if (!thisValue.isArray()) {
      throw new TypeError('Invalid arguments');
    }
    if (args.length !== 2) {
      throw new Error('Arguments mis match');
    }
    const [index, value] = args;
    if (!index.isInteger()) {
      throw new TypeError('Invalid arguments');
    }
    thisValue.env.addBinding(`${index}`, value);
    return new NullValue();
  }
);

const arraysBuiltinFunctionLength = new BuiltinFunction(
  'length',
  [],
  (thisValue: BaseValue | undefined, args: BaseValue[]) => {
    assertDef(thisValue, 'Cannot find this value');
    if (!thisValue.isArray()) {
      throw new TypeError('Invalid arguments');
    }

    return thisValue.length;
  }
);

ArrayValue.Env.addBinding('get', arraysBuiltinFunctionGet);
ArrayValue.Env.addBinding('set', arraysBuiltinFunctionSet);
ArrayValue.Env.addBinding('length', arraysBuiltinFunctionLength);

type VarValues =
  | IntegerValue
  | ArrayValue
  | ObjectValue
  | NullValue
  | BooleanValue;
type CodeValues = FunctionValue | BuiltinFunction;
type AllValues = VarValues | CodeValues;

interface CallFrame {
  thisValue: BaseValue | undefined;
  name: string;
  env: Environment;
}

function isVarValues(value: BaseValue): value is VarValues {
  return (
    value.isInteger() || value.isNull() || value.isObject() || value.isArray()
  );
}

function isCodeValues(value: BaseValue): value is CodeValues {
  return value.isFunction();
}

export function createInterpreter(file: SourceFile) {
  const globalEnv = new Environment();
  const envStack = [globalEnv];
  const callFrames: CallFrame[] = [];

  return {
    evaluate
  };

  function currentEnv() {
    return last(envStack);
  }

  function currentCallFrame() {
    return last(callFrames);
  }

  function pushCallFrame(callFrame: CallFrame) {
    callFrames.push(callFrame);
  }

  function popCallFrame() {
    return callFrames.pop();
  }

  function pushEnv(env: Environment) {
    envStack.push(env);
  }

  function popEnv() {
    return envStack.pop();
  }

  function runInEnv<R = void>(cb: () => R) {
    const parent = currentEnv();
    const env = new Environment(parent);
    pushEnv(env);
    const result = cb();
    popEnv();
    return result;
  }

  function runInFuncEnv<R = void>(
    name: string,
    thisValue: BaseValue | undefined,
    params: string[],
    args: BaseValue[],
    cb: () => R
  ) {
    const parent = currentEnv();
    const env = new Environment(parent);

    for (let i = 0; i < params.length; i++) {
      const param = params[i];
      const arg = args[i];
      env.addBinding(param, arg);
    }

    const callFrame: CallFrame = {
      thisValue,
      env,
      name
    };

    pushEnv(env);
    pushCallFrame(callFrame);
    const result = cb();
    const lastEnv = popEnv();
    if (lastEnv !== env) {
      throw new Error('Invalid environment');
    }
    const lastCallFrame = popCallFrame();
    if (lastCallFrame !== callFrame) {
      throw new Error('Invalid call frame');
    }
    return result;
  }

  function callFunction(
    thisValue: BaseValue | undefined,
    callable: BaseValue,
    args: BaseValue[]
  ) {
    if (!callable.isFunction()) {
      throw new TypeError('Not a function');
    }

    if (args.length !== callable.params.length) {
      throw new Error('Invalid number of arguments');
    }

    return runInFuncEnv(callable.name, thisValue, callable.params, args, () => {
      if (callable.isBuiltin()) {
        return callable.fn(thisValue, args);
      }
      if (callable.isRuntime()) {
        return evaluateLocalStatementOrLocalSequenceOfStatements(callable.body);
      }
      throw new Error('Invalid function');
    });
  }

  function evaluate() {
    evaluateSourceFile(file);
  }

  function evaluateSourceFile(sourceFile: SourceFile) {
    evaluateTopLevelSequenceOfStatements(sourceFile.body);
  }

  function evaluateLocalSequenceOfStatements(
    seqs: SequenceOfStatements<LocalStatement>
  ) {
    const front = seqs.statements.slice(0, seqs.statements.length - 1);
    const last = seqs.statements[seqs.statements.length - 1];

    front.forEach(evaluateStatement);

    if (last.kind !== SyntaxKind.LocalExpressionStatement) {
      throw new Error('Invalid statement');
    }
    return evaluateLocalExpressionStatement(last);
  }

  function evaluateTopLevelSequenceOfStatements(
    seqs: SequenceOfStatements<TopLevelStatement>
  ) {
    seqs.statements.forEach(evaluateStatement);
  }

  function evaluateStatement(stmt: Statement) {
    switch (stmt.kind) {
      case SyntaxKind.SequenceOfStatements:
        return evaluateLocalSequenceOfStatements(
          stmt as SequenceOfStatements<LocalStatement>
        );
      case SyntaxKind.GlobalVariableStatement:
        return evaluateGlobalVariableStatement(stmt as GlobalVariableStatement);
      case SyntaxKind.TopLevelExpressionStatement:
        return evaluateTopLevelExpressionStatement(
          stmt as TopLevelExpressionStatement
        );
      case SyntaxKind.LocalExpressionStatement:
        return evaluateLocalExpressionStatement(
          stmt as LocalExpressionStatement
        );
      case SyntaxKind.LocalVariableStatement:
        return evaluateLocalVariableStatement(stmt as LocalVariableStatement);
      case SyntaxKind.FunctionStatement:
        return evaluateFunctionStatement(stmt as FunctionStatement);
      default:
        throw new Error('Invalid statement');
    }
  }

  function evaluateExpression(expr: Expression): BaseValue {
    switch (expr.kind) {
      case SyntaxKind.IntegerLiteralExpression:
        return evaluateIntegerLiteralExpression(
          expr as IntegerLiteralExpression
        );
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
        return evaluateVariableReferenceExpression(
          expr as VariableReferenceExpression
        );
      case SyntaxKind.VariableAssignmentExpression:
        return evaluateVariableAssignmentExpression(
          expr as VariableAssignmentExpression
        );
      case SyntaxKind.ThisExpression:
        return evaluateThisExpression(expr as ThisExpression);
      case SyntaxKind.SlotLookupExpression:
        return evaluateSlotLookupExpression(expr as SlotLookupExpression);
      case SyntaxKind.SlotAssignmentExpression:
        return evaluatSlotAssignmentExpression(
          expr as SlotAssignmentExpression
        );
      case SyntaxKind.ObjectsExpression:
        return evaluateObjectsExpression(expr as ObjectsExpression);
      case SyntaxKind.FunctionCallExpression:
        return evaluateFunctionCallExpression(expr as FunctionCallExpression);
      case SyntaxKind.BinaryShorthand:
        return evaluateBinaryShorthand(expr as BinaryShorthand);
      case SyntaxKind.MethodCallExpression:
        return evaluateMethodCallExpression(expr as MethodCallExpression);
      case SyntaxKind.GetShorthand:
        return evaluateGetShorthand(expr as GetShorthand);
      case SyntaxKind.SetShorthand:
        return evaluateSetShorthand(expr as SetShorthand);
      default:
        throw new Error('Invalid expression: ' + expr.__debugKind);
    }
  }

  function evaluateSetShorthand(expr: SetShorthand) {
    const left = evaluateExpression(expr.expression);
    if (!left.isEnvValue()) {
      throw new Error('Invalid get shorthand');
    }

    const setFunc = left.env.getBinding('set');
    assertDef(setFunc, 'set shorthand not found');

    const args = expr.args.map(evaluateExpression);
    const value = evaluateExpression(expr.value);

    return callFunction(left, setFunc, args.concat(value));
  }

  function evaluateGetShorthand(expr: GetShorthand) {
    const left = evaluateExpression(expr.expression);
    if (!left.isEnvValue()) {
      throw new Error('Invalid get shorthand');
    }

    const getFunc = left.env.getBinding('get');
    assertDef(getFunc, 'get shorthand not found');

    const args = expr.args.map(evaluateExpression);
    return callFunction(left, getFunc, args);
  }

  function shorthandTokenToOperator(kind: BinaryShorthandTokenSyntaxKind) {
    switch (kind) {
      case SyntaxKind.AddToken:
        return 'add';
      case SyntaxKind.SubToken:
        return 'sub';
      case SyntaxKind.MulToken:
        return 'mul';
      case SyntaxKind.DivToken:
        return 'div';
      case SyntaxKind.ModToken:
        return 'mod';
      case SyntaxKind.LessThanToken:
        return 'lt';
      case SyntaxKind.GreaterThanToken:
        return 'gt';
      case SyntaxKind.LessEqualsThanToken:
        return 'le';
      case SyntaxKind.GreaterEqualsThanToken:
        return 'ge';
      case SyntaxKind.EqualsEqualsToken:
        return 'eq';
      default:
        throw new Error('Invalid operator');
    }
  }

  function evaluateThisExpression(expr: ThisExpression) {
    const callFrame = currentCallFrame();
    return callFrame.thisValue ?? new NullValue();
  }

  function evaluateBinaryShorthand(expr: BinaryShorthand) {
    const left = evaluateExpression(expr.left);
    if (!left.isEnvValue()) {
      throw new TypeError('Left operand must be an environment value');
    }

    const operator = shorthandTokenToOperator(expr.operator.kind);
    const callable = left.env.getBinding(operator);
    assertDef(callable, 'Operator not found: ' + operator);

    const right = evaluateExpression(expr.right);
    return callFunction(left, callable, [right]);
  }

  function evaluateFunctionCallExpression(expr: FunctionCallExpression) {
    const value = evaluateExpression(expr.expression);
    const args = expr.args.map(evaluateExpression);
    return callFunction(undefined, value, args);
  }

  function evaluateMethodCallExpression(expr: MethodCallExpression) {
    const left = evaluateExpression(expr.expression);
    if (!left.isEnvValue()) {
      throw new TypeError('Left operand must be an environment value');
    }
    const callable = left.env.getBinding(expr.name.id);
    assertDef(callable, 'Method not found');

    const args = expr.args.map(evaluateExpression);
    return callFunction(left, callable, args);
  }

  function evaluateObjectsExpression(expr: ObjectsExpression) {
    const inheritValue = expr.extendsClause
      ? evaluateExpression(expr.extendsClause)
      : undefined;
    const value = new ObjectValue(inheritValue);
    expr.slots.forEach(slot => evaluateObjectSlot(value, slot));
    return value;
  }

  function evaluateObjectSlot(obj: ObjectValue, slot: ObjectSlot) {
    if (slot.kind === SyntaxKind.VariableSlot) {
      const variableSlot = slot as VariableSlot;
      const initializer = evaluateExpression(variableSlot.initializer);
      obj.env.addBinding(variableSlot.name.id, initializer);
    } else if (slot.kind === SyntaxKind.MethodSlot) {
      const methodSlot = slot as MethodSlot;
      const params = methodSlot.params.map(x => x.id);
      const callable = new RuntimeFunction(
        methodSlot.name.id,
        params,
        methodSlot.body
      );
      obj.env.addBinding(methodSlot.name.id, callable);
    } else {
      throw new Error('Invalid slot');
    }
  }

  function evaluateVariableAssignmentExpression(
    expr: VariableAssignmentExpression
  ) {
    const env = currentEnv();
    const value = evaluateExpression(expr.value);

    env.setBinding(expr.id.id, value);
    return value;
  }

  function evaluatSlotAssignmentExpression(expr: SlotAssignmentExpression) {
    const left = evaluateExpression(expr.expression);
    if (!left.isEnvValue()) {
      throw new Error('Invalid left value type: ' + left.type);
    }

    const right = evaluateExpression(expr.value);
    left.env.setBinding(expr.name.id, right);
    return right;
  }

  function evaluateSlotLookupExpression(expr: SlotLookupExpression) {
    const left = evaluateExpression(expr.expression);
    if (!left.isEnvValue()) {
      throw new Error('Invalid left value type: ' + left.type);
    }

    const result = left.env.getBinding(expr.name.id);
    assertDef(result, 'Slot not found');
    return result;
  }

  function evaluateVariableReferenceExpression(
    expr: VariableReferenceExpression
  ) {
    const env = currentEnv();
    const value = env.getBinding(expr.id.id);

    assertDef(value, 'Cannot find reference: ' + expr.id.id);
    return value;
  }

  function toBooleanValue(value: BaseValue) {
    if (value.isNull()) {
      return new BooleanValue(false);
    }
    if (value.isBoolean()) {
      return value;
    }
    if (value.isInteger()) {
      return value.value === 0 ? BooleanValue.False : BooleanValue.True;
    }
    throw new TypeError('Invalid type: ' + value.type);
  }

  function evaluateWhileExpression(expr: WhileExpression) {
    let i = 0;
    while (toBooleanValue(evaluateExpression(expr.condition)).value) {
      if (i > 10000) {
        throw new Error('Infinite loop');
      }
      i++;

      runInEnv(() => {
        return evaluateLocalStatementOrLocalSequenceOfStatements(expr.body);
      });
    }

    return new NullValue();
  }

  function evaluateParenExpression(expr: ParenExpression) {
    return evaluateExpression(expr.expression);
  }

  function evaluateLocalStatementOrLocalSequenceOfStatements(
    stmt: LocalExpressionStatement | SequenceOfStatements<LocalStatement>
  ): BaseValue {
    if (stmt.kind === SyntaxKind.SequenceOfStatements) {
      return evaluateLocalSequenceOfStatements(stmt);
    } else {
      return evaluateLocalExpressionStatement(stmt);
    }
  }

  function evaluateIfExpression(expr: IfExpression) {
    const condition = evaluateExpression(expr.condition);
    const thenStatement = expr.thenStatement;
    const elseStatement = expr.elseStatement;

    if (toBooleanValue(condition).value) {
      return runInEnv(() => {
        return evaluateLocalStatementOrLocalSequenceOfStatements(thenStatement);
      });
    } else if (elseStatement) {
      return runInEnv(() => {
        return evaluateLocalStatementOrLocalSequenceOfStatements(elseStatement);
      });
    } else {
      return new NullValue();
    }
  }

  function evaluateArraysExpression(expr: ArraysExpression) {
    const length = evaluateExpression(expr.length);
    const defaultValue = expr.defaultValue
      ? evaluateExpression(expr.defaultValue)
      : undefined;
    if (!length.isInteger()) {
      throw new TypeError('Invalid length');
    }

    return new ArrayValue(length, defaultValue);
  }

  function evaluateNullExpression(expr: NullExpression) {
    return new NullValue();
  }

  function evaluatePrintingExpression(expr: PrintingExpression): NullValue {
    console.log(
      expr.format.value,
      ...expr.args.map(evaluateExpression).map(x => x.print())
    );
    return new NullValue();
  }

  function evaluateIntegerLiteralExpression(
    expr: IntegerLiteralExpression
  ): IntegerValue {
    const isNegative = !!expr.subToken;
    const value = Number(expr.value.value);
    return new IntegerValue(value * (isNegative ? -1 : 1));
  }

  function evaluateGlobalVariableStatement(stmt: GlobalVariableStatement) {
    const value = evaluateExpression(stmt.initializer);
    globalEnv.addBinding(stmt.name.id, value);
  }

  function evaluateLocalVariableStatement(stmt: LocalVariableStatement) {
    const env = currentEnv();
    const value = evaluateExpression(stmt.initializer);
    env.addBinding(stmt.name.id, value);
  }

  function evaluateTopLevelExpressionStatement(
    stmt: TopLevelExpressionStatement
  ) {
    evaluateExpression(stmt.expression);
  }

  function evaluateFunctionStatement(stmt: FunctionStatement) {
    const params = stmt.params.map(x => x.id);
    const func = new RuntimeFunction(stmt.name.id, params, stmt.body);
    globalEnv.addBinding(stmt.name.id, func);
  }

  function evaluateLocalExpressionStatement(stmt: LocalExpressionStatement) {
    return evaluateExpression(stmt.expression);
  }
}
