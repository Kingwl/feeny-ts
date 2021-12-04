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

    EndOfFileToken,
    SourceFile,

    // Expression
    IntegerLiteralExpression,
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

    // Object slot
    VariableSlot,
    MethodSlot,

    // Local Statements
    LocalVariableStatement,
    SequenceOfStatements,
    LocalExpressionStatement,

    // Top Level Statement
    GlobalVariableStatement,
    FunctionStatement,
    TopLevelExpressionStatement,

    // Shorthand
    BinaryShorthand,
    GetShorthand,
    SetShorthand,
}

export type KeywordSyntaxKind =
    | SyntaxKind.PrintfKeyword
    | SyntaxKind.ArraysKeyword
    | SyntaxKind.NullKeyword
    | SyntaxKind.ObjectsKeyword
    | SyntaxKind.VarKeyword
    | SyntaxKind.ThisKeyword
    | SyntaxKind.IfKeyword
    | SyntaxKind.ElseKeyword
    | SyntaxKind.WhileKeyword
    | SyntaxKind.MethodKeyword
    | SyntaxKind.DefnKeyword

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

export type BinaryShorthandToken = Token<BinaryShorthandTokenSyntaxKind>

export interface TextSpan {
    fullPos: number;
    pos: number;
    end: number;
}

export interface ASTNode extends TextSpan {
    kind: SyntaxKind;
    __debugKind?: string

    leadingIndent: number;
}

export interface NodeArray<T extends ASTNode> extends ReadonlyArray<T>, TextSpan {

}

export interface SourceFile extends ASTNode {
    _sourceFileBrand: never;
    kind: SyntaxKind.SourceFile;
    statements: NodeArray<TopLevelStatement>
}

export interface Token<K extends SyntaxKind = SyntaxKind> extends ASTNode {
    _tokenBrand: never
    kind: K
}


export interface IdentifierToken extends Token<SyntaxKind.Identifier> {
    id: string;
}

export interface StringLiteralToken extends Token<SyntaxKind.StringLiteralToken> {
    value: string;
}

export interface IntegerLiteralToken extends Token<SyntaxKind.IntegerLiteralToken> {
    value: string;
}

export type EndOfFileToken = Token<SyntaxKind.EndOfFileToken>;
export type NullToken = Token<SyntaxKind.NullKeyword>;
export type ArrayKeywordToken = Token<SyntaxKind.ArraysKeyword>;
export type ObjectsKeywordToken = Token<SyntaxKind.ObjectsKeyword>;
export type VarKeywordToken = Token<SyntaxKind.VarKeyword>;
export type ThisKeywordToken = Token<SyntaxKind.ThisKeyword>;
export type IfKeywordToken = Token<SyntaxKind.IfKeyword>;
export type ElseKeywordToken = Token<SyntaxKind.ElseKeyword>;
export type WhileKeywordToken = Token<SyntaxKind.WhileKeyword>;
export type MethodKeywordToken = Token<SyntaxKind.MethodKeyword>;
export type DefnKeywordToken = Token<SyntaxKind.DefnKeyword>;
export type PrintfKeywordToken = Token<SyntaxKind.PrintfKeyword>;
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
    | NullToken
    | ArrayKeywordToken
    | ObjectsKeywordToken
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

export type TokenSyntaxKind = AllTokens['kind']

export interface Expression extends ASTNode {
    _expressionBrand: never
}

export interface IntegerLiteralExpression extends Expression {
    kind: SyntaxKind.IntegerLiteralExpression
    value: IntegerLiteralToken
    subToken?: SubToken
}

export interface VariableReferenceExpression extends Expression {
    kind: SyntaxKind.VariableReferenceExpression
    id: IdentifierToken
}

export interface PrintingExpression extends Expression {
    kind: SyntaxKind.PrintingExpression
    format: StringLiteralToken
    args: NodeArray<Expression>
}

export interface ArraysExpression extends Expression {
    kind: SyntaxKind.ArraysExpression
    length: Expression
    defaultValue?: Expression
}

export interface NullExpression extends Expression {
    kind: SyntaxKind.NullExpression
    token: NullToken
}

export interface ObjectsExpression extends Expression {
    kind: SyntaxKind.ObjectsExpression
    extendsClause?: Expression;
    slots: NodeArray<ObjectSlot>
}

