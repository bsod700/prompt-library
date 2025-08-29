/**
 * Options module for Prompt Library Chrome Extension
 * Handles template management and settings
 */

import { 
  getTemplates, 
  saveTemplates, 
  addTemplate, 
  updateTemplate, 
  deleteTemplate, 
  exportTemplates, 
  importTemplates,
  resetToDefaults 
} from '../services/templateManager.js';

/**
 * Options controller class
 */
class OptionsController {
  constructor() {
    this.templates = [];
    this.elements = {};
    
    this.initializeElements();
    this.bindEvents();
    this.loadTemplates();
  }

  /**
   * Initialize DOM element references
   */
  initializeElements() {
    this.elements = {
      add: document.getElementById('add'),
      export: document.getElementById('export'),
      importFile: document.getElementById('importFile'),
      reset: document.getElementById('reset'),
      rows: document.getElementById('rows'),
      status: document.getElementById('status')
    };
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Add template button
    this.elements.add.addEventListener('click', () => {
      this.addNewTemplate();
    });

    // Export button
    this.elements.export.addEventListener('click', () => {
      this.exportTemplates();
    });

    // Import file input
    this.elements.importFile.addEventListener('change', (event) => {
      this.importTemplatesFromFile(event);
    });

    // Reset to defaults button
    if (this.elements.reset) {
      this.elements.reset.addEventListener('click', () => {
        this.resetToDefaults();
      });
    }

    // Template row events (delegated)
    this.elements.rows.addEventListener('input', (event) => {
      this.handleTemplateInput(event);
    });

    this.elements.rows.addEventListener('click', (event) => {
      this.handleTemplateAction(event);
    });
  }

  /**
   * Load templates from storage
   */
  async loadTemplates() {
    try {
      this.templates = await getTemplates();
      this.renderTemplates();
      this.showStatus(`Loaded ${this.templates.length} templates`);
    } catch (error) {
      console.error('Failed to load templates:', error);
      this.showStatus('Failed to load templates', 'error');
    }
  }

  /**
   * Render templates in the table
   */
  renderTemplates() {
    if (!this.elements.rows) return;
    
    this.elements.rows.innerHTML = '';
    
    this.templates.forEach((template, index) => {
      const row = this.createTemplateRow(template, index);
      this.elements.rows.appendChild(row);
    });
  }

  /**
   * Create a template table row
   */
  createTemplateRow(template, index) {
    const row = document.createElement('tr');
    row.dataset.index = index;
    row.dataset.templateId = template.id;
    
    row.innerHTML = `
      <td>
        <input 
          value="${this.escapeHtml(template.name || '')}" 
          data-field="name" 
          data-index="${index}"
          placeholder="Template name"
        />
      </td>
      <td>
        <textarea 
          data-field="body" 
          data-index="${index}"
          placeholder="Template body with {{variables}}"
        >${this.escapeHtml(template.body || '')}</textarea>
      </td>
      <td>
        <textarea 
          data-field="variables" 
          data-index="${index}"
          placeholder='[{"key":"topic","label":"Topic"}]'
        >${this.escapeHtml(JSON.stringify(template.variables || [], null, 2))}</textarea>
        <div class="variable-help">
          <small>Variables = JSON array, e.g. [{"key":"topic","label":"Topic"}]</small>
        </div>
      </td>
      <td>
        <button class="btn btn-duplicate" data-action="duplicate" data-index="${index}">
          Duplicate
        </button>
        <button class="btn btn-delete" data-action="delete" data-index="${index}">
          Delete
        </button>
      </td>
    `;
    
    return row;
  }

  /**
   * Add a new template
   */
  async addNewTemplate() {
    try {
      console.log('Adding new template...');
      
      const newTemplate = {
        name: 'New Template',
        body: 'Enter your template here with {{variables}}',
        variables: []
      };
      
      console.log('New template object:', newTemplate);
      
      const addedTemplate = await addTemplate(newTemplate);
      console.log('Template added successfully:', addedTemplate);
      
      this.templates.push(addedTemplate);
      this.renderTemplates();
      
      this.showStatus('Template added successfully');
    } catch (error) {
      console.error('Failed to add template:', error);
      this.showStatus(`Failed to add template: ${error.message}`, 'error');
    }
  }

