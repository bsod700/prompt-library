/**
 * Template processing utilities
 * Handles variable substitution and text building
 */

/**
 * Fill template variables with provided values
 * @param {string} template - Template string with {{variables}}
 * @param {Object} variables - Object mapping variable keys to values
 * @returns {string} - Template with variables filled
 */
export function fillTemplateVariables(template, variables = {}) {
  if (!template || typeof template !== 'string') {
    return '';
  }
  
  return template.replace(/{{\s*([\w.-]+)\s*}}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(variables, key) 
      ? String(variables[key]) 
      : match; // Keep original placeholder if variable not found
  });
}

/**
 * Build complete prompt text from template, variables, tune, and prefix
 * @param {Object} template - Template object
 * @param {Object} variables - Variable values
 * @param {string} tune - Selected tune preset
 * @param {string} prefix - Optional prefix text
 * @param {Object} tunePresets - Available tune presets
 * @returns {string} - Complete prompt text
 */
export function buildPromptText(template, variables, tune, prefix, tunePresets) {
  if (!template || !template.body) {
    return '';
  }
  
  const parts = [];
  
  // Add prefix if provided
  if (prefix && prefix.trim()) {
    parts.push(prefix.trim());
  }
  
  // Add tune snippet if selected
  if (tune && tune !== 'neutral' && tunePresets[tune]) {
    const tuneSnippet = tunePresets[tune].snippet;
    if (tuneSnippet && tuneSnippet.trim()) {
      parts.push(tuneSnippet.trim());
    }
  }
  
  // Add filled template body
  const filledBody = fillTemplateVariables(template.body, variables);
  if (filledBody.trim()) {
    parts.push(filledBody.trim());
  }
  
  return parts.filter(Boolean).join('\n\n');
}

/**
 * Extract variable keys from template body
 * @param {string} templateBody - Template body text
 * @returns {string[]} - Array of variable keys found
 */
export function extractVariableKeys(templateBody) {
  if (!templateBody || typeof templateBody !== 'string') {
    return [];
  }
  
  const matches = templateBody.match(/{{\s*([\w.-]+)\s*}}/g) || [];
  return [...new Set(matches.map(match => match.replace(/[{}]/g, '').trim()))];
}

/**
 * Validate template structure
 * @param {Object} template - Template object to validate
 * @returns {Object} - Validation result with isValid and errors
 */
export function validateTemplate(template) {
  const errors = [];
  
  if (!template || typeof template !== 'object') {
    return { isValid: false, errors: ['Template must be an object'] };
  }
  
  if (!template.id || typeof template.id !== 'string') {
    errors.push('Template must have a valid string ID');
  }
  
  if (!template.name || typeof template.name !== 'string') {
    errors.push('Template must have a valid string name');
  }
  
  if (!template.body || typeof template.body !== 'string') {
    errors.push('Template must have a valid string body');
  }
  
  if (!Array.isArray(template.variables)) {
    errors.push('Template variables must be an array');
  } else {
    template.variables.forEach((variable, index) => {
      if (!variable || typeof variable !== 'object') {
        errors.push(`Variable at index ${index} must be an object`);
      } else if (!variable.key || typeof variable.key !== 'string') {
        errors.push(`Variable at index ${index} must have a valid string key`);
      } else {
        // Optional fields validation
        if (variable.type && !['text', 'select'].includes(variable.type)) {
          errors.push(`Variable "${variable.key}" has invalid type (expected 'text' or 'select')`);
        }
        if (variable.type === 'select') {
          if (!Array.isArray(variable.options)) {
            errors.push(`Variable "${variable.key}" options must be an array when type is 'select'`);
          } else if (!variable.options.every(opt => typeof opt === 'string')) {
            errors.push(`Variable "${variable.key}" options must be strings`);
          }
        }
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
