import {
  KeywordSyntaxKind,
  ObjectSlot,
  ASTNode,
  Token,
  SyntaxKind,
  NodeArray,
  BinaryShorthandTokenSyntaxKind,
  BinaryShorthandToken,
  Statement,
  Expression,
  Declaration,
  SymbolFlag,
  HasLocalVariables,
  HasMembers
} from './types';

export function finishNode<T extends ASTNode>(
  node: T,
  pos: number,
  end: number,
  text: string
): T {
  node.pos = pos;
  node.end = end;

  setupDebugInfo(node, text);
  return node;
}

export function createFinishNode(text: string) {
  return wrapper;

  function wrapper<T extends ASTNode>(node: T, pos: number, end: number): T {
    node.pos = pos;
    node.end = end;

    setupDebugInfo(node, text);
    return node;
  }
}

export function finishNodeArray<T extends ASTNode>(
  nodes: NodeArray<T>,
  pos: number,
  end: number
): NodeArray<T> {
  nodes.pos = pos;
  nodes.end = end;
  return nodes;
}

export function setupDebugInfo(node: ASTNode, text: string) {
  Object.defineProperty(node, '__debugKind', {
    get() {
      return SyntaxKind[node.kind];
    },
    enumerable: true
  });

  Object.defineProperty(node, '__debugText', {
    get() {
      return text.substring(node.pos, node.end);
    },
    enumerable: false
  });
}

export function isDef<T>(v: T): v is NonNullable<T> {
  return v !== undefined && v !== null;
}

export function assertDef<T>(
  v: T,
  message?: string
): asserts v is NonNullable<T> {
  if (!isDef(v)) {
    throw new Error(message ?? 'Must be defined');
  }
}

export function assert(v: any, message?: string): asserts v {
  if (!v) {
    throw new Error(message ?? 'Assertion failed');
  }
}

export function assertKind<T extends ASTNode>(node: ASTNode): asserts node is T {

}

export function first<T>(v?: readonly T[]): T {
  if (!v?.length) {
    throw new Error('Index out of range');
  }
  return v[0];
}

export function last<T>(v?: readonly T[]): T {
  if (!v?.length) {
    throw new Error('Index out of range');
  }
  return v[v.length - 1];
}

export function lastOrUndefined<T>(v?: readonly T[]): T | undefined {
  if (!v?.length) {
    return undefined;
  }
  return v[v.length - 1];
}

export enum Chars {
  Add = '+',
  Sub = '-',
  Mul = '*',
  Div = '/',
  Mod = '%',
  LessThan = '<',
  GreaterThan = '>',
  Equals = '=',
  OpenParen = '(',
  CloseParen = ')',
  OpenBracket = '[',
  CloseBracket = ']',
  Dot = '.',
  Colon = ':',
  Comma = ',',
  Quote = '"',
  BackSlash = '\\',
  Semi = ';',
  LowDash = '_',
  Dash = '-',
  Question = '?',

  _0 = '0',
  _1 = '1',
  _2 = '2',
  _3 = '3',
  _4 = '4',
  _5 = '5',
  _6 = '6',
  _7 = '7',
  _8 = '8',
  _9 = '9',

  Whitespace = ' ',
  Tab = '\t',
  LineFeed = '\n'
}

export enum Keywords {
  Null = 'null',
  Arrays = 'array',
  Objects = 'object',
  Var = 'var',
  This = 'this',
  If = 'if',
  Else = 'else',
  While = 'while',
  Method = 'method',
  Defn = 'defn',
  Printf = 'printf',
  Continue = 'continue',
  Break = 'break'
}

export function isKeyword(value: string): value is Keywords {
  switch (value) {
    case Keywords.Null:
    case Keywords.Arrays:
    case Keywords.Objects:
    case Keywords.Var:
    case Keywords.This:
    case Keywords.If:
    case Keywords.Else:
    case Keywords.While:
    case Keywords.Method:
    case Keywords.Defn:
    case Keywords.Printf:
    case Keywords.Break:
    case Keywords.Continue:
      return true;
    default:
      return false;
  }
}

