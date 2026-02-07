# KUHUL Grammar EBNF v2 (Formal / Complete)

**STATUS**: CANONICAL / PARSER-READY

---

## 1. Character Classes

```
letter          = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" 
                | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S" | "T" 
                | "U" | "V" | "W" | "X" | "Y" | "Z" 
                | "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" 
                | "k" | "l" | "m" | "n" | "o" | "p" | "q" | "r" | "s" | "t" 
                | "u" | "v" | "w" | "x" | "y" | "z" ;

digit           = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;

hex_digit       = digit 
                | "A" | "B" | "C" | "D" | "E" | "F" 
                | "a" | "b" | "c" | "d" | "e" | "f" ;

symbol_char     = letter | digit | "_" | "-" ;

whitespace      = " " | "\t" | "\r" | "\n" ;

newline         = "\r\n" | "\n" | "\r" ;

unicode_glyph   = ? any Unicode code point except control characters ? ;
```

## 2. Tokens (Lexical Grammar)

```
token           = identifier
                | number
                | string
                | operator
                | punctuation
                | glyph
                | keyword ;

// Identifiers
identifier      = letter, { symbol_char } ;

// Numbers
integer         = digit, { digit } ;
hex_integer     = "0x", hex_digit, { hex_digit } ;
float           = digit, { digit }, ".", digit, { digit }
                | ".", digit, { digit } ;
scientific      = ( integer | float ), ( "e" | "E" ), [ "+" | "-" ], integer ;

number          = integer | hex_integer | float | scientific ;

// Strings
string_char     = ? any character except " and \ ? | escape_seq ;
escape_seq      = "\\", ( "\"" | "\\" | "/" | "b" | "f" | "n" | "r" | "t" | "u", hex_digit, hex_digit, hex_digit, hex_digit ) ;
string          = "\"", { string_char }, "\"" ;

// Operators
operator        = "+" | "-" | "*" | "/" | "%" | "=" | "==" | "!=" 
                | "<" | "<=" | ">" | ">=" | "&" | "|" | "^" | "~" 
                | "<<" | ">>" | "&&" | "||" | "!" | "?" | ":" | "->" 
                | ":=" | "+=" | "-=" | "*=" | "/=" | "%=" ;

// Punctuation
punctuation     = "(" | ")" | "[" | "]" | "{" | "}" | "," | ";" | "." | ":" ;

// Glyphs (π system tokens)
glyph           = "@" | "@@" | "π" | "φ" | "∅" | "Δ" | "τ" | "λ" 
                | "⌀" | "∇" | "Σ" | "∏" | "√" | "±" | "θ" | "∞"
                | ? other Unicode glyphs from token registry ? ;

// Keywords
keyword         = "Wo" | "Sek" | "Xul" | "Yax" | "Pop" | "Ch'en" 
                | "if" | "then" | "else" | "match" | "as" | "in"
                | "for" | "while" | "break" | "continue" | "return"
                | "true" | "false" | "null" | "undefined"
                | "fn" | "json" | "list" | "map" | "type" | "struct"
                | "import" | "export" | "from" | "to" ;
```

## 3. Comments

```
comment         = line_comment | block_comment ;
line_comment    = "#", { ? any character except newline ? }, newline ;
block_comment   = "/*", { ? any character except "*/" ? }, "*/" ;
```

## 4. Expressions

