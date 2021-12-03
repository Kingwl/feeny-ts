export enum TokenKind {
    Unknown,

    Comma,
    OpenParen,
    CloseParen,
    Colon,
    Dot,
    Equals,
    OpenBracket,
    CloseBracket,

    Add,
    Sub,
    Mul,
    Div,
    Mod,
    LessThan,
    GreaterThan,
    LessEqualsThan,
    GreaterEqualsThan,
    EqualsEquals,

    Integer,
    String,

    Identifier,

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
}

export type BinaryShorthandToken =
    | TokenKind.Add
    | TokenKind.Sub
    | TokenKind.Mul
    | TokenKind.Div
    | TokenKind.Mod
    | TokenKind.LessThan
    | TokenKind.GreaterThan
    | TokenKind.LessEqualsThan
    | TokenKind.GreaterEqualsThan
    | TokenKind.EqualsEquals;

export enum SyntaxKind {
    Unknown,

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

    // Global
    SourceFile
}

export interface ASTNode {
    pos: number;
    end: number;
    comments?: string;
}

export interface SourceFile extends ASTNode {
    _sourceFileBrand: never;

    statements: Statement[]
}

export interface Token extends ASTNode {
    _tokenBrand: never
    kind: TokenKind
}

export interface GenericToken<T extends TokenKind> extends Token {
    kind: T;
}

export interface IdentifierToken extends Token {
    kind: TokenKind.Identifier;
}

export interface StringLiteralToken extends Token {
    kind: TokenKind.String;
    value: string;
}

export interface IntegerLiteralToken extends Token {
    kind: TokenKind.Integer;
    value: string;
}

export type NullToken = GenericToken<TokenKind.NullKeyword>;
export type ArrayKeywordToken = GenericToken<TokenKind.ArrayKeyword>;
export type ObjectKeywordToken = GenericToken<TokenKind.ObjectKeyword>;
export type VarKeywordToken = GenericToken<TokenKind.VarKeyword>;
export type ThisKeywordToken = GenericToken<TokenKind.ThisKeyword>;
export type IfKeywordToken = GenericToken<TokenKind.IfKeyword>;
export type ElseKeywordToken = GenericToken<TokenKind.ElseKeyword>;
export type WhileKeywordToken = GenericToken<TokenKind.WhileKeyword>;
export type MethodKeywordToken = GenericToken<TokenKind.MethodKeyword>;
export type DefnKeywordToken = GenericToken<TokenKind.DefnKeyword>;
export type PrintfKeywordToken = GenericToken<TokenKind.PrintfKeyword>;
export type OpenParenToken = GenericToken<TokenKind.OpenParen>;
export type CloseParenToken = GenericToken<TokenKind.CloseParen>;
export type CommaToken = GenericToken<TokenKind.Comma>;
export type ColonToken = GenericToken<TokenKind.Colon>;
export type DotToken = GenericToken<TokenKind.Dot>;
export type EqualsToken = GenericToken<TokenKind.Equals>;
export type OpenBracketToken = GenericToken<TokenKind.OpenBracket>;
export type CloseBracketToken = GenericToken<TokenKind.CloseBracket>;
export type AddToken = GenericToken<TokenKind.Add>;
export type SubToken = GenericToken<TokenKind.Sub>;
export type MulToken = GenericToken<TokenKind.Mul>;
export type DivToken = GenericToken<TokenKind.Div>;
export type ModToken = GenericToken<TokenKind.Mod>;
export type LessThanToken = GenericToken<TokenKind.LessThan>;
export type GreaterThanToken = GenericToken<TokenKind.GreaterThan>;
export type LessEqualsThanToken = GenericToken<TokenKind.LessEqualsThan>;
export type GreaterEqualsThanToken = GenericToken<TokenKind.GreaterEqualsThan>;
export type EqualsEqualsToken = GenericToken<TokenKind.EqualsEquals>;

export type AllTokens =
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
