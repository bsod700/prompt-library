/**
 * Tests for template utility functions
 */

import { 
  fillTemplateVariables, 
  buildPromptText, 
  extractVariableKeys,
  validateTemplate 
} from '../template.js';

describe('Template Utilities', () => {
  describe('fillTemplateVariables', () => {
    it('should fill variables in template', () => {
      const template = 'Hello {{name}}, welcome to {{platform}}!';
      const variables = { name: 'John', platform: 'ChatGPT' };
      
      const result = fillTemplateVariables(template, variables);
      expect(result).toBe('Hello John, welcome to ChatGPT!');
    });

    it('should keep placeholders for missing variables', () => {
      const template = 'Hello {{name}}, welcome to {{platform}}!';
      const variables = { name: 'John' };
      
      const result = fillTemplateVariables(template, variables);
      expect(result).toBe('Hello John, welcome to {{platform}}!');
    });

    it('should handle empty template', () => {
      const result = fillTemplateVariables('', { name: 'John' });
      expect(result).toBe('');
    });

    it('should handle null template', () => {
      const result = fillTemplateVariables(null, { name: 'John' });
      expect(result).toBe('');
    });
  });

  describe('buildPromptText', () => {
    const mockTemplate = {
      id: 'test',
      name: 'Test Template',
      body: 'Create content about {{topic}}',
      variables: [{ key: 'topic', label: 'Topic' }]
    };

    const mockTunePresets = {
      neutral: { name: 'Neutral', snippet: '' },
      concise: { name: 'Concise', snippet: 'Be brief and direct.' },
      analytical: { name: 'Analytical', snippet: 'Provide detailed analysis.' }
    };

    it('should build prompt with all components', () => {
      const result = buildPromptText(
        mockTemplate,
        { topic: 'AI' },
        'concise',
        'System: You are a helpful assistant.',
        mockTunePresets
      );
      
      expect(result).toBe('System: You are a helpful assistant.\n\nBe brief and direct.\n\nCreate content about AI');
    });

    it('should build prompt without prefix', () => {
      const result = buildPromptText(
        mockTemplate,
        { topic: 'AI' },
        'analytical',
        '',
        mockTunePresets
      );
      
      expect(result).toBe('Provide detailed analysis.\n\nCreate content about AI');
    });

    it('should build prompt with neutral tune', () => {
      const result = buildPromptText(
        mockTemplate,
        { topic: 'AI' },
        'neutral',
        '',
        mockTunePresets
      );
      
      expect(result).toBe('Create content about AI');
    });
  });

  describe('extractVariableKeys', () => {
    it('should extract variable keys from template', () => {
      const template = 'Hello {{name}}, welcome to {{platform}}! How is {{name}} doing?';
      const keys = extractVariableKeys(template);
      
      expect(keys).toEqual(['name', 'platform']);
    });

    it('should handle no variables', () => {
      const template = 'Hello world!';
      const keys = extractVariableKeys(template);
      
      expect(keys).toEqual([]);
    });

    it('should handle empty template', () => {
      const keys = extractVariableKeys('');
      expect(keys).toEqual([]);
    });
  });

  describe('validateTemplate', () => {
    it('should validate correct template', () => {
      const template = {
        id: 'test',
        name: 'Test Template',
        body: 'Test content',
        variables: [{ key: 'test', label: 'Test' }]
      };
      
      const result = validateTemplate(template);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject template without id', () => {
      const template = {
        name: 'Test Template',
        body: 'Test content',
        variables: []
      };
      
      const result = validateTemplate(template);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Template must have a valid string ID');
    });

    it('should reject template without name', () => {
      const template = {
        id: 'test',
        body: 'Test content',
        variables: []
      };
      
      const result = validateTemplate(template);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Template must have a valid string name');
    });

    it('should reject template without body', () => {
      const template = {
        id: 'test',
        name: 'Test Template',
        variables: []
      };
      
      const result = validateTemplate(template);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Template must have a valid string body');
    });

    it('should reject template with invalid variables', () => {
      const template = {
        id: 'test',
        name: 'Test Template',
        body: 'Test content',
        variables: [{ key: '', label: 'Test' }]
      };
      
      const result = validateTemplate(template);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Variable at index 0 must have a valid string key');
    });
  });
});
