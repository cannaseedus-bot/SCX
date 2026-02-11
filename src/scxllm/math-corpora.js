/**
 * MATH-CORPORA — Formal Language for Computable Reality
 *
 * Gives brains the ability to TALK — not just store weights, but express
 * states, transitions, constraints, proofs, fields, and meta-rules in a
 * mathematically grounded formal language.
 *
 * Layers:
 *   Law     → what is allowed
 *   Theory  → what the system IS
 *   Corpus  → the semantic universe (sets, relations, equations)
 *   Grammar → the syntactic universe (EBNF → AST → evaluation)
 *
 * Together: a formal language of causally verifiable state-transition systems.
 */

import crypto from 'crypto';

// ══════════════════════════════════════════════════════════════════
// I. MATHEMATICAL CORPUS — the axiomatic substrate
// ══════════════════════════════════════════════════════════════════

/**
 * Core mathematical sets the system assumes exist.
 */
export const SETS = {
  S: { name: 'State space',                 symbol: 'S' },
  T: { name: 'Transition operators',        symbol: 'T' },
  C: { name: 'Constraints (invariants)',     symbol: 'C' },
  P: { name: 'Proof objects (commitments)',  symbol: 'P' },
  F: { name: 'Fields (vector influences)',   symbol: 'F' },
  M: { name: 'Micronaut operators',          symbol: 'M' },
  H: { name: 'Histories (transition chains)',symbol: 'H' },
};

/**
 * Algebraic structures used by the system.
 */
export const STRUCTURES = {
  monoid:       { name: 'Monoid',        role: 'sequential composition of transitions' },
  graph:        { name: 'Graph',         role: 'state space topology' },
  vectorSpace:  { name: 'Vector space',  role: 'embedding geometry' },
  partialOrder: { name: 'Partial order', role: 'causality ordering' },
  category:     { name: 'Category',      role: 'universes + morphisms (bridges)' },
  merkleTree:   { name: 'Merkle tree',   role: 'commitment hierarchy' },
};

/**
 * Theoretical domain bindings.
 */
export const DOMAINS = {
  arbitration: 'vector_decomposition',
  memory:      'attractor_dynamics',
  learning:    'gradient_flow',
  proof:       'hash_commitments',
  federation:  'category_morphisms',
  stability:   'lyapunov_theory',
};

// ══════════════════════════════════════════════════════════════════
// II. TOKENIZER — lexical analysis for the formal language
// ══════════════════════════════════════════════════════════════════

/**
 * Token types for the formal language.
 */
export const TokenType = {
  // Keywords
  STATE:       'STATE',
  TRANSITION:  'TRANSITION',
  CONSTRAINT:  'CONSTRAINT',
  FIELD:       'FIELD',
  MICRONAUT:   'MICRONAUT',
  PROOF:       'PROOF',
  ARBITRATION: 'ARBITRATION',
  META:        'META',
  HASH:        'HASH',
  UPDATE:      'UPDATE',

  // Delimiters
  LBRACE:  'LBRACE',
  RBRACE:  'RBRACE',
  LPAREN:  'LPAREN',
  RPAREN:  'RPAREN',
  LBRACK:  'LBRACK',
  RBRACK:  'RBRACK',
  COLON:   'COLON',
  COMMA:   'COMMA',
  ARROW:   'ARROW',
  EQUALS:  'EQUALS',
  SEMI:    'SEMI',

  // Literals
  IDENTIFIER: 'IDENTIFIER',
  NUMBER:     'NUMBER',

  // End
  EOF: 'EOF',
};

const KEYWORDS = new Map([
  ['state',       TokenType.STATE],
  ['transition',  TokenType.TRANSITION],
  ['constraint',  TokenType.CONSTRAINT],
  ['field',       TokenType.FIELD],
  ['micronaut',   TokenType.MICRONAUT],
  ['proof',       TokenType.PROOF],
  ['arbitration', TokenType.ARBITRATION],
  ['meta',        TokenType.META],
  ['hash',        TokenType.HASH],
  ['update',      TokenType.UPDATE],
]);

/**
 * Tokenize formal language source into token stream.
 *
 * @param {string} source
 * @returns {Object[]} tokens — array of { type, value, line, col }
 */
