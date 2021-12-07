export enum SyntaxKind {
  Unknown,

  // Token
  CommaToken,
  OpenParenToken,
  CloseParenToken,
  ColonToken,
  DotToken,
  EqualsToken,
  OpenBracketToken,
  CloseBracketToken,

  AddToken,
  SubToken,
  MulToken,
  DivToken,
  ModToken,
  LessThanToken,
  GreaterThanToken,
  LessEqualsThanToken,
  GreaterEqualsThanToken,
  EqualsEqualsToken,

  IntegerLiteralToken,
  StringLiteralToken,
  Identifier,

  // Syntax
  PrintfKeyword,
  ArraysKeyword,
  NullKeyword,
  ObjectsKeyword,
  VarKeyword,
  ThisKeyword,
  IfKeyword,
  ElseKeyword,
  WhileKeyword,
  MethodKeyword,
  DefnKeyword,
  BreakKeyword,
  ContinueKeyword,

  EndOfFileToken,

  SourceFile,

  // Expression
  IntegerLiteralExpression,
  StringLiteralExpression,
  VariableReferenceExpression,
  PrintingExpression,
  ArraysExpression,
  NullExpression,
  ObjectsExpression,
  MethodCallExpression,
  SlotLookupExpression,
  SlotAssignmentExpression,
  FunctionCallExpression,
  VariableAssignmentExpression,
  IfExpression,
  WhileExpression,
  ThisExpression,
  ParenExpression,
  FunctionExpression,
  BreakExpression,
  ContinueExpression,

  // Object slot
  VariableSlot,
  MethodSlot,

  // Statements
  VariableStatement,
  SequenceOfStatements,
  ExpressionStatement,
  FunctionStatement,
  
  // Declaration
  Parameter,

  // Shorthand
  BinaryShorthand,
  GetShorthand,
  SetShorthand
}

export type BinaryShorthandTokenSyntaxKind =
  | SyntaxKind.AddToken
  | SyntaxKind.SubToken
  | SyntaxKind.MulToken
  | SyntaxKind.DivToken
  | SyntaxKind.ModToken
  | SyntaxKind.LessThanToken
  | SyntaxKind.GreaterThanToken
  | SyntaxKind.LessEqualsThanToken
  | SyntaxKind.GreaterEqualsThanToken
  | SyntaxKind.EqualsEqualsToken;

export type BinaryShorthandToken = Token<BinaryShorthandTokenSyntaxKind>;

export interface TextSpan {
  fullPos: number;
  pos: number;
  end: number;
}

export interface ASTNode extends TextSpan {
  kind: SyntaxKind;
  __debugKind?: string;

  leadingIndent: number;
}

export interface NodeArray<T extends ASTNode>
  extends ReadonlyArray<T>,
    TextSpan {
  _nodeArrayBrand: never;
}

export interface SourceFile extends ASTNode {
  _sourceFileBrand: never;
  kind: SyntaxKind.SourceFile;
  body: SequenceOfStatements;
  eof: EndOfFileToken;
}

export interface Token<K extends SyntaxKind = SyntaxKind> extends ASTNode {
  _tokenBrand: never;
  kind: K;
}

export interface IdentifierToken extends Token<SyntaxKind.Identifier> {
  id: string;
  keyword?: KeywordTokens;
}

export interface StringLiteralToken
  extends Token<SyntaxKind.StringLiteralToken> {
  value: string;
}

export interface IntegerLiteralToken
  extends Token<SyntaxKind.IntegerLiteralToken> {
  value: string;
}

export type EndOfFileToken = Token<SyntaxKind.EndOfFileToken>;
export type NullKeywordToken = Token<SyntaxKind.NullKeyword>;
export type ArraysKeywordToken = Token<SyntaxKind.ArraysKeyword>;
export type ObjectsKeywordToken = Token<SyntaxKind.ObjectsKeyword>;
export type VarKeywordToken = Token<SyntaxKind.VarKeyword>;
export type ThisKeywordToken = Token<SyntaxKind.ThisKeyword>;
export type IfKeywordToken = Token<SyntaxKind.IfKeyword>;
export type ElseKeywordToken = Token<SyntaxKind.ElseKeyword>;
export type WhileKeywordToken = Token<SyntaxKind.WhileKeyword>;
export type MethodKeywordToken = Token<SyntaxKind.MethodKeyword>;
export type DefnKeywordToken = Token<SyntaxKind.DefnKeyword>;
export type PrintfKeywordToken = Token<SyntaxKind.PrintfKeyword>;
export type ContinueKeywordToken = Token<SyntaxKind.ContinueKeyword>;
export type BreakKeywordToken = Token<SyntaxKind.BreakKeyword>;