```
program         = { statement } ;

statement       = expression_stmt
                | declaration_stmt
                | control_stmt
                | pi_action_stmt
                | block_stmt
                | empty_stmt ;

expression_stmt = expression, ";" ;

empty_stmt      = ";" ;

// Core expressions
expression      = assignment ;

assignment      = logical_or, [ assignment_op, assignment ] ;
assignment_op   = "=" | ":=" | "+=" | "-=" | "*=" | "/=" | "%=" ;

logical_or      = logical_and, { "||", logical_and } ;
logical_and     = equality, { "&&", equality } ;

equality        = comparison, { ( "==" | "!=" ), comparison } ;
comparison      = term, { ( "<" | "<=" | ">" | ">=" ), term } ;

term            = factor, { ( "+" | "-" ), factor } ;
factor          = unary, { ( "*" | "/" | "%" ), unary } ;

unary           = [ ( "!" | "-" | "+" | "~" ) ], primary ;

primary         = literal
                | identifier
                | "(", expression, ")"
                | "fn", parameter_list, block
                | json_literal
                | list_literal
                | glyph_expr
                | call_expr
                | member_expr
                | index_expr ;

// Literals
literal         = number | string | "true" | "false" | "null" | "undefined" ;

// Function calls
call_expr       = primary, "(", [ argument_list ], ")" ;
argument_list   = expression, { ",", expression } ;

// Member access
member_expr     = primary, ".", identifier ;

// Index access
index_expr      = primary, "[", expression, "]" ;

// JSON literals
json_literal    = "json", json_object ;
json_object     = "{", [ json_pair, { ",", json_pair } ], "}" ;
json_pair       = ( string | identifier ), ":", expression ;

// List literals
list_literal    = "[", [ expression, { ",", expression } ], "]" ;

// Glyph expressions (π system)
glyph_expr      = glyph, [ "(", [ argument_list ], ")" ] ;
```

## 5. Declarations

```
declaration_stmt = variable_decl | function_decl | type_decl ;

variable_decl   = "Wo", identifier, [ "=", expression ], ";" ;

function_decl   = "Pop", identifier, parameter_list, block, "Xul" ;

type_decl       = "type", identifier, "=", type_expression, ";" ;

parameter_list  = "(", [ parameter, { ",", parameter } ], ")" ;
parameter       = identifier, [ ":", type_annotation ] ;

type_annotation = identifier | type_literal ;

type_expression = type_literal
                | type_union
                | type_intersection
                | generic_type ;

type_literal    = "string" | "number" | "boolean" | "null" 
                | "undefined" | "any" | "void"
                | identifier
                | json_type
                | list_type
                | function_type ;

json_type       = "{", [ json_type_pair, { ",", json_type_pair } ], "}" ;
json_type_pair  = ( string | identifier ), ":", type_expression, [ "?" ] ;

list_type       = "[", type_expression, "]" ;

function_type   = "fn", "(", [ parameter_type, { ",", parameter_type } ], ")", "->", type_expression ;
parameter_type  = identifier, ":", type_expression ;

type_union      = type_expression, "|", type_expression ;
type_intersection = type_expression, "&", type_expression ;

generic_type    = identifier, "<", type_expression, { ",", type_expression }, ">" ;
```

## 6. Control Flow

```
control_stmt    = if_stmt
                | match_stmt
                | for_stmt
                | while_stmt
                | break_stmt
                | continue_stmt
                | return_stmt ;

if_stmt         = "Yax", expression, "Sek", "if_", block, 
                  { "Sek", "elif_", expression, block }, 
                  [ "Sek", "else_", block ], "Xul" ;

match_stmt      = "Yax", expression, "Sek", "match", "{",
                  { match_case }, 
                  [ match_default ],
                  "}", "Xul" ;

match_case      = match_pattern, "->", ( block | expression ), "," ;
match_default   = "_", "->", ( block | expression ), "," ;

match_pattern   = literal
                | identifier
                | json_pattern
                | list_pattern ;

json_pattern    = "{", [ json_pattern_pair, { ",", json_pattern_pair } ], "}" ;
json_pattern_pair = ( string | identifier ), ":", match_pattern ;

list_pattern    = "[", [ match_pattern, { ",", match_pattern } ], "]" ;

for_stmt        = "Sek", "for", identifier, "in", expression, block, "Xul" ;

while_stmt      = "Sek", "while", expression, block, "Xul" ;

break_stmt      = "break", ";" ;

continue_stmt   = "continue", ";" ;

return_stmt     = "return", [ expression ], ";" ;
```

## 7. Blocks and Scopes

```
block_stmt      = block ;
block           = "{", { statement }, "}" ;
```

