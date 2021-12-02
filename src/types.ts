enum TokenKind {
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

enum SyntaxKind {
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
    AddShorthand,
    SubShorthand,
    MulShorthand,
    DivShorthand,
    ModShorthand,
    LessThanShorthand,
    GreaterThanShorthand,
    LessEqualsThanShorthand,
    GreaterEqualsThanShorthand,
    EqualsEqualsShorthand,
    GetShorthand,
    SetShorthand
}

interface ASTNode {
    pos: number;
    end: number;
    comments?: string;
}

interface Token extends ASTNode {
    kind: TokenKind
}

interface GenericToken<T extends TokenKind> extends Token {
    kind: T;
}

interface IdentifierToken extends Token {
    kind: TokenKind.Identifier;
}

interface StringLiteralToken extends Token {
    kind: TokenKind.String;
    value: string;
}

interface IntegerLiteralToken extends Token {
    kind: TokenKind.Integer;
    value: string;
}

type NullToken = GenericToken<TokenKind.NullKeyword>;
type ArrayKeywordToken = GenericToken<TokenKind.ArrayKeyword>;
type ObjectKeywordToken = GenericToken<TokenKind.ObjectKeyword>;
type VarKeywordToken = GenericToken<TokenKind.VarKeyword>;
type ThisKeywordToken = GenericToken<TokenKind.ThisKeyword>;
type IfKeywordToken = GenericToken<TokenKind.IfKeyword>;
type ElseKeywordToken = GenericToken<TokenKind.ElseKeyword>;
type WhileKeywordToken = GenericToken<TokenKind.WhileKeyword>;
type MethodKeywordToken = GenericToken<TokenKind.MethodKeyword>;
type DefnKeywordToken = GenericToken<TokenKind.DefnKeyword>;
type PrintfKeywordToken = GenericToken<TokenKind.PrintfKeyword>;
type OpenParenToken = GenericToken<TokenKind.OpenParen>;
type CloseParenToken = GenericToken<TokenKind.CloseParen>;
type CommaToken = GenericToken<TokenKind.Comma>;
type ColonToken = GenericToken<TokenKind.Colon>;
type DotToken = GenericToken<TokenKind.Dot>;
type EqualsToken = GenericToken<TokenKind.Equals>;
type OpenBracketToken = GenericToken<TokenKind.OpenBracket>;
type CloseBracketToken = GenericToken<TokenKind.CloseBracket>;
type AddToken = GenericToken<TokenKind.Add>;
type SubToken = GenericToken<TokenKind.Sub>;
type MulToken = GenericToken<TokenKind.Mul>;
type DivToken = GenericToken<TokenKind.Div>;
type ModToken = GenericToken<TokenKind.Mod>;
type LessThanToken = GenericToken<TokenKind.LessThan>;
type GreaterThanToken = GenericToken<TokenKind.GreaterThan>;
type LessEqualsThanToken = GenericToken<TokenKind.LessEqualsThan>;
type GreaterEqualsThanToken = GenericToken<TokenKind.GreaterEqualsThan>;
type EqualsEqualsToken = GenericToken<TokenKind.EqualsEquals>;

interface Expression extends ASTNode {
    _expressionBrand: never
}

interface IntegerLiteralExpression extends Expression {
    kind: SyntaxKind.IntegerLiteral
    value: IntegerLiteralToken
}

interface VariableReferenceExpression extends Expression {
    kind: SyntaxKind.VariableReference
    id: IdentifierToken
}

interface PaintingExpression extends Expression {
    kind: SyntaxKind.Printing
    format: StringLiteralToken
    args: Expression[]
}

interface ArrayExpression extends Expression {
    kind: SyntaxKind.Array
    length: Expression
    initializer: Expression
}

interface NullExpression extends Expression {
    kind: SyntaxKind.Null
}

interface ObjectExpression extends Expression {
    kind: SyntaxKind.Objects
    slots: ObjectSlot[]
}

interface MethodCallExpression extends Expression {
    kind: SyntaxKind.MethodCall
    lookup: SlotLookupExpression
    args: Expression[]
}

interface SlotLookupExpression extends Expression {
    kind: SyntaxKind.SlotLookup
    expr: Expression
    name: VariableReferenceExpression
}

interface SlotAssignmentExpression extends Expression {
    kind: SyntaxKind.SlotAssignment
    expr: Expression
    name: VariableReferenceExpression
    initializer: Expression
}

interface FunctionCallExpression extends Expression {
    kind: SyntaxKind.FunctionCall
    expr: Expression
    args: Expression[]
}

interface VariableAssignmentExpression extends Expression {
    kind: SyntaxKind.VariableAssignment
    name: VariableReferenceExpression
    initializer: Expression
}

interface IfExpression extends Expression {
    kind: SyntaxKind.IfExpression
    condition: Expression
    then: Expression
    else?: Expression
}

interface WhileExpression extends Expression {
    kind: SyntaxKind.WhileExpression
    condition: Expression
    body: Expression
}

interface ObjectSlot extends ASTNode {
    _objectSlotBrand: never
}

interface VariableSlot extends ObjectSlot {
    kind: SyntaxKind.VariableSlot
    name: IdentifierToken
    initializer: Expression
}

interface MethodSlot extends ObjectSlot {
    kind: SyntaxKind.MethodSlot
    name: IdentifierToken
    args: IdentifierToken[]
    body: Statement
}

interface Statement extends ASTNode {
    _statementBrand: never
}

interface LocalVariableStatement extends Statement {
    kind: SyntaxKind.LocalVariable
    name: IdentifierToken
    initializer: Expression
}

interface SequenceOfStatements extends Statement {
    kind: SyntaxKind.SequenceOfStatements
    stmts: Statement[]
}

interface LocalExpressionStatement extends Statement {
    kind: SyntaxKind.LocalExpression
    expr: Expression
}

interface GlobalVariableStatement extends Statement {
    kind: SyntaxKind.GlobalVariable
    name: IdentifierToken
    initializer: Expression
}

interface FunctionStatement extends Statement {
    kind: SyntaxKind.Function
    name: IdentifierToken
    args: IdentifierToken[]
    body: Statement
}

interface TopLevelExpressionStatement extends Statement {
    kind: SyntaxKind.TopLevelExpression
    expr: Expression
}