export function tokenize(source) {
  const tokens = [];
  let pos = 0;
  let line = 1;
  let col = 1;

  while (pos < source.length) {
    const ch = source[pos];

    // Whitespace
    if (/\s/.test(ch)) {
      if (ch === '\n') { line++; col = 1; } else { col++; }
      pos++;
      continue;
    }

    // Comments (// to end of line)
    if (ch === '/' && source[pos + 1] === '/') {
      while (pos < source.length && source[pos] !== '\n') pos++;
      continue;
    }

    // Arrow ->
    if (ch === '-' && source[pos + 1] === '>') {
      tokens.push({ type: TokenType.ARROW, value: '->', line, col });
      pos += 2; col += 2;
      continue;
    }

    // Single-char delimiters
    const singles = {
      '{': TokenType.LBRACE, '}': TokenType.RBRACE,
      '(': TokenType.LPAREN, ')': TokenType.RPAREN,
      '[': TokenType.LBRACK, ']': TokenType.RBRACK,
      ':': TokenType.COLON,  ',': TokenType.COMMA,
      '=': TokenType.EQUALS, ';': TokenType.SEMI,
    };

    if (singles[ch]) {
      tokens.push({ type: singles[ch], value: ch, line, col });
      pos++; col++;
      continue;
    }

    // Numbers
    if (/[0-9]/.test(ch) || (ch === '-' && /[0-9]/.test(source[pos + 1]))) {
      let num = '';
      const startCol = col;
      if (ch === '-') { num += '-'; pos++; col++; }
      while (pos < source.length && /[0-9.]/.test(source[pos])) {
        num += source[pos]; pos++; col++;
      }
      tokens.push({ type: TokenType.NUMBER, value: parseFloat(num), line, col: startCol });
      continue;
    }

    // Identifiers and keywords
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = '';
      const startCol = col;
      while (pos < source.length && /[a-zA-Z0-9_]/.test(source[pos])) {
        ident += source[pos]; pos++; col++;
      }
      const keyword = KEYWORDS.get(ident.toLowerCase());
      tokens.push({
        type: keyword || TokenType.IDENTIFIER,
        value: keyword ? ident.toLowerCase() : ident,
        line, col: startCol,
      });
      continue;
    }

    // Skip unknown characters
    pos++; col++;
  }

  tokens.push({ type: TokenType.EOF, value: null, line, col });
  return tokens;
}

// ══════════════════════════════════════════════════════════════════
// III. PARSER — EBNF grammar → AST
// ══════════════════════════════════════════════════════════════════

/**
 * AST node types.
 */
export const NodeType = {
  PROGRAM:     'Program',
  STATE:       'StateDecl',
  TRANSITION:  'TransitionDecl',
  CONSTRAINT:  'ConstraintDecl',
  FIELD:       'FieldDecl',
  MICRONAUT:   'MicronautDecl',
  PROOF:       'ProofDecl',
  ARBITRATION: 'ArbitrationDecl',
  META:        'MetaDecl',
  PROPERTY:    'Property',
  VECTOR:      'VectorExpr',
  CALL:        'CallExpr',
  HASH:        'HashExpr',
  UPDATE:      'UpdateExpr',
  IDENTIFIER:  'Identifier',
  NUMBER:      'NumberLiteral',
};

/**
 * Parse a token stream into an AST.
 *
 * @param {Object[]} tokens
 * @returns {Object} AST root node
 */