export function isKeywordSyntaxKind(
  kind: SyntaxKind
): kind is KeywordSyntaxKind {
  switch (kind) {
    case SyntaxKind.PrintfKeyword:
    case SyntaxKind.ArraysKeyword:
    case SyntaxKind.NullKeyword:
    case SyntaxKind.ObjectsKeyword:
    case SyntaxKind.VarKeyword:
    case SyntaxKind.ThisKeyword:
    case SyntaxKind.IfKeyword:
    case SyntaxKind.ElseKeyword:
    case SyntaxKind.WhileKeyword:
    case SyntaxKind.MethodKeyword:
    case SyntaxKind.DefnKeyword:
    case SyntaxKind.ContinueKeyword:
    case SyntaxKind.BreakKeyword:
      return true;
    default:
      return false;
  }
}

export function isBinaryShorthandTokenSyntaxKind(
  kind: SyntaxKind
): kind is BinaryShorthandTokenSyntaxKind {
  switch (kind) {
    case SyntaxKind.AddToken:
    case SyntaxKind.SubToken:
    case SyntaxKind.MulToken:
    case SyntaxKind.DivToken:
    case SyntaxKind.ModToken:
    case SyntaxKind.LessThanToken:
    case SyntaxKind.GreaterThanToken:
    case SyntaxKind.LessEqualsThanToken:
    case SyntaxKind.GreaterEqualsThanToken:
    case SyntaxKind.EqualsEqualsToken:
      return true;
    default:
      return false;
  }
}

export enum BinaryShorthandPriority {
  Lowest = 0,
  Comparison = 4,
  Mod = 5,
  AddOrSub = 6,
  MulOrDiv = 7
}

export function getBinaryShorthandPriority(
  kind: BinaryShorthandTokenSyntaxKind
) {
  switch (kind) {
    case SyntaxKind.LessThanToken:
    case SyntaxKind.LessEqualsThanToken:
    case SyntaxKind.GreaterThanToken:
    case SyntaxKind.GreaterEqualsThanToken:
    case SyntaxKind.EqualsEqualsToken:
      return BinaryShorthandPriority.Comparison;
    case SyntaxKind.ModToken:
      return BinaryShorthandPriority.Mod;
    case SyntaxKind.AddToken:
    case SyntaxKind.SubToken:
      return BinaryShorthandPriority.AddOrSub;
    case SyntaxKind.MulToken:
    case SyntaxKind.DivToken:
      return BinaryShorthandPriority.MulOrDiv;
    default:
      throw new Error('Invalid kind: ' + kind);
  }
}

export function isBinaryShorthandToken(
  token: Token
): token is BinaryShorthandToken {
  return isBinaryShorthandTokenSyntaxKind(token.kind);
}

export const CharsToTokenKind = {
  [Chars.Add]: SyntaxKind.AddToken,
  [Chars.Sub]: SyntaxKind.SubToken,
  [Chars.Mul]: SyntaxKind.MulToken,
  [Chars.Div]: SyntaxKind.DivToken,
  [Chars.Mod]: SyntaxKind.ModToken,
  [Chars.LessThan]: SyntaxKind.LessThanToken,
  [Chars.GreaterThan]: SyntaxKind.GreaterThanToken,
  [Chars.Equals]: SyntaxKind.EqualsToken,
  [Chars.OpenParen]: SyntaxKind.OpenParenToken,
  [Chars.CloseParen]: SyntaxKind.CloseParenToken,
  [Chars.OpenBracket]: SyntaxKind.OpenBracketToken,
  [Chars.CloseBracket]: SyntaxKind.CloseBracketToken,
  [Chars.Dot]: SyntaxKind.DotToken,
  [Chars.Colon]: SyntaxKind.ColonToken,
  [Chars.Comma]: SyntaxKind.CommaToken
} as const;

