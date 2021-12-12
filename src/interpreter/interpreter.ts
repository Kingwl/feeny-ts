import {
  BreakExpression,
  ContinueExpression,
  ArraysExpression,
  Expression,
  FunctionStatement,
  FunctionExpression,
  IfExpression,
  ExpressionStatement,
  MethodSlot,
  PrintingExpression,
  SyntaxKind,
  ThisExpression,
  VariableSlot,
  BinaryShorthand,
  FunctionCallExpression,
  GetShorthand,
  VariableStatement,
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
  WhileExpression,
  IntegerLiteralExpression,
  SequenceOfStatements,
  SourceFile,
  Statement,
  StringLiteralExpression
} from '../types';
import {
  assertDef,
  frontAndTail,
  last,
  shorthandTokenToOperator
} from '../utils';
import { setupBuiltin } from './builtins';
import { Environment, CallFrame, Context } from './types';
import { assertArgumentsLength } from './utils';
import {
  BaseValue,
  NullValue,
  RuntimeFunction,
  ObjectValue,
  BooleanValue,
  ArrayValue,
  IntegerValue,
  StringValue
} from './values';

setupBuiltin();

export function createInterpreter(file: SourceFile, context: Context) {
  const globalEnv = new Environment();
  const globalCallframe: CallFrame = {
    thisValue: undefined,
    name: '',
    envStack: [globalEnv],
    parent: undefined,
    insideLoop: false
  };
  const callFrames = [globalCallframe];

  const exceptionObjects = {
    Break: {},
    Continue: {}
  } as const;

  return {
    evaluate
  };

  function currentEnv() {
    return last(currentCallFrame().envStack);
  }

  function currentCallFrame() {
    return last(callFrames);
  }

  function pushCallFrame(callFrame: CallFrame) {
    callFrames.push(callFrame);
  }

  function popCallFrame(targetCallFrame: CallFrame | undefined) {
    const result = callFrames.pop();
    if (!callFrames.length) {
      throw new Error('Callframe not balanced');
    }
    if (targetCallFrame && result !== targetCallFrame) {
      throw new Error('Invalid callframe');
    }
    return result;
  }

  function pushEnv(env: Environment) {
    currentCallFrame().envStack.push(env);
  }

  function popEnv(targetEnv: Environment | undefined) {
    const envStack = currentCallFrame().envStack;
    if (!envStack.length) {
      throw new Error('EnvStack not balanced');
    }

    const result = envStack.pop();
    if (targetEnv && result !== targetEnv) {
      throw new Error('Invalid environment');
    }

    return result;
  }

  function runInEnv<R = void>(cb: () => R) {
    const parent = currentEnv();
    const env = new Environment(parent);
    pushEnv(env);

    let result: R;
    try {
      result = cb();
    } finally {
      popEnv(env);
    }

    return result;
  }

  function runInLoop<R>(cb: () => R) {
    const frame = currentCallFrame();
    const savedInsideLoop = frame.insideLoop;
    frame.insideLoop = true;

    let result: R;
    try {
      result = cb();
    } finally {
      frame.insideLoop = savedInsideLoop;
    }

    return result;
  }

  function runInFuncEnv<R = void>(
    name: string,
    thisValue: BaseValue | undefined,
    params: string[],
    args: BaseValue[],
    parentEnv: Environment | undefined,
    cb: () => R
  ) {
    const env = new Environment(parentEnv);

    for (let i = 0; i < params.length; i++) {
      const param = params[i];
      const arg = args[i];
      env.addBinding(param, arg);
    }

    const callFrame: CallFrame = {
      thisValue,
      envStack: [],
      name,
      parent: currentCallFrame(),
      insideLoop: false
    };

    pushCallFrame(callFrame);
    pushEnv(env);

    let result: R;
    try {
      result = cb();
    } finally {
      popEnv(env);
      popCallFrame(callFrame);
    }

    return result;
  }

  function callFunction(
    thisValue: BaseValue | undefined,
    callable: BaseValue,
    args: BaseValue[]
  ) {
    if (!callable.isFunction()) {
      throw new TypeError('Value is not callable: ' + callable.type);
    }

    assertArgumentsLength(callable.params.length, args.length);

    if (callable.isBuiltin()) {
      return runInFuncEnv(
        callable.name,
        thisValue,
        callable.params,
        args,
        undefined,
        () => {
          return callable.fn(thisValue, args);
        }
      );
    }

    if (!callable.isRuntime()) {
      throw new Error('Unknown callable kind: ' + callable.type);
    }

    return runInFuncEnv(
      callable.name,
      thisValue,
      callable.params,
      args,
      callable.closureEnv,
      () => {
        return callable.body();
      }
    );
  }

  function evaluate() {
    evaluateSourceFile(file);
  }

  function evaluateSourceFile(sourceFile: SourceFile) {
    evaluateSequenceOfStatements(sourceFile.body);
  }

  function evaluateSequenceOfStatements(seqs: SequenceOfStatements) {
    if (!seqs.isExpression) {
      seqs.statements.forEach(evaluateStatement);
      return NullValue.Instance;
    }

    const [front, tail] = frontAndTail(seqs.statements);

    front.forEach(evaluateStatement);

    if (tail.kind !== SyntaxKind.ExpressionStatement) {
      throw new Error('Invalid statement: ' + tail.__debugKind);
    }
    return evaluateExpressionStatement(tail as ExpressionStatement);
  }

  function evaluateStatement(stmt: Statement) {
    switch (stmt.kind) {
      case SyntaxKind.SequenceOfStatements:
        return evaluateSequenceOfStatements(stmt as SequenceOfStatements);
      case SyntaxKind.ExpressionStatement:
        return evaluateExpressionStatement(stmt as ExpressionStatement);
      case SyntaxKind.VariableStatement:
        return evaluateVariableStatement(stmt as VariableStatement);
      case SyntaxKind.FunctionStatement:
        return evaluateFunctionStatement(stmt as FunctionStatement);
      case SyntaxKind.TypeDefDeclaration:
        return undefined;
      default:
        throw new Error('Invalid statement: ' + stmt.__debugKind);
    }
  }

  function evaluateBreakOrContinueExpression(
    stmt: BreakExpression | ContinueExpression
  ): never {
    const callFrame = currentCallFrame();
    if (!callFrame.insideLoop) {
      throw new Error('Break or continue cannot used outside loop');
    }

    if (stmt.kind === SyntaxKind.BreakExpression) {
      throw exceptionObjects.Break;
    } else {
      throw exceptionObjects.Continue;
    }
  }

  function evaluateExpression(expr: Expression): BaseValue {
    switch (expr.kind) {
      case SyntaxKind.IntegerLiteralExpression:
        return evaluateIntegerLiteralExpression(
          expr as IntegerLiteralExpression
        );
      case SyntaxKind.StringLiteralExpression:
        return evaluateStringLiteralExpression(expr as StringLiteralExpression);
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
      case SyntaxKind.FunctionExpression:
        return evaluateFunctionExpression(expr as FunctionExpression);
      case SyntaxKind.BreakExpression:
      case SyntaxKind.ContinueExpression:
        return evaluateBreakOrContinueExpression(
          expr as BreakExpression | ContinueExpression
        );
      default:
        throw new Error('Invalid expression: ' + expr.__debugKind);
    }
  }

  function evaluateFunctionExpression(expr: FunctionExpression) {
    const env = currentEnv();
    const params = expr.params.map(x => x.name.text);
    const func = new RuntimeFunction(
      expr.name.text,
      params,
      () => evaluateExpressionStatementOrSequenceOfStatements(expr.body),
      env
    );
    return func;
  }

  function evaluateSetShorthand(expr: SetShorthand) {
    const left = evaluateExpression(expr.expression);
    if (!left.isEnvValue()) {
      throw new Error('Left operand must be an environment value');
    }

    const setFunc = left.env.getBinding('set');
    assertDef(setFunc, 'Cannot find definition for shorthand: set');

    const args = expr.args.map(evaluateExpression);
    const value = evaluateExpression(expr.value);

    return callFunction(left, setFunc, args.concat(value));
  }

  function evaluateGetShorthand(expr: GetShorthand) {
    const left = evaluateExpression(expr.expression);
    if (!left.isEnvValue()) {
      throw new Error('Left operand must be an environment value');
    }

    const getFunc = left.env.getBinding('get');
    assertDef(getFunc, 'Cannot find definition for shorthand: get');

    const args = expr.args.map(evaluateExpression);
    return callFunction(left, getFunc, args);
  }

  function evaluateThisExpression(expr: ThisExpression) {
    const callFrame = currentCallFrame();
    return callFrame.thisValue ?? NullValue.Instance;
  }

  function evaluateBinaryShorthand(expr: BinaryShorthand) {
    const left = evaluateExpression(expr.left);
    if (!left.isEnvValue()) {
      throw new TypeError('Left operand must be an environment value');
    }

    const operator = shorthandTokenToOperator(expr.operator.kind);
    const callable = left.env.getBinding(operator);
    assertDef(callable, 'Cannot find definition for shorthand: ' + operator);

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
    const callable = left.env.getBinding(expr.name.text);
    assertDef(callable, 'Cannot find definition for method: ' + expr.name.text);

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
      obj.env.addBinding(variableSlot.name.text, initializer);
    } else if (slot.kind === SyntaxKind.MethodSlot) {
      const env = currentEnv();
      const methodSlot = slot as MethodSlot;
      const params = methodSlot.params.map(x => x.name.text);
      const callable = new RuntimeFunction(
        methodSlot.name.text,
        params,
        () =>
          evaluateExpressionStatementOrSequenceOfStatements(methodSlot.body),
        env
      );
      obj.env.addBinding(methodSlot.name.text, callable);
    } else {
      throw new Error('Invalid slot kind: ' + slot.__debugKind);
    }
  }

  function evaluateVariableAssignmentExpression(
    expr: VariableAssignmentExpression
  ) {
    const env = currentEnv();
    const value = evaluateExpression(expr.value);

    env.setBinding(expr.expression.name.text, value);
    return value;
  }

  function evaluatSlotAssignmentExpression(expr: SlotAssignmentExpression) {
    const left = evaluateExpression(expr.expression);
    if (!left.isEnvValue()) {
      throw new Error('Invalid left value type: ' + left.type);
    }

    const right = evaluateExpression(expr.value);
    left.env.setBinding(expr.name.text, right);
    return right;
  }

  function evaluateSlotLookupExpression(expr: SlotLookupExpression) {
    const left = evaluateExpression(expr.expression);
    if (!left.isEnvValue()) {
      throw new Error('Invalid left value type: ' + left.type);
    }

    const result = left.env.getBinding(expr.name.text);
    assertDef(result, 'Cannot find slot: ' + expr.name.text);
    return result;
  }

  function evaluateVariableReferenceExpression(
    expr: VariableReferenceExpression
  ) {
    const env = currentEnv();
    const value = env.getBinding(expr.name.text);

    assertDef(value, 'Cannot find reference: ' + expr.name.text);
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
    if (value.isString()) {
      return value.value ? BooleanValue.True : BooleanValue.False;
    }
    throw new TypeError('Invalid cast: ' + value.type);
  }

  function evaluateWhileExpression(expr: WhileExpression) {
    let i = 0;
    while (toBooleanValue(evaluateExpression(expr.condition)).value) {
      if (i++ > 10000) {
        throw new Error('Infinite loop');
      }

      try {
        runInEnv(() => {
          return runInLoop(() => {
            return evaluateExpressionStatementOrSequenceOfStatements(expr.body);
          });
        });
      } catch (e: unknown) {
        if (e === exceptionObjects.Break) {
          break;
        }
        if (e === exceptionObjects.Continue) {
          continue;
        }

        throw e;
      }
    }

    return NullValue.Instance;
  }

  function evaluateParenExpression(expr: ParenExpression) {
    return evaluateExpression(expr.expression);
  }

  function evaluateExpressionStatementOrSequenceOfStatements(
    stmt: ExpressionStatement | SequenceOfStatements
  ): BaseValue {
    if (stmt.kind === SyntaxKind.SequenceOfStatements) {
      return evaluateSequenceOfStatements(stmt);
    } else {
      return evaluateExpressionStatement(stmt);
    }
  }

  function evaluateIfExpression(expr: IfExpression) {
    const condition = evaluateExpression(expr.condition);
    const thenStatement = expr.thenStatement;
    const elseStatement = expr.elseStatement;

    if (toBooleanValue(condition).value) {
      return runInEnv(() => {
        return evaluateExpressionStatementOrSequenceOfStatements(thenStatement);
      });
    } else if (elseStatement) {
      return runInEnv(() => {
        return evaluateExpressionStatementOrSequenceOfStatements(elseStatement);
      });
    } else {
      return NullValue.Instance;
    }
  }

  function evaluateArraysExpression(expr: ArraysExpression) {
    const length = evaluateExpression(expr.length);
    const defaultValue = expr.defaultValue
      ? evaluateExpression(expr.defaultValue)
      : undefined;
    if (!length.isInteger()) {
      throw new TypeError('Invalid length arguments, expected integer');
    }

    return new ArrayValue(length.value, defaultValue);
  }

  function evaluateNullExpression(expr: NullExpression) {
    return NullValue.Instance;
  }

  function evaluatePrintingExpression(expr: PrintingExpression): NullValue {
    expr.args
      .map(evaluateExpression)
      .map(x => x.print())
      .forEach(text => {
        context.stdout(text);
      });
    return NullValue.Instance;
  }

  function evaluateIntegerLiteralExpression(
    expr: IntegerLiteralExpression
  ): IntegerValue {
    const isNegative = !!expr.subToken;
    const value = Number(expr.value.value);
    return new IntegerValue(value * (isNegative ? -1 : 1));
  }

  function evaluateStringLiteralExpression(
    expr: StringLiteralExpression
  ): StringValue {
    return new StringValue(expr.value.value);
  }

  function evaluateVariableStatement(stmt: VariableStatement) {
    const env = currentEnv();
    const value = evaluateExpression(stmt.initializer);
    env.addBinding(stmt.name.text, value);
  }

  function evaluateFunctionStatement(stmt: FunctionStatement) {
    const env = currentEnv();
    const params = stmt.params.map(x => x.name.text);
    const func = new RuntimeFunction(
      stmt.name.text,
      params,
      () => evaluateExpressionStatementOrSequenceOfStatements(stmt.body),
      env
    );
    env.addBinding(stmt.name.text, func);
  }

  function evaluateExpressionStatement(stmt: ExpressionStatement) {
    return evaluateExpression(stmt.expression);
  }
}