  /**
   * Handle template input changes
   */
  async handleTemplateInput(event) {
    const index = parseInt(event.target.dataset.index);
    const field = event.target.dataset.field;
    
    if (isNaN(index) || !field || index >= this.templates.length) return;
    
    try {
      let value = event.target.value;
      
      // Parse JSON for variables field
      if (field === 'variables') {
        try {
          value = JSON.parse(value || '[]');
        } catch (parseError) {
          // Don't save invalid JSON, just return
          return;
        }
      }
      
      // Update template
      this.templates[index][field] = value;
      
      // Save to storage
      await saveTemplates(this.templates);
      
      this.showStatus('Template updated');
    } catch (error) {
      console.error('Failed to update template:', error);
      this.showStatus(`Failed to update template: ${error.message}`, 'error');
    }
  }

  /**
   * Handle template actions (delete, duplicate)
   */
  async handleTemplateAction(event) {
    const action = event.target.dataset.action;
    const index = parseInt(event.target.dataset.index);
    
    if (!action || isNaN(index) || index >= this.templates.length) return;
    
    try {
      if (action === 'delete') {
        await this.deleteTemplate(index);
      } else if (action === 'duplicate') {
        await this.duplicateTemplate(index);
      }
    } catch (error) {
      console.error(`Failed to ${action} template:`, error);
      this.showStatus(`Failed to ${action} template: ${error.message}`, 'error');
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(index) {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      const templateId = this.templates[index].id;
      await deleteTemplate(templateId);
      
      this.templates.splice(index, 1);
      this.renderTemplates();
      
      this.showStatus('Template deleted successfully');
    } catch (error) {
      console.error('Failed to delete template:', error);
      this.showStatus(`Failed to delete template: ${error.message}`, 'error');
    }
  }

  /**
   * Duplicate a template
   */
  async duplicateTemplate(index) {
    try {
      const originalTemplate = this.templates[index];
      const duplicatedTemplate = {
        ...originalTemplate,
        name: `${originalTemplate.name} (Copy)`
      };
      
      const addedTemplate = await addTemplate(duplicatedTemplate);
      this.templates.push(addedTemplate);
      this.renderTemplates();
      
      this.showStatus('Template duplicated successfully');
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      this.showStatus(`Failed to duplicate template: ${error.message}`, 'error');
    }
  }

  /**
   * Export templates as JSON file
   */
  async exportTemplates() {
    try {
      const jsonString = await exportTemplates();
      
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'prompt-library.json';
      link.click();
      
      URL.revokeObjectURL(url);
      
      this.showStatus('Templates exported successfully');
    } catch (error) {
      console.error('Failed to export templates:', error);
      this.showStatus(`Failed to export templates: ${error.message}`, 'error');
    }
  }

  /**
   * Import templates from file
   */
  async importTemplatesFromFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const fileContent = await file.text();
      const importedTemplates = await importTemplates(fileContent);
      
      // Reload templates to show imported ones
      this.templates = await getTemplates();
      this.renderTemplates();
      
      this.showStatus(`Imported ${importedTemplates.length} templates successfully`);
      
      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Failed to import templates:', error);
      this.showStatus(`Failed to import templates: ${error.message}`, 'error');
      
      // Reset file input
      event.target.value = '';
    }
  }

  /**
   * Reset templates to defaults
   */
  async resetToDefaults() {
    if (!confirm('Are you sure you want to reset all templates to defaults? This will remove all custom templates.')) {
      return;
    }
    
    try {
      await resetToDefaults();
      
      // Reload templates
      this.templates = await getTemplates();
      this.renderTemplates();
      
      this.showStatus('Templates reset to defaults successfully');
    } catch (error) {
      console.error('Failed to reset templates:', error);
      this.showStatus(`Failed to reset templates: ${error.message}`, 'error');
    }
  }

  /**
   * Show status message
   */
  showStatus(message, type = 'info') {
    if (!this.elements.status) return;
    
    this.elements.status.textContent = message;
    this.elements.status.className = `status status-${type}`;
    
    // Auto-hide status after 3 seconds
    setTimeout(() => {
      if (this.elements.status) {
        this.elements.status.textContent = '';
        this.elements.status.className = 'status';
      }
    }, 3000);
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize options when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new OptionsController();
});
