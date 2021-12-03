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

    IntegerToken,
    StringToken,
    Identifier,

    // Syntax

    PrintfKeyword,
    ArrayKeyword,
    NullKeyword,
    ObjectKeyword,
    VarKeyword,
    ThisKeyword,
    IfKeyword,
    ElseKeyword,
    WhileKeyword,
    MethodKeyword,
    DefnKeyword,

    EndOfFileToken,
    SourceFile,

    // Expression
    IntegerLiteral,
    VariableReference,
    Printing,
    Array,
    Null,
    Objects,
    MethodCall,
    SlotLookup,
    SlotAssignment,
    FunctionCall,
    VariableAssignment,
    IfExpression,
    WhileExpression,

    // Object slot
    VariableSlot,
    MethodSlot,

    // Local Statements
    LocalVariable,
    SequenceOfStatements,
    LocalExpression,

    // Top Level Statement
    GlobalVariable,
    Function,
    TopLevelExpression,

    // Shorthand
    BinaryShorthand,
    GetShorthand,
    SetShorthand,
}

export type KeywordSyntaxKind =
    | SyntaxKind.PrintfKeyword
    | SyntaxKind.ArrayKeyword
    | SyntaxKind.NullKeyword
    | SyntaxKind.ObjectKeyword
    | SyntaxKind.VarKeyword
    | SyntaxKind.ThisKeyword
    | SyntaxKind.IfKeyword
    | SyntaxKind.ElseKeyword
    | SyntaxKind.WhileKeyword
    | SyntaxKind.MethodKeyword
    | SyntaxKind.DefnKeyword

export type BinaryShorthandToken =
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

export interface ASTNode {
    kind: SyntaxKind;
    pos: number;
    fullPos: number;
    leadingIndent: number;
    end: number;
    comments?: string;

    __debugKind?: string
}

export interface SourceFile extends ASTNode {
    _sourceFileBrand: never;
    kind: SyntaxKind.SourceFile;
    statements: Statement[]
}

export interface Token extends ASTNode {
    _tokenBrand: never
    kind: TokenSyntaxKind
}

export interface GenericToken<T extends TokenSyntaxKind> extends Token {
    kind: T;
}

export interface IdentifierToken extends Token {
    kind: SyntaxKind.Identifier;
    id: string;
}

export interface StringLiteralToken extends Token {
    kind: SyntaxKind.StringToken;
    value: string;
}

export interface IntegerLiteralToken extends Token {
    kind: SyntaxKind.IntegerToken;
    value: string;
}

export type EndOfFileToken = GenericToken<SyntaxKind.EndOfFileToken>;
export type NullToken = GenericToken<SyntaxKind.NullKeyword>;
export type ArrayKeywordToken = GenericToken<SyntaxKind.ArrayKeyword>;
export type ObjectKeywordToken = GenericToken<SyntaxKind.ObjectKeyword>;
export type VarKeywordToken = GenericToken<SyntaxKind.VarKeyword>;
export type ThisKeywordToken = GenericToken<SyntaxKind.ThisKeyword>;
export type IfKeywordToken = GenericToken<SyntaxKind.IfKeyword>;
export type ElseKeywordToken = GenericToken<SyntaxKind.ElseKeyword>;
export type WhileKeywordToken = GenericToken<SyntaxKind.WhileKeyword>;
export type MethodKeywordToken = GenericToken<SyntaxKind.MethodKeyword>;
export type DefnKeywordToken = GenericToken<SyntaxKind.DefnKeyword>;
export type PrintfKeywordToken = GenericToken<SyntaxKind.PrintfKeyword>;
export type OpenParenToken = GenericToken<SyntaxKind.OpenParenToken>;
export type CloseParenToken = GenericToken<SyntaxKind.CloseParenToken>;
export type CommaToken = GenericToken<SyntaxKind.CommaToken>;
export type ColonToken = GenericToken<SyntaxKind.ColonToken>;
export type DotToken = GenericToken<SyntaxKind.DotToken>;
export type EqualsToken = GenericToken<SyntaxKind.EqualsToken>;
export type OpenBracketToken = GenericToken<SyntaxKind.OpenBracketToken>;
export type CloseBracketToken = GenericToken<SyntaxKind.CloseBracketToken>;
export type AddToken = GenericToken<SyntaxKind.AddToken>;
export type SubToken = GenericToken<SyntaxKind.SubToken>;
export type MulToken = GenericToken<SyntaxKind.MulToken>;
export type DivToken = GenericToken<SyntaxKind.DivToken>;
export type ModToken = GenericToken<SyntaxKind.ModToken>;
export type LessThanToken = GenericToken<SyntaxKind.LessThanToken>;
export type GreaterThanToken = GenericToken<SyntaxKind.GreaterThanToken>;
export type LessEqualsThanToken = GenericToken<SyntaxKind.LessEqualsThanToken>;
export type GreaterEqualsThanToken = GenericToken<SyntaxKind.GreaterEqualsThanToken>;
export type EqualsEqualsToken = GenericToken<SyntaxKind.EqualsEqualsToken>;

