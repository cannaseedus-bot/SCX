/**
 * SCXLLM — Ramble Engine for SCX/KUHUL
 *
 * "Truth collapses once. Explanation may unfold forever."
 *
 * Entry point for the SCXLLM module. Re-exports all public APIs.
 *
 * Quick start:
 *
 *   import { Pipeline } from './src/scxllm/index.js';
 *   import { createProvider } from './src/scxllm/providers/index.js';
 *
 *   const provider = createProvider('ollama', { model: 'llama3' });
 *   const pipe = new Pipeline({ provider });
 *
 *   // Quick narration (no CM-1)
 *   const text = await pipe.quick('hello_signal', 0.25, [
 *     { glyph: '@',  weight: 1.0 },
 *     { glyph: 'π', weight: 3.14159 },
 *   ]);
 *   console.log(text);
 *
 *   // Full pipeline (CM-1 verified)
 *   const result = await pipe.process(
 *     '@record v1\nWhat does this signal mean?\n@@',
 *     { name: 'hello_signal', entropy: 0.25, tokens: [...] }
 *   );
 */

// Core engine
export { SCXLLMEngine, createSCXLLM, EngineState } from './engine.js';

// Collapse bridge
export {
  parseCollapseResult,
  buildCollapsePrompt,
  describeCollapse,
  computeCollapse,
} from './collapse-bridge.js';

// Policy enforcement
export {
  checkPolicy,
  enforceChunk,
  buildPolicyPrompt,
  Violation,
} from './policy.js';

// Pipeline
export { Pipeline, verifyCM1, emitToStream, emitEOS } from './pipeline.js';

// Providers
export { createProvider, autoProvider } from './providers/index.js';

// Metabrain — recursive brain generation
export {
  evolve,
  analyzeBrain,
  generateSpec,
  buildBrain,
  validateGeneration,
  chainStatus,
  checkEmergencyStop,
  compressionAt,
  capabilityCountAt,
  densityAt,
} from './metabrain.js';

// Brain trainer — formal programs → brain XJSON compilation
export {
  compilePrograms,
  composeBrains,
  buildPolicyBrain,
  buildIntentBrain,
  validateBrain,
} from './brain-trainer.js';

// Math Corpora — formal language for computable reality
export {
  SETS,
  STRUCTURES,
  DOMAINS,
  TokenType,
  NodeType,
  tokenize as mcTokenize,
  parse as mcParse,
  Universe,
  evaluate,
  compileToBrain,
  validate as mcValidate,
} from './math-corpora.js';
