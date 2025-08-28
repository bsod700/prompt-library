/**
 * Popup module for Prompt Library Chrome Extension
 * Handles the main extension popup interface
 */

import { getExtensionState, setStorageValue, initializeStorage } from '../services/storage.js';
import { injectToActiveTab, testInjection, testInjectionWithVerification } from '../services/injection.js';
import { buildPromptText } from '../utils/template.js';
import { TUNE_PRESETS, STORAGE_KEYS } from '../constants/schema.js';

/**
 * Popup controller class
 */
class PopupController {
  constructor() {
    this.elements = {};
    this.state = {};
    this.templates = [];
    this.currentTemplate = null;
    
    this.initializeElements();
    this.bindEvents();
    this.loadState();
  }

  /**
   * Initialize DOM element references
   */
  initializeElements() {
    this.elements = {
      templateSelect: document.getElementById('templateSelect'),
      openOptions: document.getElementById('openOptions'),
      vars: document.getElementById('vars'),
      tune: document.getElementById('tune'),
      prefix: document.getElementById('prefix'),
      autoSend: document.getElementById('autoSend'),
      preview: document.getElementById('preview'),
      inject: document.getElementById('inject'),
      testInjection: document.getElementById('testInjection'),
      debugMode: document.getElementById('debugMode'),
      hideBadge: document.getElementById('hideBadge'),
      status: document.getElementById('status')
    };
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Template selection change
    this.elements.templateSelect.addEventListener('change', () => {
      this.onTemplateChange();
    });

    // Preview button
    this.elements.preview.addEventListener('click', () => {
      this.showPreview();
    });

    // Test injection button
    this.elements.testInjection.addEventListener('click', () => {
      this.testInjection();
    });

    // Debug mode toggle
    this.elements.debugMode.addEventListener('change', () => {
      this.onDebugModeChange();
    });

    // Hide badge toggle
    this.elements.hideBadge.addEventListener('change', () => {
      this.onHideBadgeChange();
    });

    // Inject button
    this.elements.inject.addEventListener('click', () => {
      this.injectPrompt();
    });

    // Open options button
    this.elements.openOptions.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }

  /**
   * Load extension state from storage
   */
  async loadState() {
    try {
      // Initialize storage with defaults if needed
      await initializeStorage();
      
      this.state = await getExtensionState();
      this.templates = this.state[STORAGE_KEYS.TEMPLATES] || [];
      
      this.renderTemplateList();
      this.renderVariables();
      this.applyState();
      
      // Show status about templates
      if (this.templates.length > 0) {
        this.showStatus(`Loaded ${this.templates.length} template(s)`, 'success');
      } else {
        this.showStatus('No templates available', 'warning');
      }
      
    } catch (error) {
      console.error('Failed to load state:', error);
      this.showStatus('Failed to load state', 'error');
    }
  }

  /**
   * Apply loaded state to UI elements
   */
  applyState() {
    // Set tune selection
    this.elements.tune.value = this.state[STORAGE_KEYS.TUNE] || 'neutral';
    
    // Set prefix
    this.elements.prefix.value = this.state[STORAGE_KEYS.PREFIX] || '';
    
    // Set auto-send
    this.elements.autoSend.checked = !!this.state[STORAGE_KEYS.AUTO_SEND];
    
    // Set debug mode
    this.elements.debugMode.checked = !!this.state[STORAGE_KEYS.DEBUG_MODE];
    
    // Set hide badge
    this.elements.hideBadge.checked = !!this.state[STORAGE_KEYS.HIDE_BADGE];
    
    // Apply badge visibility
    this.applyBadgeVisibility();
    
    // Set status
    this.showStatus(
      this.elements.debugMode.checked ? 'Debug mode ON' : 'Ready'
    );
  }