export function parse(tokens) {
  let pos = 0;

  function peek() { return tokens[pos]; }
  function advance() { return tokens[pos++]; }

  function expect(type) {
    const tok = advance();
    if (tok.type !== type) {
      throw new SyntaxError(
        `Expected ${type} but got ${tok.type} ("${tok.value}") at line ${tok.line}:${tok.col}`
      );
    }
    return tok;
  }

  function match(type) {
    if (peek().type === type) { advance(); return true; }
    return false;
  }

  // ── Expression parsing ──────────────────────────────

  function parseExpression() {
    const tok = peek();

    // Vector: [1, 2, 3]
    if (tok.type === TokenType.LBRACK) {
      return parseVector();
    }

    // hash(...)
    if (tok.type === TokenType.HASH) {
      return parseHashExpr();
    }

    // update(...)
    if (tok.type === TokenType.UPDATE) {
      return parseUpdateExpr();
    }

    // Number
    if (tok.type === TokenType.NUMBER) {
      advance();
      return { type: NodeType.NUMBER, value: tok.value };
    }

    // Identifier or function call
    if (tok.type === TokenType.IDENTIFIER) {
      const name = advance();
      if (peek().type === TokenType.LPAREN) {
        return parseCall(name.value);
      }
      return { type: NodeType.IDENTIFIER, name: name.value };
    }

    // Parenthesized expression
    if (tok.type === TokenType.LPAREN) {
      advance();
      const expr = parseExpression();
      expect(TokenType.RPAREN);
      return expr;
    }

    throw new SyntaxError(
      `Unexpected token ${tok.type} ("${tok.value}") at line ${tok.line}:${tok.col}`
    );
  }

  function parseVector() {
    expect(TokenType.LBRACK);
    const elements = [];
    if (peek().type !== TokenType.RBRACK) {
      elements.push(parseExpression());
      while (match(TokenType.COMMA)) {
        elements.push(parseExpression());
      }
    }
    expect(TokenType.RBRACK);
    return { type: NodeType.VECTOR, elements };
  }

  function parseCall(name) {
    expect(TokenType.LPAREN);
    const args = [];
    if (peek().type !== TokenType.RPAREN) {
      args.push(parseExpression());
      while (match(TokenType.COMMA)) {
        args.push(parseExpression());
      }
    }
    expect(TokenType.RPAREN);
    return { type: NodeType.CALL, name, args };
  }

  function parseHashExpr() {
    expect(TokenType.HASH);
    expect(TokenType.LPAREN);
    const expr = parseExpression();
    expect(TokenType.RPAREN);
    return { type: NodeType.HASH, expr };
  }

  function parseUpdateExpr() {
    expect(TokenType.UPDATE);
    expect(TokenType.LPAREN);
    const target = expect(TokenType.IDENTIFIER);
    expect(TokenType.COMMA);
    const value = parseExpression();
    expect(TokenType.RPAREN);
    return { type: NodeType.UPDATE, target: target.value, value };
  }

  // ── Statement parsing ──────────────────────────────

  function parseStateDecl() {
    expect(TokenType.STATE);
    const name = expect(TokenType.IDENTIFIER);
    expect(TokenType.LBRACE);
    const properties = [];
    while (peek().type !== TokenType.RBRACE && peek().type !== TokenType.EOF) {
      const propName = expect(TokenType.IDENTIFIER);
      expect(TokenType.EQUALS);
      const propValue = parseExpression();
      properties.push({ type: NodeType.PROPERTY, name: propName.value, value: propValue });
      match(TokenType.SEMI); // optional semicolons
    }
    expect(TokenType.RBRACE);
    return { type: NodeType.STATE, name: name.value, properties };
  }

  function parseTransitionDecl() {
    expect(TokenType.TRANSITION);
    const name = expect(TokenType.IDENTIFIER);
    expect(TokenType.COLON);
    const from = expect(TokenType.IDENTIFIER);
    expect(TokenType.ARROW);
    const to = expect(TokenType.IDENTIFIER);
    return { type: NodeType.TRANSITION, name: name.value, from: from.value, to: to.value };
  }

  function parseConstraintDecl() {
    expect(TokenType.CONSTRAINT);
    const name = expect(TokenType.IDENTIFIER);
    expect(TokenType.COLON);
    const expr = parseExpression();
    return { type: NodeType.CONSTRAINT, name: name.value, expr };
  }

  function parseFieldDecl() {
    expect(TokenType.FIELD);
    const name = expect(TokenType.IDENTIFIER);
    expect(TokenType.COLON);
    const expr = parseExpression();
    return { type: NodeType.FIELD, name: name.value, expr };
  }

  function parseMicronautDecl() {
    expect(TokenType.MICRONAUT);
    const name = expect(TokenType.IDENTIFIER);
    expect(TokenType.COLON);
    const expr = parseExpression();
    return { type: NodeType.MICRONAUT, name: name.value, expr };
  }

  function parseProofDecl() {
    expect(TokenType.PROOF);
    const name = expect(TokenType.IDENTIFIER);
    expect(TokenType.COLON);
    const expr = parseExpression();
    return { type: NodeType.PROOF, name: name.value, expr };
  }

  function parseArbitrationDecl() {
    expect(TokenType.ARBITRATION);
    expect(TokenType.LBRACE);
    const rules = [];
    while (peek().type !== TokenType.RBRACE && peek().type !== TokenType.EOF) {
      const name = expect(TokenType.IDENTIFIER);
      expect(TokenType.EQUALS);
      const expr = parseExpression();
      rules.push({ name: name.value, expr });
      match(TokenType.COMMA);
      match(TokenType.SEMI);
    }
    expect(TokenType.RBRACE);
    return { type: NodeType.ARBITRATION, rules };
  }

  function parseMetaDecl() {
    expect(TokenType.META);
    const name = expect(TokenType.IDENTIFIER);
    expect(TokenType.COLON);
    const expr = parseExpression();
    return { type: NodeType.META, name: name.value, expr };
  }

  function parseStatement() {
    const tok = peek();
    switch (tok.type) {
      case TokenType.STATE:       return parseStateDecl();
      case TokenType.TRANSITION:  return parseTransitionDecl();
      case TokenType.CONSTRAINT:  return parseConstraintDecl();
      case TokenType.FIELD:       return parseFieldDecl();
      case TokenType.MICRONAUT:   return parseMicronautDecl();
      case TokenType.PROOF:       return parseProofDecl();
      case TokenType.ARBITRATION: return parseArbitrationDecl();
      case TokenType.META:        return parseMetaDecl();
      default:
        throw new SyntaxError(
          `Unexpected token ${tok.type} ("${tok.value}") at line ${tok.line}:${tok.col}`
        );
    }
  }

  // ── Program ─────────────────────────────────────────

  const statements = [];
  while (peek().type !== TokenType.EOF) {
    statements.push(parseStatement());
  }

  return { type: NodeType.PROGRAM, statements };
}