export type AllTokens =
    | EndOfFileToken
    | NullToken
    | ArrayKeywordToken
    | ObjectKeywordToken
    | VarKeywordToken
    | ThisKeywordToken
    | IfKeywordToken
    | ElseKeywordToken
    | WhileKeywordToken
    | MethodKeywordToken
    | DefnKeywordToken
    | PrintfKeywordToken
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
    | IntegerLiteralToken

type TokenSyntaxKind = AllTokens['kind']

export interface Expression extends ASTNode {
    _expressionBrand: never
}

export interface IntegerLiteralExpression extends Expression {
    kind: SyntaxKind.IntegerLiteral
    value: IntegerLiteralToken
}

export interface VariableReferenceExpression extends Expression {
    kind: SyntaxKind.VariableReference
    id: IdentifierToken
}

export interface PaintingExpression extends Expression {
    kind: SyntaxKind.Printing
    format: StringLiteralToken
    args: Expression[]
}

export interface ArrayExpression extends Expression {
    kind: SyntaxKind.Array
    length: Expression
    initializer: Expression
}

export interface NullExpression extends Expression {
    kind: SyntaxKind.Null
}

export interface ObjectExpression extends Expression {
    kind: SyntaxKind.Objects
    slots: ObjectSlot[]
}

export interface MethodCallExpression extends Expression {
    kind: SyntaxKind.MethodCall
    lookup: SlotLookupExpression
    args: Expression[]
}

export interface SlotLookupExpression extends Expression {
    kind: SyntaxKind.SlotLookup
    expr: Expression
    name: VariableReferenceExpression
}

export interface SlotAssignmentExpression extends Expression {
    kind: SyntaxKind.SlotAssignment
    expr: Expression
    name: VariableReferenceExpression
    initializer: Expression
}

export interface FunctionCallExpression extends Expression {
    kind: SyntaxKind.FunctionCall
    expr: Expression
    args: Expression[]
}

export interface VariableAssignmentExpression extends Expression {
    kind: SyntaxKind.VariableAssignment
    name: VariableReferenceExpression
    initializer: Expression
}

export interface IfExpression extends Expression {
    kind: SyntaxKind.IfExpression
    condition: Expression
    then: Expression
    else?: Expression
}

export interface WhileExpression extends Expression {
    kind: SyntaxKind.WhileExpression
    condition: Expression
    body: Expression
}

export interface BinaryShorthand extends Expression {
    kind: SyntaxKind.BinaryShorthand
    token: BinaryShorthandToken
    left: Expression
    right: Expression
}

export interface GetShortHand extends Expression {
    kind: SyntaxKind.GetShorthand
    expr: Expression
    name: Expression
}

export interface SetShorthand extends Expression {
    kind: SyntaxKind.SetShorthand
    expr: Expression
    name: Expression
    initializer: Expression
}

export interface ObjectSlot extends ASTNode {
    _objectSlotBrand: never
}

export interface VariableSlot extends ObjectSlot {
    kind: SyntaxKind.VariableSlot
    name: IdentifierToken
    initializer: Expression
}

export interface MethodSlot extends ObjectSlot {
    kind: SyntaxKind.MethodSlot
    name: IdentifierToken
    args: IdentifierToken[]
    body: Statement
}
export interface Statement extends ASTNode {
    _statementBrand: never
}

export interface LocalVariableStatement extends Statement {
    kind: SyntaxKind.LocalVariable
    name: IdentifierToken
    initializer: Expression
}

export interface SequenceOfStatements extends Statement {
    kind: SyntaxKind.SequenceOfStatements
    stmts: Statement[]
}

export interface LocalExpressionStatement extends Statement {
    kind: SyntaxKind.LocalExpression
    expr: Expression
}

export interface GlobalVariableStatement extends Statement {
    kind: SyntaxKind.GlobalVariable
    name: IdentifierToken
    initializer: Expression
}

export interface FunctionStatement extends Statement {
    kind: SyntaxKind.Function
    name: IdentifierToken
    args: IdentifierToken[]
    body: Statement
}

export interface TopLevelExpressionStatement extends Statement {
    kind: SyntaxKind.TopLevelExpression
    expr: Expression
}

export type TopLevelStatement =
    | GlobalVariableStatement
    | SequenceOfStatements
    | FunctionStatement
    | TopLevelExpressionStatement