  /**
   * Render template list in dropdown
   */
  renderTemplateList() {
    if (!this.elements.templateSelect) return;
    
    this.elements.templateSelect.innerHTML = this.templates
      .map(template => `<option value="${template.id}">${template.name}</option>`)
      .join('');
    
    // Select last used template or first template
    const lastTemplateId = this.state[STORAGE_KEYS.LAST_TEMPLATE];
    if (lastTemplateId && this.templates.some(t => t.id === lastTemplateId)) {
      this.elements.templateSelect.value = lastTemplateId;
    } else if (this.templates.length > 0) {
      this.elements.templateSelect.value = this.templates[0].id;
    }
    
    this.onTemplateChange();
  }

  /**
   * Handle template selection change
   */
  onTemplateChange() {
    const selectedId = this.elements.templateSelect.value;
    this.currentTemplate = this.templates.find(t => t.id === selectedId);
    
    if (this.currentTemplate) {
      this.renderVariables();
      this.saveLastTemplate(selectedId);
    }
  }

  /**
   * Render variable inputs for current template
   */
  renderVariables() {
    if (!this.elements.vars || !this.currentTemplate) return;
    
    this.elements.vars.innerHTML = '';
    
    const variables = this.currentTemplate.variables || [];
    const storedVars = this.state[STORAGE_KEYS.VARIABLES] || {};
    
    variables.forEach(variable => {
      const id = `var_${variable.key}`;
      const wrapper = document.createElement('div');
      wrapper.className = 'grid';
      
      wrapper.innerHTML = `
        <label for="${id}">${variable.label || variable.key}</label>
        <input id="${id}" placeholder="${variable.placeholder || variable.label || variable.key}">
      `;
      
      this.elements.vars.appendChild(wrapper);
      
      // Set stored value if available
      const input = wrapper.querySelector(`#${id}`);
      if (input && storedVars[variable.key]) {
        input.value = storedVars[variable.key];
      }
    });
  }

  /**
   * Collect variable values from form
   */
  collectVariables() {
    if (!this.currentTemplate) return {};
    
    const variables = {};
    this.currentTemplate.variables.forEach(variable => {
      const input = document.getElementById(`var_${variable.key}`);
      if (input) {
        variables[variable.key] = input.value;
      }
    });
    
    return variables;
  }

  /**
   * Build complete prompt text
   */
  buildPromptText() {
    if (!this.currentTemplate) return '';
    
    const variables = this.collectVariables();
    const tune = this.elements.tune.value;
    const prefix = this.elements.prefix.value;
    
    return buildPromptText(this.currentTemplate, variables, tune, prefix, TUNE_PRESETS);
  }

  /**
   * Show preview of generated prompt
   */
  showPreview() {
    const text = this.buildPromptText();
    if (text) {
      const preview = text.length > 1200 ? text.substring(0, 1200) + '...' : text;
      alert(preview);
    }
  }

  /**
   * Test injection functionality
   */
  async testInjection() {
    this.showStatus('Testing injection...', 'info');
    
    try {
      const testText = "Test prompt injection - " + new Date().toLocaleTimeString();
      const result = await testInjectionWithVerification(testText, this.elements.debugMode.checked);
      
      if (result.success) {
        this.showStatus(`Test successful! Text injected into ${result.elementType}`, 'success');
        console.log('Test injection result:', result);
      } else {
        this.showStatus(`Test failed: ${result.error || 'Unknown error'}`, 'error');
        console.error('Test injection failed:', result);
      }
    } catch (error) {
      this.showStatus(`Test failed: ${error.message}`, 'error');
      console.error('Test injection error:', error);
    }
  }

  /**
   * Handle debug mode toggle
   */
  async onDebugModeChange() {
    try {
      await setStorageValue(STORAGE_KEYS.DEBUG_MODE, this.elements.debugMode.checked);
      this.showStatus(
        this.elements.debugMode.checked ? 'Debug mode ON' : 'Ready'
      );
    } catch (error) {
      console.error('Failed to save debug mode:', error);
      this.showStatus('Failed to save debug mode', 'error');
    }
  }