// ══════════════════════════════════════════════════════════════════
// IV. EVALUATOR — execute AST against a state universe
// ══════════════════════════════════════════════════════════════════

/**
 * A Universe holds all states, transitions, constraints, fields,
 * proofs, and histories. It is the runtime of the formal language.
 */
export class Universe {
  constructor() {
    this.states = {};        // S — name → { properties }
    this.transitions = {};   // T — name → { from, to }
    this.constraints = {};   // C — name → expr AST
    this.fields = {};        // F — name → vector/expr
    this.micronauts = {};    // M — name → operator expr
    this.proofs = {};        // P — name → hash/expr
    this.arbitrations = [];  // arbitration rule sets
    this.metas = {};         // meta rules
    this.history = [];       // H — ordered transition log
  }

  /**
   * Evaluate a parsed AST program, populating the universe.
   *
   * @param {Object} ast — from parse()
   * @returns {Universe} this
   */
  eval(ast) {
    for (const stmt of ast.statements) {
      this.evalStatement(stmt);
    }
    return this;
  }

  evalStatement(stmt) {
    switch (stmt.type) {
      case NodeType.STATE:
        this.states[stmt.name] = {};
        for (const prop of stmt.properties) {
          this.states[stmt.name][prop.name] = this.evalExpr(prop.value);
        }
        break;

      case NodeType.TRANSITION:
        this.transitions[stmt.name] = { from: stmt.from, to: stmt.to };
        break;

      case NodeType.CONSTRAINT:
        this.constraints[stmt.name] = stmt.expr;
        break;

      case NodeType.FIELD:
        this.fields[stmt.name] = this.evalExpr(stmt.expr);
        break;

      case NodeType.MICRONAUT:
        this.micronauts[stmt.name] = stmt.expr;
        break;

      case NodeType.PROOF:
        this.proofs[stmt.name] = this.evalExpr(stmt.expr);
        break;

      case NodeType.ARBITRATION:
        const rules = {};
        for (const rule of stmt.rules) {
          rules[rule.name] = this.evalExpr(rule.expr);
        }
        this.arbitrations.push(rules);
        break;

      case NodeType.META:
        this.metas[stmt.name] = stmt.expr;
        break;
    }
  }