export const KeywordsToTokenKind = {
  [Keywords.Null]: SyntaxKind.NullKeyword,
  [Keywords.Arrays]: SyntaxKind.ArraysKeyword,
  [Keywords.Objects]: SyntaxKind.ObjectsKeyword,
  [Keywords.Var]: SyntaxKind.VarKeyword,
  [Keywords.This]: SyntaxKind.ThisKeyword,
  [Keywords.If]: SyntaxKind.IfKeyword,
  [Keywords.Else]: SyntaxKind.ElseKeyword,
  [Keywords.While]: SyntaxKind.WhileKeyword,
  [Keywords.Method]: SyntaxKind.MethodKeyword,
  [Keywords.Defn]: SyntaxKind.DefnKeyword,
  [Keywords.Printf]: SyntaxKind.PrintfKeyword,
  [Keywords.Continue]: SyntaxKind.ContinueKeyword,
  [Keywords.Break]: SyntaxKind.BreakKeyword
} as const;

export const TokenKindsToKeyword = {
  [SyntaxKind.NullKeyword]: Keywords.Null,
  [SyntaxKind.ArraysKeyword]: Keywords.Arrays,
  [SyntaxKind.ObjectsKeyword]: Keywords.Objects,
  [SyntaxKind.VarKeyword]: Keywords.Var,
  [SyntaxKind.ThisKeyword]: Keywords.This,
  [SyntaxKind.IfKeyword]: Keywords.If,
  [SyntaxKind.ElseKeyword]: Keywords.Else,
  [SyntaxKind.WhileKeyword]: Keywords.While,
  [SyntaxKind.MethodKeyword]: Keywords.Method,
  [SyntaxKind.DefnKeyword]: Keywords.Defn,
  [SyntaxKind.PrintfKeyword]: Keywords.Printf,
  [SyntaxKind.ContinueKeyword]: Keywords.Continue,
  [SyntaxKind.BreakKeyword]: Keywords.Break
} as const;

export function isDigit(char: string): boolean {
  switch (char) {
    case Chars._0:
    case Chars._1:
    case Chars._2:
    case Chars._3:
    case Chars._4:
    case Chars._5:
    case Chars._6:
    case Chars._7:
    case Chars._8:
    case Chars._9:
      return true;
    default:
      return false;
  }
}

export function isAlpha(char: string): boolean {
  const charCode = char.charCodeAt(0);
  return (
    (charCode >= 'a'.charCodeAt(0) && charCode <= 'z'.charCodeAt(0)) ||
    (charCode >= 'A'.charCodeAt(0) && charCode <= 'Z'.charCodeAt(0))
  );
}

export function isWhiteSpaceOrTab(char: string): boolean {
  return char === Chars.Whitespace || char === Chars.Tab;
}

export function isAlphaOrDigitOrLowDashOrDashOrQuestion(char: string): boolean {
  return (
    isAlpha(char) ||
    isDigit(char) ||
    char === Chars.LowDash ||
    char === Chars.Dash ||
    char === Chars.Question
  );
}

export function getIndent(ch: string) {
  switch (ch) {
    case Chars.Whitespace:
      return 1;
    case Chars.Tab:
      return 4;
    default:
      return 0;
  }
}

export function isStatement(node: ASTNode): node is Statement {
  switch (node.kind) {
    case SyntaxKind.SequenceOfStatements:
    case SyntaxKind.VariableStatement:
    case SyntaxKind.ExpressionStatement:
    case SyntaxKind.FunctionStatement:
      return true;
    default:
      return false;
  }
}

export function isObjectSlot(node: ASTNode): node is ObjectSlot {
  switch (node.kind) {
    case SyntaxKind.MethodSlot:
    case SyntaxKind.VariableSlot:
      return true;
    default:
      return false;
  }
}