  /**
   * Handle hide badge toggle
   */
  async onHideBadgeChange() {
    try {
      await setStorageValue(STORAGE_KEYS.HIDE_BADGE, this.elements.hideBadge.checked);
      this.applyBadgeVisibility();
      this.showStatus(
        this.elements.hideBadge.checked ? 'Badge hidden' : 'Badge visible'
      );
    } catch (error) {
      console.error('Failed to save hide badge setting:', error);
      this.showStatus('Failed to save badge setting', 'error');
    }
  }

  /**
   * Apply badge visibility setting
   */
  async applyBadgeVisibility() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url && (tab.url.includes('chat.openai.com') || tab.url.includes('chatgpt.com'))) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'toggleBadge',
          hide: this.elements.hideBadge.checked
        });
      }
    } catch (error) {
      // Ignore errors - tab might not be ready or extension not active
    }
  }

  /**
   * Save last used template
   */
  async saveLastTemplate(templateId) {
    try {
      await setStorageValue(STORAGE_KEYS.LAST_TEMPLATE, templateId);
    } catch (error) {
      console.error('Failed to save last template:', error);
    }
  }

  /**
   * Save current form state
   */
  async saveFormState() {
    try {
      const variables = this.collectVariables();
      const prefix = this.elements.prefix.value;
      const tune = this.elements.tune.value;
      const autoSend = this.elements.autoSend.checked;
      
      await setStorageValue(STORAGE_KEYS.VARIABLES, variables);
      await setStorageValue(STORAGE_KEYS.PREFIX, prefix);
      await setStorageValue(STORAGE_KEYS.TUNE, tune);
      await setStorageValue(STORAGE_KEYS.AUTO_SEND, autoSend);
      
    } catch (error) {
      console.error('Failed to save form state:', error);
      throw error;
    }
  }

  /**
   * Inject prompt into ChatGPT
   */
  async injectPrompt() {
    if (!this.currentTemplate) {
      this.showStatus('Please select a template first', 'error');
      return;
    }
    
    const text = this.buildPromptText();
    if (!text) {
      this.showStatus('No prompt text to inject', 'error');
      return;
    }
    
    // Save form state
    try {
      await this.saveFormState();
    } catch (error) {
      console.error('Failed to save form state:', error);
    }
    
    // Show loading state
    const originalText = this.elements.inject.textContent;
    this.elements.inject.textContent = 'Injecting...';
    this.elements.inject.disabled = true;
    this.showStatus('Injecting...', 'info');
    
    try {
      await injectToActiveTab(
        text, 
        this.elements.autoSend.checked, 
        this.elements.debugMode.checked
      );
      
      // Show success feedback
      this.elements.inject.textContent = '✓ Injected!';
      this.elements.inject.style.background = '#10b981';
      this.elements.inject.style.color = 'white';
      this.showStatus('Successfully injected!', 'success');
      
      // Reset button after 2 seconds
      setTimeout(() => {
        this.elements.inject.textContent = originalText;
        this.elements.inject.style.background = '';
        this.elements.inject.style.color = '';
        this.elements.inject.disabled = false;
        this.showStatus(
          this.elements.debugMode.checked ? 'Debug mode ON' : 'Ready'
        );
      }, 2000);
      
    } catch (error) {
      console.error('Injection failed:', error);
      
      // Show error feedback
      this.elements.inject.textContent = '✗ Failed';
      this.elements.inject.style.background = '#ef4444';
      this.elements.inject.style.color = 'white';
      this.showStatus(`Failed: ${error.message}`, 'error');
      
      // Reset button after 3 seconds
      setTimeout(() => {
        this.elements.inject.textContent = originalText;
        this.elements.inject.style.background = '';
        this.elements.inject.style.color = '';
        this.elements.inject.disabled = false;
        this.showStatus(
          this.elements.debugMode.checked ? 'Debug mode ON' : 'Ready'
        );
      }, 3000);
    }
  }

  /**
   * Show status message
   */
  showStatus(message, type = 'info') {
    if (!this.elements.status) return;
    
    this.elements.status.textContent = message;
    this.elements.status.className = `muted status-${type}`;
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