  evalExpr(expr) {
    switch (expr.type) {
      case NodeType.NUMBER:
        return expr.value;

      case NodeType.IDENTIFIER:
        // Resolve from states
        for (const state of Object.values(this.states)) {
          if (state[expr.name] !== undefined) return state[expr.name];
        }
        return expr.name; // unresolved → return as symbol

      case NodeType.VECTOR:
        return expr.elements.map(e => this.evalExpr(e));

      case NodeType.CALL:
        return this.evalCall(expr.name, expr.args.map(a => this.evalExpr(a)));

      case NodeType.HASH: {
        const val = this.evalExpr(expr.expr);
        return crypto.createHash('sha256')
          .update(JSON.stringify(val))
          .digest('hex')
          .slice(0, 16);
      }

      case NodeType.UPDATE:
        return { _update: expr.target, value: this.evalExpr(expr.value) };

      default:
        return null;
    }
  }

  evalCall(name, args) {
    // Built-in functions
    switch (name) {
      case 'sum':    return args.reduce((a, b) => a + b, 0);
      case 'dot':    return args[0].reduce((s, v, i) => s + v * (args[1]?.[i] || 0), 0);
      case 'norm':   return Math.sqrt(args[0].reduce((s, v) => s + v * v, 0));
      case 'scale':  return args[0].map(v => v * args[1]);
      case 'add':    return args[0].map((v, i) => v + (args[1]?.[i] || 0));
      case 'mul':    return args[0] * args[1];
      case 'min':    return Math.min(...args);
      case 'max':    return Math.max(...args);
      case 'abs':    return Math.abs(args[0]);
      case 'sqrt':   return Math.sqrt(args[0]);
      case 'hash':
        return crypto.createHash('sha256')
          .update(JSON.stringify(args))
          .digest('hex')
          .slice(0, 16);
      default:
        return { _call: name, args };
    }
  }

  // ── State evolution ─────────────────────────────────

  /**
   * Apply a transition by name. Checks constraints, records proof,
   * and appends to history.
   *
   * S_{t+1} = M(S_t) + Σ_i w_i F_i(S_t)
   *
   * @param {string} transitionName
   * @returns {{ valid: boolean, proof: string|null, from: string, to: string }}
   */
  applyTransition(transitionName) {
    const trans = this.transitions[transitionName];
    if (!trans) {
      return { valid: false, proof: null, error: `Unknown transition: ${transitionName}` };
    }

    const fromState = this.states[trans.from];
    const toState = this.states[trans.to];

    if (!fromState) {
      return { valid: false, proof: null, error: `Source state not found: ${trans.from}` };
    }
    if (!toState) {
      return { valid: false, proof: null, error: `Target state not found: ${trans.to}` };
    }

    // Check constraints on target state
    const violations = this.checkConstraints(trans.to);
    if (violations.length > 0) {
      return { valid: false, proof: null, violations, from: trans.from, to: trans.to };
    }

    // Generate proof: P_t = HASH(S_t, S_{t+1}, transition_name)
    const proof = crypto.createHash('sha256')
      .update(JSON.stringify({ from: fromState, to: toState, transition: transitionName }))
      .digest('hex')
      .slice(0, 16);

    // Record in history
    this.history.push({
      transition: transitionName,
      from: trans.from,
      to: trans.to,
      proof,
      timestamp: Date.now(),
    });

    return { valid: true, proof, from: trans.from, to: trans.to };
  }

  /**
   * Check all constraints against a state.
   *
   * @param {string} stateName
   * @returns {string[]} violation names (empty = all pass)
   */
  checkConstraints(stateName) {
    const violations = [];
    // Constraints are stored as AST expressions
    // For now, all defined constraints pass if the state exists
    const state = this.states[stateName];
    if (!state) {
      violations.push(`state_not_found:${stateName}`);
    }
    return violations;
  }

  /**
   * Get the complete history chain.
   *
   * @returns {Object[]}
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Compute Merkle root of history (trust compression).
   *
   * R_archive = MerkleRoot({R_episode})
   *
   * @returns {string} hex hash
   */
  merkleRoot() {
    if (this.history.length === 0) return '0'.repeat(16);

    let hashes = this.history.map(h =>
      crypto.createHash('sha256').update(JSON.stringify(h)).digest('hex')
    );

    while (hashes.length > 1) {
      const next = [];
      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = hashes[i + 1] || left;
        next.push(
          crypto.createHash('sha256').update(left + right).digest('hex')
        );
      }
      hashes = next;
    }