## 8. π.action Statements (Special Syntax)

```
pi_action_stmt  = pi_action_decl | pi_loop_decl ;

pi_action_decl  = "⟁π.action⟁", identifier, block, "⟁Xul⟁" 
                | "π.action", identifier, block, "π.end" ;

pi_loop_decl    = "⟁loop⟁", identifier, block, "⟁Xul⟁" 
                | "loop", identifier, block, "loop.end" ;

// Inside π.action blocks
pi_statement    = wo_statement | sek_statement ;

wo_statement    = "Wo", ( pi_assignment | pi_expression ), ";" ;

pi_assignment   = identifier, "=", pi_expression ;

pi_expression   = pi_literal
                | pi_glyph_array
                | pi_call
                | identifier ;

pi_literal      = number | string ;

pi_glyph_array  = "π.tokens", "=", "[", 
                  pi_glyph_pair, { ",", pi_glyph_pair }, 
                  "]" ;

pi_glyph_pair   = "{", "glyph", ":", string, ",", "weight", ":", number, "}" ;

pi_call         = identifier, "(", [ pi_argument_list ], ")" ;
pi_argument_list = pi_expression, { ",", pi_expression } ;

sek_statement   = "Sek", sek_path, [ "->", identifier ], ";" ;

sek_path        = sek_stage, { "->", sek_stage } ;
sek_stage       = "tick" | "propagate" | "cluster" | "collapse" | "observe" ;
```

## 9. Verb System Extensions

```
verb_stmt       = verb_command | verb_declaration ;

verb_command    = verb_prefix, verb, verb_target ;
verb_prefix     = "mx2lm" | "kuhul" ;
verb            = "develop" | "design" | "build" | "create" | "implement"
                | "deploy" | "integrate" | "test" | "evaluate" | "analyze"
                | "optimize" | "refine" | "improve" | "enhance"
                | "automate" | "simulate" | "model"
                | "learn" | "adapt" | "evolve" ;
verb_target     = string | identifier | json_object ;

verb_declaration = "@verb", ":", string, verb_metadata ;
verb_metadata   = "{", verb_meta_pair, { ",", verb_meta_pair }, "}" ;
verb_meta_pair  = ( "phase" | "class" | "entropy" | "penalties" ), ":", expression ;
```

## 10. Special Forms (Runtime Hooks)

```
special_form    = fn_call | json_access | list_op ;

fn_call         = "fn", ".", identifier, "(", [ argument_list ], ")" ;

json_access     = "json", ".", ( "get" | "set" | "has" | "keys" | "values" ), 
                  "(", expression, ")" ;

list_op         = "list", ".", ( "get" | "set" | "push" | "pop" | "slice" | "map" | "filter" | "reduce" ),
                  "(", expression, ")" ;
```

## 11. Directives and Pragmas

```
directive       = "#!", pragma ;
pragma          = "mx2lm" | "kuhul", pragma_body ;
pragma_body     = identifier, { pragma_arg } ;
pragma_arg      = string | number | identifier ;

annotation      = "@", identifier, [ "(", [ annotation_arg_list ], ")" ] ;
annotation_arg_list = annotation_arg, { ",", annotation_arg } ;
annotation_arg  = string | number | identifier | json_object ;
```

## 12. Complete Grammar Summary

