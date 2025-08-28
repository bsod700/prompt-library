/**
 * Template management service
 * Handles CRUD operations for prompt templates with validation
 */

import { 
  getStorageValue, 
  setStorageValue, 
  getExtensionState 
} from './storage.js';
import { STORAGE_KEYS, DEFAULT_TEMPLATES } from '../constants/schema.js';
import { validateTemplate } from '../utils/template.js';

/**
 * Get all templates from storage
 * @returns {Promise<Array>} - Array of template objects
 */
export async function getTemplates() {
  try {
    const templates = await getStorageValue(STORAGE_KEYS.TEMPLATES, DEFAULT_TEMPLATES);
    return Array.isArray(templates) ? templates : DEFAULT_TEMPLATES;
  } catch (error) {
    console.error('Failed to get templates:', error);
    return DEFAULT_TEMPLATES;
  }
}

/**
 * Save templates to storage
 * @param {Array} templates - Array of template objects
 * @returns {Promise<void>}
 */
export async function saveTemplates(templates) {
  try {
    if (!Array.isArray(templates)) {
      throw new Error('Templates must be an array');
    }
    
    // Validate each template
    const validationResults = templates.map(template => ({
      template,
      validation: validateTemplate(template)
    }));
    
    const invalidTemplates = validationResults.filter(result => !result.validation.isValid);
    
    if (invalidTemplates.length > 0) {
      const errors = invalidTemplates.map(result => 
        `Template "${result.template.name || result.template.id}": ${result.validation.errors.join(', ')}`
      );
      throw new Error(`Invalid templates found:\n${errors.join('\n')}`);
    }
    
    await setStorageValue(STORAGE_KEYS.TEMPLATES, templates);
  } catch (error) {
    console.error('Failed to save templates:', error);
    throw error;
  }
}

/**
 * Get a single template by ID
 * @param {string} templateId - Template ID to find
 * @returns {Promise<Object|null>} - Template object or null if not found
 */
export async function getTemplateById(templateId) {
  try {
    const templates = await getTemplates();
    return templates.find(template => template.id === templateId) || null;
  } catch (error) {
    console.error(`Failed to get template with ID "${templateId}":`, error);
    return null;
  }
}

/**
 * Add a new template
 * @param {Object} template - Template object to add
 * @returns {Promise<Object>} - Added template with generated ID
 */
export async function addTemplate(template) {
  try {
    const validation = validateTemplate(template);
    if (!validation.isValid) {
      throw new Error(`Invalid template: ${validation.errors.join(', ')}`);
    }
    
    const templates = await getTemplates();
    
    // Generate unique ID if not provided
    if (!template.id) {
      template.id = crypto.randomUUID();
    }
    
    // Check for duplicate ID
    if (templates.some(t => t.id === template.id)) {
      throw new Error(`Template with ID "${template.id}" already exists`);
    }
    
    // Check for duplicate name
    if (templates.some(t => t.name === template.name)) {
      throw new Error(`Template with name "${template.name}" already exists`);
    }
    
    templates.push(template);
    await saveTemplates(templates);
    
    return template;
  } catch (error) {
    console.error('Failed to add template:', error);
    throw error;
  }
}

/**
 * Update an existing template
 * @param {string} templateId - ID of template to update
 * @param {Object} updates - Object with fields to update
 * @returns {Promise<Object>} - Updated template
 */