    return hashes[0].slice(0, 16);
  }

  // ── Export to brain format ──────────────────────────

  /**
   * Export the universe as a brain XJSON.
   *
   * Converts states to entries, transitions to graph edges,
   * constraints to capabilities, and fields to supgram weights.
   *
   * @param {string} domain
   * @returns {Object} brain XJSON
   */
  toBrain(domain) {
    const entries = {};
    const nodes = {};
    const edges = [];
    let nodeId = 1;

    // States → entries + nodes
    for (const [name, props] of Object.entries(this.states)) {
      const nid = `N${nodeId++}`;
      nodes[nid] = { state: name };

      // Each property becomes a weighted entry
      for (const [prop, value] of Object.entries(props)) {
        const key = `${name}_${prop}`;
        entries[key] = typeof value === 'number' ? Math.min(Math.abs(value), 1.0) : 0.5;
      }
    }

    // Transitions → edges
    const stateNodes = {};
    for (const [nid, node] of Object.entries(nodes)) {
      stateNodes[node.state] = nid;
    }

    for (const [name, trans] of Object.entries(this.transitions)) {
      const fromNode = stateNodes[trans.from];
      const toNode = stateNodes[trans.to];
      if (fromNode && toNode) {
        edges.push({ from: fromNode, to: toNode, label: name, weight: 0.9 });
      }
    }

    // Fields → supgrams
    const supgrams = {};
    for (const [name, value] of Object.entries(this.fields)) {
      const sid = `S_FIELD_${name.toUpperCase()}`;
      supgrams[sid] = {
        members: [name],
        weight: Array.isArray(value) ? Math.min(Math.sqrt(value.reduce((s, v) => s + v * v, 0)), 1.0) : 0.5,
        field: value,
      };
    }

    // Capabilities from constraints + structures
    const capabilities = [
      'formal_language',
      'state_transition',
      'constraint_checking',
      'proof_generation',
      `domain_${domain}`,
    ];
    for (const cName of Object.keys(this.constraints)) {
      capabilities.push(`constraint_${cName}`);
    }

    const hash = crypto.createHash('sha256')
      .update(JSON.stringify({ entries, nodes, edges }))
      .digest('hex')
      .slice(0, 16);

    return {
      brain: {
        id: `brain.${domain}.formal`,
        version: '1.0.0',
        hash: `sha256:${hash}`,
        domain,
        created_at: new Date().toISOString(),
        source: 'math-corpora',
        law: 'DERIVED_FROM_FORMAL_LANGUAGE_SEALED_ON_EXPORT',
      },
      entries,
      supgrams,
      graph: { nodes, edges },
      capabilities,
      scxq2: {
        lanes: {
          '0': { name: 'syntax', min_weight: 0.3 },
          '1': { name: 'semantic', min_weight: 0.7 },
          '2': { name: 'assertion', min_weight: 0.9 },
        },
      },
      universe: {
        states: Object.keys(this.states).length,
        transitions: Object.keys(this.transitions).length,
        constraints: Object.keys(this.constraints).length,
        fields: Object.keys(this.fields).length,
        proofs: Object.keys(this.proofs).length,
        history_length: this.history.length,
        merkle_root: this.merkleRoot(),
      },
    };
  }
}

// ══════════════════════════════════════════════════════════════════
// V. CONVENIENCE API
// ══════════════════════════════════════════════════════════════════

/**
 * Parse and evaluate formal language source in one call.
 *
 * @param {string} source — formal language program text
 * @returns {Universe} populated universe
 */
export function evaluate(source) {
  const tokens = tokenize(source);
  const ast = parse(tokens);
  return new Universe().eval(ast);
}

/**
 * Parse formal language source and export as brain XJSON.
 *
 * @param {string} source — formal language program text
 * @param {string} domain — brain domain name
 * @returns {Object} brain XJSON
 */
export function compileToBrain(source, domain) {
  const universe = evaluate(source);
  return universe.toBrain(domain);
}

/**
 * Validate formal language source (parse without evaluating).
 *
 * @param {string} source
 * @returns {{ valid: boolean, error: string|null, ast: Object|null }}
 */
export function validate(source) {
  try {
    const tokens = tokenize(source);
    const ast = parse(tokens);
    return { valid: true, error: null, ast };
  } catch (err) {
    return { valid: false, error: err.message, ast: null };
  }
}

export default {
  SETS,
  STRUCTURES,
  DOMAINS,
  TokenType,
  NodeType,
  tokenize,
  parse,
  Universe,
  evaluate,
  compileToBrain,
  validate,
};
