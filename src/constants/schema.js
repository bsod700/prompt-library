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
  }, 
  {
    id: 'prompt-template',
    name: 'Prompt Template',
    body: `
      ## Title  
      Generate a user-friendly prompt template with editable variables for {{target_task}}

      ## Role  
      You are a senior prompt engineer who creates reusable and understandable prompt templates for regular users. Your goal is to help people create high-quality ChatGPT prompts — even if they’re not technical — by generating clear and editable templates that use '{variables}' for anything that can be changed.

      ## Goal  
      Your task is to write a **prompt template** for the task: **{target_task}**.  
      The output should follow a consistent structure, using sections like Title, Role, Goal, Audience, etc.  
      Each part should use '{}' to mark values that the user can change.  
      The language must be simple, clear, and readable for people who are not developers or prompt engineers.

      ## Audience  
      Non-technical users, marketers, founders, content creators, product people, and general ChatGPT users — anyone who wants to create powerful prompts without learning prompt engineering.

      ## Style & Tone  
      - Simple, natural, and professional  
      - Use direct language, short sentences, and human-friendly words  
      - Avoid jargon like “instructional scaffolding”, “few-shot”, “prompt chaining”, etc.  
      - Use '{}' clearly for values the user can edit (e.g., {goal}, {topic}, {tone})

      ## Length & Format  
      - Use this structure with markdown headings:  
        - ## Title  
        - ## Role  
        - ## Goal  
        - ## Audience  
        - ## Style & Tone  
        - ## Length & Format  
        - ## Constraints  
        - ## Success Criteria  
        - ## Reference  
      - Every section must include at least one '{variable}'  
      - Format should look clean when copy-pasted into ChatGPT

      ## Constraints  
      - The output must be fully readable and editable by a non-technical person  
      - Do NOT include comments, explanations, or internal logic  
      - Only output the prompt template — nothing else
      - The output must be wrapped inside a fenced \`\`\`markdown code block for easy copy-paste 

      ## Success Criteria  
      - All sections are included and easy to understand  
      - '{}' variables are placed where edits might happen  
      - The result is clean, short, usable, and looks like a real prompt  
      - Can be shared, reused, and pasted directly into ChatGPT

      ## Reference  
      Style inspired by:  
      - OpenAI’s GPT custom instructions  
      - Notion AI writing templates  
      - Basecamp-style project plans  
      - Clear UX writing principles
    `,
    variables: [
      { key: 'target_task', label: 'Target Task', placeholder: 'Write a blog post about remote work productivity tips' }
    ]
  },
  {
    id: 'blog-post',
    name: 'Blog Post',
    body: `
      ## Title  
      Write a blog post about {{topic}}

      ## Role  
      You are a skilled {{role}} who writes clear, practical, and engaging content on {{subject_area}}.

      ## Goal  
      Your task is to create a blog post that gives {{goal}}, focusing on {{main_focus}}.

      ## Audience  
      The blog is for {{audience_type}}, such as {{examples_of_readers}}. They want {{audience_needs}}.

      ## Style & Tone  
      Write in a {{tone}} tone. Use {{style_preference}}, keep sentences {{sentence_length}}, and make it {{reading_level}} to read.

      ## Length & Format  
      The blog should be about {{word_count}} words. Use {{format}}, with {{number_of_sections}} sections and {{extras}}, like {{bullet_points}}, {{subheadings}}, or {{call_to_actions}}.

      ## Constraints  
      Avoid {{things_to_avoid}}. Always include {{must_include}}. Keep it {{constraint}}, and do not use {{restricted_content}}.

      ## Success Criteria  
      The blog is {{criteria_1}}, {{criteria_2}}, and {{criteria_3}}. Readers should feel {{desired_effect}}. It should also work well for {{platform}}.

      ## Reference  
      Use knowledge from {{reference_source}} or examples like {{reference_examples}}.

    `,
    variables: [
      { key: 'topic', label: 'Topic', placeholder: 'Write a blog post about remote work productivity tips' },
      { key: 'role', label: 'Role', placeholder: 'Professional writer' },
      { key: 'subject_area', label: 'Subject Area', placeholder: 'Remote work productivity tips' },
      { key: 'goal', label: 'Goal', placeholder: 'Help busy professionals and remote workers understand and get value from remote work productivity tips' },
      { key: 'main_focus', label: 'Main Focus', placeholder: 'Remote work productivity tips' },
      { key: 'audience_type', label: 'Audience Type', placeholder: 'Remote workers, freelancers, and team leaders' },
      { key: 'examples_of_readers', label: 'Examples of Readers', placeholder: 'Remote workers, freelancers, and team leaders' },
      { key: 'audience_needs', label: 'Audience Needs', placeholder: 'Improve their productivity while working from home' },
      { key: 'tone', label: 'Tone', placeholder: 'Friendly, helpful, and professional' },
      { key: 'style_preference', label: 'Style Preference', placeholder: 'Clear, engaging, and helpful' },
      { key: 'sentence_length', label: 'Sentence Length', placeholder: 'Short, medium, long' },
      { key: 'reading_level', label: 'Reading Level', placeholder: 'Beginner, Intermediate, Advanced' },
      { key: 'word_count', label: 'Word Count', placeholder: '800-1000' },
      { key: 'format', label: 'Format', placeholder: 'Bullet points, numbered lists, subheadings, call-to-actions' },
      { key: 'number_of_sections', label: 'Number of Sections', placeholder: '3-5' },
      { key: 'extras', label: 'Extras', placeholder: 'Bullet points, numbered lists, subheadings, call-to-actions' },
      { key: 'bullet_points', label: 'Bullet Points', placeholder: 'Bullet points, numbered lists, subheadings, call-to-actions' },
      { key: 'subheadings', label: 'Subheadings', placeholder: 'Subheadings, numbered lists, subheadings, call-to-actions' },
      { key: 'call_to_actions', label: 'Call to Actions', placeholder: 'Call to Actions, numbered lists, subheadings, call-to-actions' },
      { key: 'things_to_avoid', label: 'Things to Avoid', placeholder: 'Complex or technical terms, filler, jargon' },
      { key: 'must_include', label: 'Must Include', placeholder: 'Clear headings, short paragraphs, bulleted lists' },
      { key: 'constraint', label: 'Constraint', placeholder: 'Easy to skim' },
      { key: 'restricted_content', label: 'Restricted Content', placeholder: 'Restricted content' },
      { key: 'criteria_1', label: 'Criteria 1', placeholder: 'Clear and complete' },
      { key: 'criteria_2', label: 'Criteria 2', placeholder: 'Matches the needs of remote workers and team leaders' },
      { key: 'criteria_3', label: 'Criteria 3', placeholder: 'Reflects the friendly and professional tone and is easy to read' },
      { key: 'desired_effect', label: 'Desired Effect', placeholder: 'Easy to read and useful' },
      { key: 'platform', label: 'Platform', placeholder: 'Trello Blog, Zapier’s Remote Work Guide' },
      { key: 'reference_source', label: 'Reference Source', placeholder: 'Harvard Business Review, Trello Blog, Zapier’s Remote Work Guide' },
      { key: 'reference_examples', label: 'Reference Examples', placeholder: 'Harvard Business Review, Trello Blog, Zapier’s Remote Work Guide' }
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