export function isExpression(node: ASTNode): node is Expression {
  switch (node.kind) {
    case SyntaxKind.IntegerLiteralExpression:
    case SyntaxKind.VariableReferenceExpression:
    case SyntaxKind.PrintingExpression:
    case SyntaxKind.ArraysExpression:
    case SyntaxKind.NullExpression:
    case SyntaxKind.ObjectsExpression:
    case SyntaxKind.MethodCallExpression:
    case SyntaxKind.SlotLookupExpression:
    case SyntaxKind.SlotAssignmentExpression:
    case SyntaxKind.FunctionCallExpression:
    case SyntaxKind.VariableAssignmentExpression:
    case SyntaxKind.IfExpression:
    case SyntaxKind.WhileExpression:
    case SyntaxKind.ThisExpression:
    case SyntaxKind.ParenExpression:
    case SyntaxKind.GetShorthand:
    case SyntaxKind.SetShorthand:
    case SyntaxKind.BreakExpression:
    case SyntaxKind.ContinueExpression:
      return true;
    default:
      return false;
  }
}

export function isDeclaration(node: ASTNode): node is Declaration {
  switch (node.kind) {
    case SyntaxKind.VariableStatement:
    case SyntaxKind.FunctionStatement:
    case SyntaxKind.VariableSlot:
    case SyntaxKind.MethodSlot:
    case SyntaxKind.Parameter:
    case SyntaxKind.ObjectsExpression:
      return true;
    default:
      return false;
  }
}


export function symbolFlagToDisplayText (flags: SymbolFlag) {
  const text = [];
  if (flags & SymbolFlag.Variable) {
      flags &= ~SymbolFlag.Variable;
      text.push(SymbolFlag[SymbolFlag.Variable]);
  }
  if (flags & SymbolFlag.Parameter) {
      flags &= ~SymbolFlag.Parameter;
      text.push(SymbolFlag[SymbolFlag.Parameter]);
  }
  if (flags & SymbolFlag.Function) {
      flags &= ~SymbolFlag.Function;
      text.push(SymbolFlag[SymbolFlag.Function]);
  }
  if (flags & SymbolFlag.VariableSlot) {
      flags &= ~SymbolFlag.VariableSlot;
      text.push(SymbolFlag[SymbolFlag.VariableSlot]);
  }
  if (flags & SymbolFlag.MethodSlot) {
      flags &= ~SymbolFlag.MethodSlot;
      text.push(SymbolFlag[SymbolFlag.MethodSlot]);
  }
  if (flags & SymbolFlag.AnomymousObject) {
      flags &= ~SymbolFlag.AnomymousObject;
      text.push(SymbolFlag[SymbolFlag.AnomymousObject]);
  }

  assert(flags === SymbolFlag.None, `Unknown symbol flag: ${flags}`);
  return text.join(' | ');
}

export function getDeclarationSymbolFlags (node: ASTNode): SymbolFlag {
  switch (node.kind) {
      case SyntaxKind.VariableSlot:
          return SymbolFlag.VariableSlot;
      case SyntaxKind.VariableStatement:
          return SymbolFlag.Variable;
      case SyntaxKind.Parameter:
          return SymbolFlag.Parameter;
      case SyntaxKind.FunctionStatement:
          return SymbolFlag.Function;
      case SyntaxKind.MethodSlot:
          return SymbolFlag.MethodSlot;
      case SyntaxKind.ObjectsExpression:
          return SymbolFlag.AnomymousObject;
      default:
          return SymbolFlag.None;
  }
}

export function isLocalVariableContainer (node: ASTNode): node is HasLocalVariables {
  switch (node.kind) {
      case SyntaxKind.SequenceOfStatements:
      case SyntaxKind.SourceFile:
      case SyntaxKind.MethodSlot:
      case SyntaxKind.FunctionStatement:
      case SyntaxKind.FunctionExpression:
          return true;
      default:
          return false;
  }
}

export function isMemberContainer (node: ASTNode): node is HasMembers {
  switch (node.kind) {
      case SyntaxKind.ObjectsExpression:
          return true
      default:
          return false;
  }
}