export async function updateTemplate(templateId, updates) {
  try {
    const templates = await getTemplates();
    const templateIndex = templates.findIndex(t => t.id === templateId);
    
    if (templateIndex === -1) {
      throw new Error(`Template with ID "${templateId}" not found`);
    }
    
    // Create updated template
    const updatedTemplate = { ...templates[templateIndex], ...updates };
    
    // Validate updated template
    const validation = validateTemplate(updatedTemplate);
    if (!validation.isValid) {
      throw new Error(`Invalid template after update: ${validation.errors.join(', ')}`);
    }
    
    // Check for duplicate name (excluding current template)
    const nameConflict = templates.some(t => 
      t.id !== templateId && t.name === updatedTemplate.name
    );
    if (nameConflict) {
      throw new Error(`Template with name "${updatedTemplate.name}" already exists`);
    }
    
    templates[templateIndex] = updatedTemplate;
    await saveTemplates(templates);
    
    return updatedTemplate;
  } catch (error) {
    console.error(`Failed to update template with ID "${templateId}":`, error);
    throw error;
  }
}

/**
 * Delete a template by ID
 * @param {string} templateId - ID of template to delete
 * @returns {Promise<boolean>} - True if template was deleted
 */
export async function deleteTemplate(templateId) {
  try {
    const templates = await getTemplates();
    const templateIndex = templates.findIndex(t => t.id === templateId);
    
    if (templateIndex === -1) {
      throw new Error(`Template with ID "${templateId}" not found`);
    }
    
    templates.splice(templateIndex, 1);
    await saveTemplates(templates);
    
    return true;
  } catch (error) {
    console.error(`Failed to delete template with ID "${templateId}":`, error);
    throw error;
  }
}

/**
 * Duplicate a template
 * @param {string} templateId - ID of template to duplicate
 * @returns {Promise<Object>} - New duplicated template
 */
export async function duplicateTemplate(templateId) {
  try {
    const originalTemplate = await getTemplateById(templateId);
    if (!originalTemplate) {
      throw new Error(`Template with ID "${templateId}" not found`);
    }
    
    const duplicatedTemplate = {
      ...originalTemplate,
      id: crypto.randomUUID(),
      name: `${originalTemplate.name} (Copy)`
    };
    
    return await addTemplate(duplicatedTemplate);
  } catch (error) {
    console.error(`Failed to duplicate template with ID "${templateId}":`, error);
    throw error;
  }
}

/**
 * Export templates as JSON
 * @returns {Promise<string>} - JSON string of templates
 */
export async function exportTemplates() {
  try {
    const templates = await getTemplates();
    return JSON.stringify(templates, null, 2);
  } catch (error) {
    console.error('Failed to export templates:', error);
    throw error;
  }
}

/**
 * Import templates from JSON
 * @param {string} jsonString - JSON string containing templates
 * @returns {Promise<Array>} - Array of imported templates
 */
export async function importTemplates(jsonString) {
  try {
    let templates;
    try {
      templates = JSON.parse(jsonString);
    } catch (parseError) {
      throw new Error('Invalid JSON format');
    }
    
    if (!Array.isArray(templates)) {
      throw new Error('Templates must be an array');
    }
    
    // Validate all templates
    const validationResults = templates.map(template => ({
      template,
      validation: validateTemplate(template)
    }));
    
    const invalidTemplates = validationResults.filter(result => !result.validation.isValid);
    
    if (invalidTemplates.length > 0) {
      const errors = invalidTemplates.map(result => 
        `Template "${result.template.name || result.template.id}": ${result.validation.errors.join(', ')}`
      );
      throw new Error(`Invalid templates found:\n${errors.join('\n')}`);
    }
    
    // Generate new IDs for imported templates to avoid conflicts
    const importedTemplates = templates.map(template => ({
      ...template,
      id: crypto.randomUUID()
    }));
    
    // Save imported templates
    await saveTemplates(importedTemplates);
    
    return importedTemplates;
  } catch (error) {
    console.error('Failed to import templates:', error);
    throw error;
  }
}

/**
 * Reset templates to defaults
 * @returns {Promise<Array>} - Default templates
 */
export async function resetToDefaults() {
  try {
    await saveTemplates(DEFAULT_TEMPLATES);
    return DEFAULT_TEMPLATES;
  } catch (error) {
    console.error('Failed to reset templates to defaults:', error);
    throw error;
  }
}
