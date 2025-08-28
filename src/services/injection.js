/**
 * Injection service for ChatGPT
 * Handles text injection into ChatGPT's input field using chrome.scripting
 */

import { SAFE_SELECTORS, findFirstElement } from '../constants/selectors.js';

/**
 * Injection function that runs in the context of the ChatGPT page
 * @param {string} text - Text to inject
 * @param {boolean} autoSend - Whether to automatically send the message
 * @param {boolean} debug - Whether to enable debug logging
 * @returns {Object} - Injection result with success status and details
 */
function injectTextToChatGPT(text, autoSend, debug) {
  if (debug) {
    console.log("Prompt Library Debug: Starting injection...");
    console.log("Text to inject:", text);
    console.log("Auto-send:", autoSend);
  }

  // Find the input element
  const inputElement = findFirstElement(SAFE_SELECTORS.textarea);
  if (!inputElement) {
    const error = "ChatGPT input not found. Available elements: " + 
      Array.from(document.querySelectorAll('textarea, div[contenteditable="true"]'))
        .map(el => ({
          tagName: el.tagName,
          placeholder: el.placeholder,
          'aria-label': el.getAttribute('aria-label'),
          'data-id': el.getAttribute('data-id'),
          id: el.id,
          class: el.className,
          contenteditable: el.getAttribute('contenteditable')
        }));
    
    console.error("Prompt Library Error:", error);
    return { success: false, error: "ChatGPT input not found" };
  }

  if (debug) {
    console.log("Found input element:", inputElement);
    console.log("Element properties:", {
      tagName: inputElement.tagName,
      placeholder: inputElement.placeholder,
      'aria-label': inputElement.getAttribute('aria-label'),
      'data-id': inputElement.getAttribute('data-id'),
      id: inputElement.id,
      class: inputElement.className,
      contenteditable: inputElement.getAttribute('contenteditable')
    });
  }

  try {
    // Focus the input element
    inputElement.focus();
    
    const isContentEditable = inputElement.hasAttribute('contenteditable');
    
    if (isContentEditable) {
      // Handle contenteditable div
      if (debug) console.log("Setting contenteditable div value");
      
      // Clear existing content
      inputElement.innerHTML = '';
      
      // Create a new paragraph element with the text
      const p = document.createElement('p');
      p.textContent = text;
      inputElement.appendChild(p);
      
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
      
    } else {
      // Handle regular textarea
      if (debug) console.log("Setting textarea value");
      inputElement.value = text;
      
      // Trigger proper events to update ChatGPT's state
      inputElement.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      inputElement.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
      
      // Also trigger focus/blur to ensure state update
      inputElement.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
      inputElement.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
      inputElement.focus();
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
    
    if (debug) console.log("Text injected successfully");
    
    // Auto-send if requested
    if (autoSend) {
      const sendButton = findFirstElement(SAFE_SELECTORS.sendButton);
      if (sendButton) {
        if (debug) console.log("Found send button, triggering auto-send");
        sendButton.click();
        if (debug) console.log("Auto-send triggered");
      } else {
        if (debug) console.warn("Send button not found for auto-send");
        return { 
          success: true, 
          warning: "Text injected but send button not found" 
        };
      }
    }
    
    return { success: true };
    
  } catch (error) {
    console.error("Prompt Library Error: Failed to inject text:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Inject text into the active ChatGPT tab
 * @param {string} text - Text to inject
 * @param {boolean} autoSend - Whether to automatically send the message
 * @param {boolean} debug - Whether to enable debug logging
 * @returns {Promise<Object>} - Injection result
 */
export async function injectToActiveTab(text, autoSend = false, debug = false) {
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      throw new Error("No active tab found");
    }
    
    // Check if we're on a supported domain
    if (!tab.url || (!tab.url.includes('chat.openai.com') && !tab.url.includes('chatgpt.com'))) {
      throw new Error("Not on a supported ChatGPT domain");
    }
    
    // Execute the injection script with a self-contained function
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (text, autoSend, debug) => {
        // Self-contained injection function
        if (debug) {
          console.log("Prompt Library Debug: Starting injection...");
          console.log("Text to inject:", text);
          console.log("Auto-send:", autoSend);
        }

        // Find the input element using inline selectors
        const inputElement = document.querySelector('div[contenteditable="true"][id="prompt-textarea"]') ||
                           document.querySelector('div[contenteditable="true"][translate="no"]') ||
                           document.querySelector('textarea[data-id="root"]') ||
                           document.querySelector('textarea[placeholder*="Message"]') ||
                           document.querySelector('textarea[placeholder*="Send a message"]');
        
        if (!inputElement) {
          const error = "ChatGPT input not found. Available elements: " + 
            Array.from(document.querySelectorAll('textarea, div[contenteditable="true"]'))
              .map(el => ({
                tagName: el.tagName,
                placeholder: el.placeholder,
                'aria-label': el.getAttribute('aria-label'),
                'data-id': el.getAttribute('data-id'),
                id: el.id,
                class: el.className,
                contenteditable: el.getAttribute('contenteditable')
              }));
          
          console.error("Prompt Library Error:", error);
          return { success: false, error: "ChatGPT input not found" };
        }

        if (debug) {
          console.log("Found input element:", inputElement);
          console.log("Element properties:", {
            tagName: inputElement.tagName,
            placeholder: inputElement.placeholder,
            'aria-label': inputElement.getAttribute('aria-label'),
            'data-id': inputElement.getAttribute('data-id'),
            id: inputElement.id,
            class: inputElement.className,
            contenteditable: inputElement.getAttribute('contenteditable')
          });
        }

        try {
          // Focus the input element
          inputElement.focus();
          
          const isContentEditable = inputElement.hasAttribute('contenteditable');
          
          if (isContentEditable) {
            // Handle contenteditable div
            if (debug) console.log("Setting contenteditable div value");
            
            // Clear existing content
            inputElement.innerHTML = '';
            
            // Create a new paragraph element with the text
            const p = document.createElement('p');
            p.textContent = text;
            inputElement.appendChild(p);
            
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
            
          } else {
            // Handle regular textarea
            if (debug) console.log("Setting textarea value");
            inputElement.value = text;
            
            // Trigger proper events to update ChatGPT's state
            inputElement.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
            inputElement.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
            
            // Also trigger focus/blur to ensure state update
            inputElement.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
            inputElement.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
            inputElement.focus();
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
          
          if (debug) console.log("Text injected successfully");
          
          // Auto-send if requested
          if (autoSend) {
            const sendButton = document.querySelector('button[data-testid="send-button"]') ||
                             document.querySelector('button[aria-label="Send message"]') ||
                             document.querySelector('button[aria-label="Send" i]') ||
                             document.querySelector('button[type="submit"]');
            if (sendButton) {
              if (debug) console.log("Found send button, triggering auto-send");
              sendButton.click();
              if (debug) console.log("Auto-send triggered");
            } else {
              if (debug) console.warn("Send button not found for auto-send");
              return { 
                success: true, 
                warning: "Text injected but send button not found" 
              };
            }
          }
          
          return { success: true };
          
        } catch (error) {
          console.error("Prompt Library Error: Failed to inject text:", error);
          return { success: false, error: error.message };
        }
      },
      args: [text, autoSend, debug]
    });
    
    if (!results || results.length === 0) {
      throw new Error("Injection script execution failed");
    }
    
    const result = results[0].result;
    
    if (!result || !result.success) {
      throw new Error(result?.error || "Injection failed");
    }
    
    return result;
    
  } catch (error) {
    console.error("Prompt Library Error: Injection failed:", error);
    throw error;
  }
}

/**
 * Test injection functionality on the current tab
 * @param {string} testText - Test text to inject
 * @param {boolean} debug - Whether to enable debug logging
 * @returns {Promise<Object>} - Test result
 */
export async function testInjection(testText = "Test prompt injection", debug = true) {
  try {
    return await injectToActiveTab(testText, false, debug);
  } catch (error) {
    console.error("Prompt Library Error: Test injection failed:", error);
    throw error;
  }
}

/**
 * Comprehensive test injection with verification
 * @param {string} testText - Test text to inject
 * @param {boolean} debug - Whether to enable debug logging
 * @returns {Promise<Object>} - Test result with verification
 */
export async function testInjectionWithVerification(testText = "Test prompt injection", debug = true) {
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      throw new Error("No active tab found");
    }
    
    // Check if we're on a supported domain
    if (!tab.url || (!tab.url.includes('chat.openai.com') && !tab.url.includes('chatgpt.com'))) {
      throw new Error("Not on a supported ChatGPT domain");
    }
    
    // Execute the injection script with verification
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (text, debugMode) => {
        // Find the input element
        const inputElement = document.querySelector('div[contenteditable="true"][id="prompt-textarea"]') ||
                           document.querySelector('div[contenteditable="true"][translate="no"]') ||
                           document.querySelector('textarea[data-id="root"]') ||
                           document.querySelector('textarea[placeholder*="Message"]') ||
                           document.querySelector('textarea[placeholder*="Send a message"]');
        
        if (!inputElement) {
          return { success: false, error: "ChatGPT input not found" };
        }
        
        if (debugMode) {
          console.log("=== Prompt Library Test Injection ===");
          console.log("Text to inject:", text);
          console.log("Input element:", inputElement);
          console.log("Element properties:", {
            tagName: inputElement.tagName,
            placeholder: inputElement.placeholder,
            'aria-label': inputElement.getAttribute('aria-label'),
            'data-id': inputElement.getAttribute('data-id'),
            id: inputElement.id,
            class: inputElement.className,
            contenteditable: inputElement.getAttribute('contenteditable')
          });
        }
        
        // Store original state
        const originalState = {
          value: inputElement.value,
          innerHTML: inputElement.innerHTML,
          textContent: inputElement.textContent
        };
        
        if (debugMode) {
          console.log("Original state:", originalState);
        }
        
        try {
          // Focus and inject
          inputElement.focus();
          
          if (inputElement.hasAttribute('contenteditable')) {
            // Handle contenteditable div
            inputElement.innerHTML = '';
            const p = document.createElement('p');
            p.textContent = text;
            inputElement.appendChild(p);
            
            // Trigger events
            inputElement.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
            inputElement.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
            inputElement.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: text }));
            
          } else {
            // Handle textarea
            inputElement.value = text;
            inputElement.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
            inputElement.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
          }
          
          // Wait a bit for DOM to update
          return new Promise((resolve) => {
            setTimeout(() => {
              // Check final state
              const finalState = {
                value: inputElement.value,
                innerHTML: inputElement.innerHTML,
                textContent: inputElement.textContent
              };
              
              if (debugMode) {
                console.log("Final state:", finalState);
                console.log("State changed:", JSON.stringify(originalState) !== JSON.stringify(finalState));
              }
              
              // Verify injection worked
              let injectionSuccess = false;
              if (inputElement.hasAttribute('contenteditable')) {
                injectionSuccess = inputElement.innerHTML.includes(text) || inputElement.textContent.includes(text);
              } else {
                injectionSuccess = inputElement.value === text;
              }
              
              if (debugMode) {
                console.log("Injection success:", injectionSuccess);
                console.log("Text found in element:", {
                  inValue: inputElement.value.includes(text),
                  inInnerHTML: inputElement.innerHTML.includes(text),
                  inTextContent: inputElement.textContent.includes(text)
                });
              }
              
              resolve({
                success: injectionSuccess,
                originalState,
                finalState,
                textInjected: text,
                elementType: inputElement.hasAttribute('contenteditable') ? 'contenteditable' : 'textarea'
              });
            }, 200);
          });
          
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
      args: [testText, debug]
    });
    
    if (!results || results.length === 0) {
      throw new Error("Test injection script execution failed");
    }
    
    const result = results[0].result;
    
    if (debug) {
      console.log("Test injection result:", result);
    }
    
    return result;
    
  } catch (error) {
    console.error("Prompt Library Error: Test injection with verification failed:", error);
    throw error;
  }
}

/**
 * Debug function to show all available input elements
 * @returns {Promise<Object>} - Debug information
 */
export async function debugChatGPTInputs() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      throw new Error("No active tab found");
    }
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
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
        
        return { textareas: textareas.length, contentEditables: contentEditables.length };
      }
    });
    
    return results[0]?.result || { error: "Debug script execution failed" };
    
  } catch (error) {
    console.error("Prompt Library Error: Debug failed:", error);
    throw error;
  }
}
