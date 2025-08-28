/**
 * Content script for Prompt Library Chrome Extension
 * Provides badge indicator and debugging functions on ChatGPT pages
 */

import { SAFE_SELECTORS, findFirstElement } from '../constants/selectors.js';

// Only run on ChatGPT pages
if (!window.location.hostname.includes('chat.openai.com') && 
    !window.location.hostname.includes('chatgpt.com')) {
  console.log('Prompt Library: Not on ChatGPT page, skipping initialization');
  // Still expose the test function for manual testing
  window.testPromptLibInjection = function() {
    console.log('Prompt Library: Not on ChatGPT page');
    return false;
  };
} else {
  // We're on ChatGPT, initialize normally
  initializePromptLibrary();
}

/**
 * Initialize the Prompt Library content script
 */
function initializePromptLibrary() {
  let badgeElement = null;
  let observerActive = false;
  let readyStateLogged = false;

  /**
   * Create and display the extension badge
   */
  function ensureBadge() {
    if (badgeElement && badgeElement.parentNode) return;
    
    badgeElement = document.createElement('div');
    badgeElement.id = 'prompt-lib-badge';
    badgeElement.textContent = 'Prompt Library active';
    badgeElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #2f6feb;
      color: white;
      padding: 6px 10px;
      border-radius: 16px;
      font-size: 11px;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      opacity: 0.8;
      transition: opacity 0.2s;
      pointer-events: none;
      max-width: 150px;
      word-wrap: break-word;
    `;
    
    // Make badge less intrusive
    badgeElement.addEventListener('mouseenter', () => {
      if (badgeElement) badgeElement.style.opacity = '1';
    });
    badgeElement.addEventListener('mouseleave', () => {
      if (badgeElement) badgeElement.style.opacity = '0.8';
    });
    
    document.body.appendChild(badgeElement);
    
    // Auto-hide badge after 5 seconds
    setTimeout(() => {
      if (badgeElement && badgeElement.parentNode) {
        badgeElement.style.opacity = '0.3';
      }
    }, 5000);
  }

  /**
   * Check if ChatGPT is ready for injection
   */
  function checkReadyState() {
    const inputElement = findFirstElement(SAFE_SELECTORS.textarea);
    const isReady = !!inputElement;
    
    if (isReady) {
      document.body.classList.add('prompt-lib-ready');
      if (!readyStateLogged) {
        console.log('Prompt Library: ChatGPT input detected and ready');
        readyStateLogged = true;
      }
    } else {
      document.body.classList.remove('prompt-lib-ready');
      readyStateLogged = false;
    }
    
    return isReady;
  }

  /**
   * Enhanced textarea detection for ChatGPT
   */
  function findChatGPTChatInput() {
    return findFirstElement(SAFE_SELECTORS.textarea);
  }

  /**
   * Debug function to show all available input elements
   */
  window.debugChatGPTInputs = function() {
    console.log("=== ChatGPT Input Elements Debug ===");
    
    const textareas = Array.from(document.querySelectorAll('textarea'));
    const contentEditables = Array.from(document.querySelectorAll('div[contenteditable="true"]'));
    
    console.log("Textareas found:", textareas.length);
    textareas.forEach((ta, i) => {
      console.log(`Textarea ${i + 1}:`, {
        placeholder: ta.placeholder,
        'aria-label': ta.getAttribute('aria-label'),
        'data-id': ta.getAttribute('data-id'),
        id: ta.id,
        class: ta.className,
        value: ta.value,
        visible: ta.offsetParent !== null
      });
    });
    
    console.log("Contenteditable divs found:", contentEditables.length);
    contentEditables.forEach((ce, i) => {
      console.log(`Contenteditable ${i + 1}:`, {
        id: ce.id,
        class: ce.className,
        translate: ce.getAttribute('translate'),
        'data-virtualkeyboard': ce.getAttribute('data-virtualkeyboard'),
        innerHTML: ce.innerHTML,
        visible: ce.offsetParent !== null
      });
    });
    
    // Also check for any form elements
    const forms = Array.from(document.querySelectorAll('form'));
    console.log("Forms found:", forms.length);
    forms.forEach((form, i) => {
      console.log(`Form ${i + 1}:`, {
        action: form.action,
        method: form.method,
        class: form.className,
        children: Array.from(form.children).map(child => ({
          tagName: child.tagName,
          type: child.type,
          id: child.id,
          class: child.className
        }))
      });
    });
    
    return { textareas, contentEditables, forms };
  };

  /**
   * Global test function for debugging injection
   */
  window.testPromptLibInjection = function(text = "Test prompt injection") {
    console.log("Testing Prompt Library injection...");
    
    const inputElement = findChatGPTChatInput();
    if (!inputElement) {
      console.error("No ChatGPT input found");
      return false;
    }
    
    console.log("Found input element:", inputElement);
    console.log("Input properties:", {
      tagName: inputElement.tagName,
      placeholder: inputElement.placeholder,
      'aria-label': inputElement.getAttribute('aria-label'),
      'data-id': inputElement.getAttribute('data-id'),
      id: inputElement.id,
      class: inputElement.className,
      contenteditable: inputElement.getAttribute('contenteditable')
    });
    
    try {
      // Test injection based on element type
      inputElement.focus();
      
      if (inputElement.hasAttribute('contenteditable')) {
        // Handle contenteditable div
        console.log("Testing contenteditable div injection");
        
        // Store original content for comparison
        const originalContent = inputElement.innerHTML;
        console.log("Original content:", originalContent);
        
        // Clear existing content
        inputElement.innerHTML = '';
        console.log("Cleared content, new innerHTML:", inputElement.innerHTML);
        
        // Create a new paragraph element with the text
        const p = document.createElement('p');
        p.textContent = text;
        inputElement.appendChild(p);
        
        console.log("Added paragraph, new innerHTML:", inputElement.innerHTML);
        console.log("Paragraph text content:", p.textContent);
        
        // Trigger multiple events to ensure ChatGPT recognizes the change
        inputElement.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        inputElement.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        
        // Trigger composition events to simulate typing
        inputElement.dispatchEvent(new CompositionEvent('compositionstart', {
          bubbles: true,
          data: text
        }));
        inputElement.dispatchEvent(new CompositionEvent('compositionend', {
          bubbles: true,
          data: text
        }));
        
        // Trigger focus and blur events to ensure proper state
        inputElement.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
        inputElement.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
        inputElement.focus();
        
        // Wait a bit and check if content persisted
        setTimeout(() => {
          console.log("After events, innerHTML:", inputElement.innerHTML);
          console.log("After events, textContent:", inputElement.textContent);
          console.log("Paragraph still exists:", inputElement.querySelector('p'));
        }, 100);
        
      } else {
        // Handle regular textarea
        console.log("Testing textarea injection");
        
        // Store original value for comparison
        const originalValue = inputElement.value;
        console.log("Original value:", originalValue);
        
        inputElement.value = text;
        console.log("Set new value:", inputElement.value);
        
        // Trigger proper events to update ChatGPT's state
        inputElement.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        inputElement.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        
        // Also trigger focus/blur to ensure state update
        inputElement.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
        inputElement.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
        inputElement.focus();
        
        // Wait a bit and check if value persisted
        setTimeout(() => {
          console.log("After events, value:", inputElement.value);
        }, 100);
      }
      
      // Force a re-render by dispatching multiple key events
      inputElement.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'Enter', 
        bubbles: true,
        cancelable: true
      }));
      inputElement.dispatchEvent(new KeyboardEvent('keyup', { 
        key: 'Enter', 
        bubbles: true,
        cancelable: true
      }));
      
      // Additional events that might help
      inputElement.dispatchEvent(new Event('paste', { bubbles: true }));
      
      console.log("Injection test completed. Check if text appears in ChatGPT input.");
      console.log("Final element state:", {
        tagName: inputElement.tagName,
        value: inputElement.value,
        innerHTML: inputElement.innerHTML,
        textContent: inputElement.textContent
      });
      
      return true;
    } catch (error) {
      console.error("Test injection failed:", error);
      return false;
    }
  };

  /**
   * Expose function globally for popup script access
   */
  window.findChatGPTChatInput = findChatGPTChatInput;

  /**
   * Handle badge visibility changes
   */
  function handleBadgeVisibility(hide) {
    if (badgeElement) {
      badgeElement.style.display = hide ? 'none' : 'block';
    }
  }

  /**
   * Listen for messages from popup/background
   */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggleBadge') {
      handleBadgeVisibility(message.hide);
      sendResponse({ success: true });
    }
  });

  // Initialize with delay to avoid blocking page load
  setTimeout(() => {
    ensureBadge();
    checkReadyState();
  }, 1000);

  // More efficient mutation observer - only check when needed
  const observer = new MutationObserver((mutations) => {
    // Only check if we haven't found the textarea yet
    if (!document.body.classList.contains('prompt-lib-ready')) {
      checkReadyState();
    }
  });

  // Start observing only after a delay and with better performance
  setTimeout(() => {
    if (!observerActive) {
      observer.observe(document.documentElement, {
        subtree: true, 
        childList: true,
        attributes: false, // Don't watch all attribute changes
        attributeFilter: ['class'] // Only watch class changes
      });
      observerActive = true;
    }
  }, 2000);

  // Periodic check with longer interval to avoid performance issues
  setInterval(checkReadyState, 5000); // Check every 5 seconds
}
