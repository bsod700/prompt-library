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
import { extractVariableKeys } from '../utils/template.js';

/**
 * Options controller class
 */
class OptionsController {
  constructor() {
    this.templates = [];
    this.elements = {};
    this.modal = {
      isOpen: false,
      index: null,
      tmpl: null,
      varsByKey: {}
    };
    
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
      status: document.getElementById('status'),
      // Modal elements
      modal: document.getElementById('tplModal'),
      modalBackdrop: document.getElementById('tplModalBackdrop'),
      modalClose: document.getElementById('tplModalClose'),
      modalName: document.getElementById('tplName'),
      modalBody: document.getElementById('tplBody'),
      modalVars: document.getElementById('tplVars'),
      modalSave: document.getElementById('tplSave'),
      modalCancel: document.getElementById('tplCancel'),
      modalDelete: document.getElementById('tplDelete')
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

    // Template row actions and open modal on row click
    this.elements.rows.addEventListener('click', (event) => {
      const action = event.target?.dataset?.action;
      if (action === 'delete' || action === 'duplicate') {
        this.handleTemplateAction(event);
        return;
      }
      const tr = event.target.closest('tr');
      if (!tr) return;
      const index = parseInt(tr.dataset.index);
      if (!isNaN(index)) {
        this.openTemplateModal(index);
      }
    });

    // Modal controls
    if (this.elements.modalClose) this.elements.modalClose.addEventListener('click', () => this.closeTemplateModal());
    if (this.elements.modalCancel) this.elements.modalCancel.addEventListener('click', () => this.closeTemplateModal());
    if (this.elements.modalBackdrop) this.elements.modalBackdrop.addEventListener('click', () => this.closeTemplateModal());
    if (this.elements.modalSave) this.elements.modalSave.addEventListener('click', () => this.saveTemplateFromModal());
    if (this.elements.modalDelete) this.elements.modalDelete.addEventListener('click', () => this.deleteTemplateFromModal());

    // Body change -> refresh variable list
    if (this.elements.modalBody) {
      this.elements.modalBody.addEventListener('input', () => this.refreshModalVariables());
    }
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
    
    const bodyPreview = (template.body || '').trim().split('\n').slice(0, 2).join(' ').slice(0, 120);
    const varCount = (template.variables || []).length;
    row.innerHTML = `
      <td>${this.escapeHtml(template.name || '')}</td>
      <td><div class="muted">${this.escapeHtml(bodyPreview)}</div></td>
      <td>${varCount} variable${varCount === 1 ? '' : 's'}</td>
      <td>
        <button class="btn btn-duplicate" data-action="duplicate" data-index="${index}">Duplicate</button>
        <button class="btn btn-delete" data-action="delete" data-index="${index}">Delete</button>
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

      // Open modal for immediate editing
      const newIndex = this.templates.length - 1;
      this.openTemplateModal(newIndex);
    } catch (error) {
      console.error('Failed to add template:', error);
      this.showStatus(`Failed to add template: ${error.message}`, 'error');
    }
  }

  /**
   * Handle template input changes
   */
  // Inline editing removed; editing handled in modal

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
      // Open modal for the duplicated one
      this.openTemplateModal(this.templates.length - 1);
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      this.showStatus(`Failed to duplicate template: ${error.message}`, 'error');
    }
  }

  // ===== Modal logic =====
  openTemplateModal(index) {
    const template = this.templates[index];
    if (!template) return;
    this.modal.isOpen = true;
    this.modal.index = index;
    this.modal.tmpl = JSON.parse(JSON.stringify(template));

    if (this.elements.modalName) this.elements.modalName.value = template.name || '';
    if (this.elements.modalBody) this.elements.modalBody.value = template.body || '';

    // Seed variables by key from existing variables
    const byKey = {};
    (template.variables || []).forEach(v => {
      byKey[v.key] = { ...v };
    });
    this.modal.varsByKey = byKey;
    this.refreshModalVariables();

    if (this.elements.modal) this.elements.modal.classList.add('is-open');
    if (this.elements.modal) this.elements.modal.setAttribute('aria-hidden', 'false');
  }

  closeTemplateModal() {
    if (!this.modal.isOpen) return;
    this.modal.isOpen = false;
    this.modal.index = null;
    this.modal.tmpl = null;
    this.modal.varsByKey = {};
    if (this.elements.modal) this.elements.modal.classList.remove('is-open');
    if (this.elements.modal) this.elements.modal.setAttribute('aria-hidden', 'true');
    if (this.elements.modalVars) this.elements.modalVars.innerHTML = '';
  }

  refreshModalVariables() {
    if (!this.elements.modalBody || !this.elements.modalVars) return;
    const bodyText = this.elements.modalBody.value || '';
    const keys = extractVariableKeys(bodyText);
    // Remove stale keys
    Object.keys(this.modal.varsByKey).forEach(k => { if (!keys.includes(k)) delete this.modal.varsByKey[k]; });
    // Add missing with defaults
    keys.forEach(k => {
      if (!this.modal.varsByKey[k]) {
        this.modal.varsByKey[k] = { key: k, label: k, placeholder: '', type: 'text', options: [] };
      }
    });

    // Render UI
    this.elements.modalVars.innerHTML = '';
    keys.forEach(k => {
      const v = this.modal.varsByKey[k];
      const wrap = document.createElement('div');
      wrap.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:8px; align-items:end;">
          <div>
            <label>Key</label>
            <input value="${this.escapeHtml(v.key)}" disabled />
          </div>
          <div>
            <label>Label</label>
            <input data-k="${k}" data-field="label" value="${this.escapeHtml(v.label || k)}" placeholder="Label" />
          </div>
          <div>
            <label>Type</label>
            <select data-k="${k}" data-field="type">
              <option value="text" ${v.type === 'select' ? '' : 'selected'}>Text</option>
              <option value="select" ${v.type === 'select' ? 'selected' : ''}>Select</option>
            </select>
          </div>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-top:8px;">
          <div>
            <label>Placeholder</label>
            <input data-k="${k}" data-field="placeholder" value="${this.escapeHtml(v.placeholder || '')}" placeholder="Placeholder" />
          </div>
          <div class="${v.type === 'select' ? '' : 'hidden'}" data-opts-wrap="${k}">
            <label>Options (comma-separated)</label>
            <input data-k="${k}" data-field="options" value="${this.escapeHtml((v.options || []).join(', '))}" placeholder="e.g. Low, Medium, High" />
          </div>
        </div>
      `;
      this.elements.modalVars.appendChild(wrap);
    });

    // Bind change handlers
    this.elements.modalVars.querySelectorAll('input[data-field], select[data-field]').forEach(el => {
      el.addEventListener('input', (e) => this.onModalVarChange(e));
      el.addEventListener('change', (e) => this.onModalVarChange(e));
    });
  }

  onModalVarChange(event) {
    const key = event.target.getAttribute('data-k');
    const field = event.target.getAttribute('data-field');
    if (!key || !field) return;
    const v = this.modal.varsByKey[key];
    if (!v) return;
    let value = event.target.value;
    if (field === 'type') {
      v.type = value === 'select' ? 'select' : 'text';
      // Toggle options wrap visibility
      const wrap = this.elements.modalVars.querySelector(`[data-opts-wrap="${key}"]`);
      if (wrap) wrap.classList.toggle('hidden', v.type !== 'select');
      return;
    }
    if (field === 'options') {
      v.options = value.split(',').map(s => s.trim()).filter(Boolean);
      return;
    }
    v[field] = value;
  }

  async saveTemplateFromModal() {
    if (this.modal.index == null) return;
    const idx = this.modal.index;
    const orig = this.templates[idx];
    const name = this.elements.modalName?.value?.trim() || '';
    const body = this.elements.modalBody?.value || '';
    const variables = Object.values(this.modal.varsByKey);
    try {
      const updated = await updateTemplate(orig.id, { name, body, variables });
      this.templates[idx] = updated;
      this.renderTemplates();
      this.showStatus('Template saved', 'success');
      this.closeTemplateModal();
    } catch (error) {
      console.error('Failed to save template:', error);
      this.showStatus(`Failed to save template: ${error.message}`, 'error');
    }
  }

  async deleteTemplateFromModal() {
    if (this.modal.index == null) return;
    const idx = this.modal.index;
    await this.deleteTemplate(idx);
    this.closeTemplateModal();
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
