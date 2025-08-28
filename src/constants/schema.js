/**
 * Storage schema and data structures
 * Single source of truth for all data models
 */

/**
 * Template structure for prompt templates
 */
export const TEMPLATE_SCHEMA = {
  id: 'string',           // Unique identifier
  name: 'string',         // Display name
  body: 'string',         // Template body with {{variables}}
  variables: 'array'      // Array of variable objects
};

/**
 * Variable structure within templates
 */
export const VARIABLE_SCHEMA = {
  key: 'string',          // Variable key (e.g., "topic")
  label: 'string',        // Display label (e.g., "Topic")
  placeholder: 'string'   // Optional placeholder text
};

/**
 * Tune preset options for different writing styles
 */
export const TUNE_PRESETS = {
  neutral: {
    name: 'Neutral',
    description: 'Standard, balanced response',
    snippet: ''
  },
  concise: {
    name: 'Concise',
    description: 'Short, direct sentences',
    snippet: 'Answer in short, direct sentences. Avoid filler.'
  },
  analytical: {
    name: 'Analytical',
    description: 'Structured reasoning approach',
    snippet: 'Give assumptions, constraints, and a step-by-step reasoning outline.'
  },
  creative: {
    name: 'Creative',
    description: 'Multiple angles with fresh metaphors',
    snippet: 'Offer 3 distinct angles with fresh metaphors.'
  },
  developer: {
    name: 'Developer',
    description: 'Explicit with production-ready code',
    snippet: 'Be explicit. Include minimal, production-grade code with comments when needed.'
  }
};

/**
 * Default templates provided with the extension
 */
export const DEFAULT_TEMPLATES = [
  {
    id: 'seo-brief',
    name: 'SEO Brief',
    body: 'Create an SEO content brief for {{topic}} targeting {{audience}}. Include H2s and FAQs.',
    variables: [
      { key: 'topic', label: 'Topic' },
      { key: 'audience', label: 'Audience' }
    ]
  },
  {
    id: 'code-review',
    name: 'Code Review',
    body: 'Review this {{stack}} code for performance, readability, and security. Suggest diffs.',
    variables: [
      { key: 'stack', label: 'Tech Stack', placeholder: 'Angular, NestJS' }
    ]
  }
];

/**
 * Storage keys used throughout the extension
 */
export const STORAGE_KEYS = {
  TEMPLATES: 'templates',
  VARIABLES: 'vars',
  TUNE: 'tune',
  PREFIX: 'prefix',
  AUTO_SEND: 'autoSend',
  LAST_TEMPLATE: 'lastTpl',
  DEBUG_MODE: 'debugMode',
  HIDE_BADGE: 'hideBadge'
};

/**
 * Default storage values
 */
export const DEFAULT_STORAGE = {
  [STORAGE_KEYS.TEMPLATES]: DEFAULT_TEMPLATES,
  [STORAGE_KEYS.VARIABLES]: {},
  [STORAGE_KEYS.TUNE]: 'neutral',
  [STORAGE_KEYS.PREFIX]: '',
  [STORAGE_KEYS.AUTO_SEND]: false,
  [STORAGE_KEYS.LAST_TEMPLATE]: 'seo-brief',
  [STORAGE_KEYS.DEBUG_MODE]: false,
  [STORAGE_KEYS.HIDE_BADGE]: false
};