export type OpenParenToken = Token<SyntaxKind.OpenParenToken>;
export type CloseParenToken = Token<SyntaxKind.CloseParenToken>;
export type CommaToken = Token<SyntaxKind.CommaToken>;
export type ColonToken = Token<SyntaxKind.ColonToken>;
export type DotToken = Token<SyntaxKind.DotToken>;
export type EqualsToken = Token<SyntaxKind.EqualsToken>;
export type OpenBracketToken = Token<SyntaxKind.OpenBracketToken>;
export type CloseBracketToken = Token<SyntaxKind.CloseBracketToken>;
export type AddToken = Token<SyntaxKind.AddToken>;
export type SubToken = Token<SyntaxKind.SubToken>;
export type MulToken = Token<SyntaxKind.MulToken>;
export type DivToken = Token<SyntaxKind.DivToken>;
export type ModToken = Token<SyntaxKind.ModToken>;
export type LessThanToken = Token<SyntaxKind.LessThanToken>;
export type GreaterThanToken = Token<SyntaxKind.GreaterThanToken>;
export type LessEqualsThanToken = Token<SyntaxKind.LessEqualsThanToken>;
export type GreaterEqualsThanToken = Token<SyntaxKind.GreaterEqualsThanToken>;
export type EqualsEqualsToken = Token<SyntaxKind.EqualsEqualsToken>;

export type AllTokens =
  | EndOfFileToken
  | NullKeywordToken
  | ArraysKeywordToken
  | ObjectsKeywordToken
  | VarKeywordToken
  | ThisKeywordToken
  | IfKeywordToken
  | ElseKeywordToken
  | WhileKeywordToken
  | MethodKeywordToken
  | DefnKeywordToken
  | PrintfKeywordToken
  | ContinueKeywordToken
  | BreakKeywordToken
  | OpenParenToken
  | CloseParenToken
  | CommaToken
  | ColonToken
  | DotToken
  | EqualsToken
  | OpenBracketToken
  | CloseBracketToken
  | AddToken
  | SubToken
  | MulToken
  | DivToken
  | ModToken
  | LessThanToken
  | GreaterThanToken
  | LessEqualsThanToken
  | GreaterEqualsThanToken
  | EqualsEqualsToken
  | IdentifierToken
  | StringLiteralToken
  | IntegerLiteralToken;

export type TokenSyntaxKind = AllTokens['kind'];

export type KeywordTokens =
  | PrintfKeywordToken
  | ArraysKeywordToken
  | NullKeywordToken
  | ObjectsKeywordToken
  | VarKeywordToken
  | ThisKeywordToken
  | IfKeywordToken
  | ElseKeywordToken
  | WhileKeywordToken
  | MethodKeywordToken
  | ContinueKeywordToken
  | BreakKeywordToken
  | DefnKeywordToken;

export type KeywordSyntaxKind = KeywordTokens['kind'];

export interface Expression extends ASTNode {
  _expressionBrand: never;
}

export interface IntegerLiteralExpression extends Expression {
  kind: SyntaxKind.IntegerLiteralExpression;
  value: IntegerLiteralToken;
  subToken?: SubToken;
}

export interface StringLiteralExpression extends Expression {
  kind: SyntaxKind.StringLiteralExpression;
  value: StringLiteralToken;
}

export interface VariableReferenceExpression extends Expression {
  kind: SyntaxKind.VariableReferenceExpression;
  id: IdentifierToken;
}

export interface PrintingExpression extends Expression {
  kind: SyntaxKind.PrintingExpression;
  args: NodeArray<Expression>;
}

export interface ArraysExpression extends Expression {
  kind: SyntaxKind.ArraysExpression;
  length: Expression;
  defaultValue?: Expression;
}

export interface NullExpression extends Expression {
  kind: SyntaxKind.NullExpression;
  token: NullKeywordToken;
}

export interface ObjectsExpression extends Expression, Declaration {
  kind: SyntaxKind.ObjectsExpression;
  extendsClause?: Expression;
  slots: NodeArray<ObjectSlot>;
}

export interface MethodCallExpression extends Expression {
  kind: SyntaxKind.MethodCallExpression;
  expression: AccessOrAssignmentExpressionOrHigher;
  name: IdentifierToken;
  args: NodeArray<Expression>;
}

export interface SlotLookupExpression extends Expression {
  kind: SyntaxKind.SlotLookupExpression;
  expression: AccessOrAssignmentExpressionOrHigher;
  name: IdentifierToken;
}

export interface SlotAssignmentExpression extends Expression {
  kind: SyntaxKind.SlotAssignmentExpression;
  expression: AccessOrAssignmentExpressionOrHigher;
  name: IdentifierToken;
  value: Expression;
}

export interface FunctionCallExpression extends Expression {
  kind: SyntaxKind.FunctionCallExpression;
  expression: Expression;
  args: NodeArray<Expression>;
}

export interface VariableAssignmentExpression extends Expression {
  kind: SyntaxKind.VariableAssignmentExpression;
  id: IdentifierToken;
  value: Expression;
}