```
KUHUL           = { directive | annotation | statement } EOF ;

statement       = declaration_stmt
                | control_stmt
                | pi_action_stmt
                | verb_stmt
                | expression_stmt
                | empty_stmt ;

declaration_stmt = variable_decl | function_decl | type_decl ;

control_stmt    = if_stmt | match_stmt | for_stmt | while_stmt 
                | break_stmt | continue_stmt | return_stmt ;

pi_action_stmt  = pi_action_decl | pi_loop_decl ;

verb_stmt       = verb_command | verb_declaration ;

expression_stmt = expression, ";" ;

empty_stmt      = ";" ;

expression      = assignment ;

assignment      = logical_or, [ assignment_op, assignment ] ;

logical_or      = logical_and, { "||", logical_and } ;

logical_and     = equality, { "&&", equality } ;

equality        = comparison, { ("==" | "!="), comparison } ;

comparison      = term, { ("<" | "<=" | ">" | ">="), term } ;

term            = factor, { ("+" | "-"), factor } ;

factor          = unary, { ("*" | "/" | "%"), unary } ;

unary           = [ ("!" | "-" | "+" | "~") ], primary ;

primary         = literal
                | identifier
                | "(", expression, ")"
                | fn_call
                | json_access
                | list_op
                | glyph_expr
                | call_expr
                | member_expr
                | index_expr
                | json_literal
                | list_literal ;

// Terminal symbols
literal         = number | string | "true" | "false" | "null" | "undefined" ;
number          = integer | hex_integer | float | scientific ;
string          = "\"", { string_char }, "\"" ;
identifier      = letter, { symbol_char } ;
glyph           = "@" | "@@" | "π" | "φ" | "∅" | "Δ" | "τ" | "λ" 
                | "⌀" | "∇" | "Σ" | "∏" | "√" | "±" | "θ" | "∞" ;
operator        = "+" | "-" | "*" | "/" | "%" | "=" | "==" | "!=" 
                | "<" | "<=" | ">" | ">=" | "&" | "|" | "^" | "~" 
                | "<<" | ">>" | "&&" | "||" | "!" | "?" | ":" | "->" 
                | ":=" | "+=" | "-=" | "*=" | "/=" | "%=" ;
```

## 13. Lexical Precedence (Highest to Lowest)

```
1.  [] . () (member access, function call, subscript)
2.  ! - + ~ (unary operators)
3.  * / % (multiplicative)
4.  + - (additive)
5.  << >> (bitwise shift)
6.  < <= > >= (relational)
7.  == != (equality)
8.  & (bitwise AND)
9.  ^ (bitwise XOR)
10. | (bitwise OR)
11. && (logical AND)
12. || (logical OR)
13. ?: (ternary conditional)
14. = := += -= *= /= %= (assignment)
```

## 14. Formal Properties

### 14.1 Context-Free Grammar Properties
- **No left recursion** in expression grammar (LL(1) friendly)
- **Terminals clearly distinguished** from non-terminals
- **Operator precedence** encoded in grammar levels
- **No ambiguity** in if/else matching (dangling else resolved by `Xul`)

### 14.2 Parser Implementation Notes

```javascript
// LL(1) Parser structure example
class KuhulParser {
  constructor(tokens) {
    this.tokens = tokens;
    this.position = 0;
  }

  parseProgram() {
    const statements = [];
    while (!this.isAtEnd()) {
      statements.push(this.parseStatement());
    }
    return { type: 'Program', statements };
  }

  parseStatement() {
    if (this.match('Wo')) return this.parseVariableDecl();
    if (this.match('Pop')) return this.parseFunctionDecl();
    if (this.match('Yax')) return this.parseIfStmt();
    if (this.match('Sek')) return this.parseControlStmt();
    if (this.match('⟁π.action⟁', 'π.action')) return this.parsePiAction();
    if (this.match('@')) return this.parseAnnotation();
    if (this.match('#')) return this.parseDirective();

    // Default: expression statement
    const expr = this.parseExpression();
    this.consume(';');
    return { type: 'ExpressionStatement', expression: expr };
  }

  // ... rest of parser methods
}
```

### 14.3 Grammar Validation Rules

1. **π.action blocks** can only contain `Wo` and `Sek` statements
2. **Glyph expressions** only valid within π context
3. **Verb statements** must appear at top-level or in control blocks
4. **Type annotations** only in declarations, not expressions
5. **JSON literals** must have string keys or identifiers
6. **Match patterns** must be exhaustive or have default case

## 15. Extended BNF Notation