export interface MethodCallExpression extends Expression {
    kind: SyntaxKind.MethodCallExpression
    expression: AccessOrAssignmentExpressionOrHigher
    name: IdentifierToken
    args: NodeArray<Expression>
}

export interface SlotLookupExpression extends Expression {
    kind: SyntaxKind.SlotLookupExpression
    expression: AccessOrAssignmentExpressionOrHigher
    name: IdentifierToken
}

export interface SlotAssignmentExpression extends Expression {
    kind: SyntaxKind.SlotAssignmentExpression
    expression: AccessOrAssignmentExpressionOrHigher
    name: IdentifierToken
    value: Expression
}

export interface FunctionCallExpression extends Expression {
    kind: SyntaxKind.FunctionCallExpression
    expression: Expression
    args: NodeArray<Expression>
}

export interface VariableAssignmentExpression extends Expression {
    kind: SyntaxKind.VariableAssignmentExpression
    expression: AccessOrAssignmentExpressionOrHigher
    value: Expression
}

export interface IfExpression extends Expression {
    kind: SyntaxKind.IfExpression
    condition: Expression
    thenStatement: SequenceOfStatements | Expression
    elseStatement?: SequenceOfStatements | Expression
}

export interface WhileExpression extends Expression {
    kind: SyntaxKind.WhileExpression
    condition: Expression
    body: SequenceOfStatements | Expression
}

export interface ThisExpression extends Expression {
    kind: SyntaxKind.ThisExpression
}

export interface ParenExpression extends Expression {
    kind: SyntaxKind.ParenExpression
    expression: Expression
}

export interface BinaryShorthand extends Expression {
    kind: SyntaxKind.BinaryShorthand
    operator: Token<BinaryShorthandTokenSyntaxKind>
    left: Expression
    right: Expression
}

export interface GetShorthand extends Expression {
    kind: SyntaxKind.GetShorthand
    expression: AccessOrAssignmentExpressionOrHigher
    argExpression: Expression
}

export interface SetShorthand extends Expression {
    kind: SyntaxKind.SetShorthand
    expression: AccessOrAssignmentExpressionOrHigher
    argExpression: Expression
    value: Expression
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
    params: NodeArray<IdentifierToken>
    body: SequenceOfStatements | Expression
}
export interface Statement extends ASTNode {
    _statementBrand: never
}

export interface LocalVariableStatement extends Statement {
    kind: SyntaxKind.LocalVariableStatement
    name: IdentifierToken
    initializer: Expression
}

export interface SequenceOfStatements extends Statement {
    kind: SyntaxKind.SequenceOfStatements
    statements: NodeArray<LocalStatement>
}

export interface LocalExpressionStatement extends Statement {
    kind: SyntaxKind.LocalExpressionStatement
    expression: Expression
}

export interface GlobalVariableStatement extends Statement {
    kind: SyntaxKind.GlobalVariableStatement
    name: IdentifierToken
    initializer: Expression
}

export interface FunctionStatement extends Statement {
    kind: SyntaxKind.FunctionStatement
    name: IdentifierToken
    params: NodeArray<IdentifierToken>
    body: SequenceOfStatements | Expression
}

export interface TopLevelExpressionStatement extends Statement {
    kind: SyntaxKind.TopLevelExpressionStatement
    expression: Expression
}

export type PrimaryExpression =
    | IntegerLiteralExpression
    | VariableReferenceExpression
    | PrintingExpression
    | ArraysExpression
    | NullExpression
    | ObjectsExpression
    | IfExpression
    | WhileExpression
    | ThisExpression
    | ParenExpression

export type AccessOrAssignmentExpressionOrHigher =
    | PrimaryExpression
    | SlotAssignmentExpression 
    | MethodCallExpression 
    | SlotLookupExpression 
    | SetShorthand 
    | GetShorthand 
    | VariableAssignmentExpression

export type TopLevelStatement =
    | GlobalVariableStatement
    | SequenceOfStatements
    | FunctionStatement
    | TopLevelExpressionStatement

export type LocalStatement =
    | LocalVariableStatement
    | SequenceOfStatements
    | LocalExpressionStatement