export interface IfExpression extends Expression {
  kind: SyntaxKind.IfExpression;
  condition: Expression;
  thenStatement: SequenceOfStatements | ExpressionStatement;
  elseStatement?: SequenceOfStatements | ExpressionStatement;
}

export interface WhileExpression extends Expression {
  kind: SyntaxKind.WhileExpression;
  condition: Expression;
  body: SequenceOfStatements | ExpressionStatement;
}

export interface ContinueExpression extends Expression {
  kind: SyntaxKind.ContinueExpression;
}

export interface BreakExpression extends Expression {
  kind: SyntaxKind.BreakExpression;
}

export interface ThisExpression extends Expression {
  kind: SyntaxKind.ThisExpression;
}

export interface ParenExpression extends Expression {
  kind: SyntaxKind.ParenExpression;
  expression: Expression;
}

export interface BinaryShorthand extends Expression {
  kind: SyntaxKind.BinaryShorthand;
  operator: Token<BinaryShorthandTokenSyntaxKind>;
  left: Expression;
  right: Expression;
}

export interface GetShorthand extends Expression {
  kind: SyntaxKind.GetShorthand;
  expression: AccessOrAssignmentExpressionOrHigher;
  args: NodeArray<Expression>;
}

export interface SetShorthand extends Expression {
  kind: SyntaxKind.SetShorthand;
  expression: AccessOrAssignmentExpressionOrHigher;
  args: NodeArray<Expression>;
  value: Expression;
}

export interface FunctionExpression extends Expression, FunctionBase {
  kind: SyntaxKind.FunctionExpression;
  name: IdentifierToken;
}

export interface Declaration extends ASTNode {
  _declarationBrand: never
}

export interface NamedDeclaration extends Declaration {
  name: IdentifierToken;
}

export interface Parameter extends NamedDeclaration {
  kind: SyntaxKind.Parameter;
}

export interface FunctionBase {
  params: NodeArray<Parameter>;
  body: SequenceOfStatements | ExpressionStatement;
}

export interface ObjectSlot extends ASTNode {
  _objectSlotBrand: never;
}

export interface VariableSlot extends NamedDeclaration, ObjectSlot {
  kind: SyntaxKind.VariableSlot;
  initializer: Expression;
}

export interface MethodSlot extends NamedDeclaration, ObjectSlot, FunctionBase {
  kind: SyntaxKind.MethodSlot;
}
export interface Statement extends ASTNode {
  _statementBrand: never;
}

export interface VariableStatement extends NamedDeclaration, Statement {
  kind: SyntaxKind.VariableStatement;
  initializer: Expression;
}

export interface SequenceOfStatements extends Statement {
  kind: SyntaxKind.SequenceOfStatements;
  statements: NodeArray<Statement>;
  isExpression: boolean;
}

export interface ExpressionStatement extends Statement {
  kind: SyntaxKind.ExpressionStatement;
  expression: Expression;
}

export interface FunctionStatement extends Statement, NamedDeclaration, FunctionBase {
  kind: SyntaxKind.FunctionStatement;
}


export enum SymbolFlag {
  None = 0,
  Variable = 1 << 0,
  Parameter = 1 << 1,
  Function = 1 << 2,
  VariableSlot = 1 << 3,
  MethodSlot = 1 << 4,
  AnomymousObject = 1 << 5,

  VariableLike = Variable | Parameter | VariableSlot,
  FunctionLike = Function | MethodSlot,
}


export interface Symbol {
  members?: SymbolTable;
  name?: string;
  flags: SymbolFlag;
  declaration: Declaration
  parent?: Symbol;
  _debugFlags?: string
}

export interface SymbolTable extends Map<string, Symbol> {

}

export type HasLocalVariables = 
  | SequenceOfStatements
  | SourceFile
  | MethodSlot
  | FunctionStatement
  | FunctionExpression

export type HasMembers =
  | ObjectsExpression

export type PrimaryExpression =
  | IntegerLiteralExpression
  | StringLiteralExpression
  | VariableReferenceExpression
  | VariableAssignmentExpression
  | PrintingExpression
  | ArraysExpression
  | FunctionExpression
  | NullExpression
  | ObjectsExpression
  | IfExpression
  | WhileExpression
  | ThisExpression
  | BreakExpression
  | ContinueExpression
  | ParenExpression;

export type AccessOrAssignmentExpressionOrHigher =
  | PrimaryExpression
  | SlotAssignmentExpression
  | MethodCallExpression
  | SlotLookupExpression
  | SetShorthand
  | GetShorthand;

export type AllStatement =
  | VariableStatement
  | SequenceOfStatements
  | ExpressionStatement
  | FunctionStatement;

export type AllDeclaration =
  | VariableStatement
  | FunctionStatement
  | VariableSlot
  | MethodSlot
  | Parameter
  | ObjectsExpression