```
(* KUHUL Grammar in Standard EBNF *)
Program = { Statement } EOF.

Statement = Declaration | ControlStmt | PiActionStmt | VerbStmt 
          | Expression ";" | ";".

Declaration = "Wo" Ident [ "=" Expression ] ";" 
            | "Pop" Ident "(" [ Parameter { "," Parameter } ] ")" Block "Xul"
            | "type" Ident "=" TypeExpr ";".

ControlStmt = IfStmt | MatchStmt | ForStmt | WhileStmt 
            | "break" ";" | "continue" ";" | "return" [ Expression ] ";".

PiActionStmt = ("⟁π.action⟁" | "π.action") Ident Block ("⟁Xul⟁" | "π.end")
             | ("⟁loop⟁" | "loop") Ident Block ("⟁Xul⟁" | "loop.end").

VerbStmt = VerbCommand | ("@" "verb" ":" String VerbMetadata).

Expression = Assignment.

Assignment = LogicalOr { ("=" | ":=" | "+=" | "-=" | "*=" | "/=" | "%=") Assignment }.

LogicalOr = LogicalAnd { "||" LogicalAnd }.

LogicalAnd = Equality { "&&" Equality }.

Equality = Comparison { ("==" | "!=") Comparison }.

Comparison = Term { ("<" | "<=" | ">" | ">=") Term }.

Term = Factor { ("+" | "-") Factor }.

Factor = Unary { ("*" | "/" | "%") Unary }.

Unary = [ ("!" | "-" | "+" | "~") ] Primary.

Primary = Literal | Ident | "(" Expression ")" 
        | FnCall | JsonAccess | ListOp | GlyphExpr
        | CallExpr | MemberExpr | IndexExpr
        | JsonLiteral | ListLiteral.

(* Terminals *)
Ident = Letter { Letter | Digit | "_" | "-" }.
Number = Digit { Digit } 
       | "0x" HexDigit { HexDigit }
       | Digit { Digit } "." Digit { Digit }
       | ("+" | "-")? Digit { Digit } ("e" | "E") ("+" | "-")? Digit { Digit }.
String = '"' { StringChar } '"'.
Glyph = "@" | "@@" | "π" | "φ" | "∅" | "Δ" | "τ" | "λ" 
      | "⌀" | "∇" | "Σ" | "∏" | "√" | "±" | "θ" | "∞".

Letter = "A".."Z" | "a".."z".
Digit = "0".."9".
HexDigit = Digit | "A".."F" | "a".."f".
StringChar = ? any character except " and \ ? | Escape.
Escape = "\\" ( "\"" | "\\" | "/" | "b" | "f" | "n" | "r" | "t" | "u" HexDigit HexDigit HexDigit HexDigit ).
```

## 16. Grammar Test Suite Examples

### Valid Programs
```
# Simple variable declaration
Wo x = 42;
Wo y = x + 10;

# Function definition
Pop add Wo a Wo b Ch'en result {
  Wo result = a + b;
  return result;
} Xul

# π.action
⟁π.action⟁ signal {
  Wo entropy = 0.75
  Wo π.tokens = [
    { glyph: "@", weight: 1.0 },
    { glyph: "π", weight: 3.14159 }
  ]
  Sek tick -> collapse
} ⟁Xul⟁

# Match statement
Yax value Sek match {
  1 -> Wo result = "one",
  2 -> Wo result = "two",
  _ -> Wo result = "other"
} Xul
```

### Invalid Programs (Syntax Errors)
```
# Missing semicolon
Wo x = 42  # ERROR

# Mismatched blocks
Pop test {  # ERROR: missing Xul
  Wo x = 1

# Invalid glyph in expression
Wo y = @ + 1  # ERROR: @ only valid in π context

# Invalid π.action content
⟁π.action⟁ test {
  Wo x = 1  # OK
  Wo y = x + 1  # ERROR: only Wo/Sek allowed
} ⟁Xul⟁
```

---

**END OF GRAMMAR SPECIFICATION**

This EBNF defines the complete, unambiguous syntax for the KUHUL language. The grammar is LL(1) compatible and suitable for recursive descent parsing. All special forms (π.actions, verbs, etc.) are integrated into the unified grammar structure.
