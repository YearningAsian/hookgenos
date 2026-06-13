export { generateHooks, generateHooksSync, generateHooksWithAI } from './generator';
export { TEMPLATES, getTemplates } from './templates';
export { teardownHook, remixHook, scoreFactors, analyzeAnatomy } from './teardown';
export type { Hook, HookType, Platform, Tone, GenerateOptions, Template } from './types';
export type {
  Teardown,
  TeardownInput,
  AnatomySegment,
  ScoreFactor,
  RemixVariant,
} from './teardown';
