/**
 * Safe selectors for ChatGPT DOM elements
 * Single source of truth for all DOM access
 */
export const SAFE_SELECTORS = {
  // Input field selectors (ordered by specificity)
  textarea: [
    'div[contenteditable="true"][id="prompt-textarea"]', // ChatGPT's new contenteditable input
    'div[contenteditable="true"][translate="no"]', // Alternative contenteditable selector
    'textarea[data-id="root"]', // ChatGPT's main textarea (legacy)
    'textarea[placeholder*="Message"]',
    'textarea[placeholder*="Send a message"]',
    'textarea[aria-label*="message" i]',
    'textarea[aria-label*="Chat input" i]',
    'form textarea:not([readonly])',
    'textarea:not([readonly])'
  ],
  
  // Send button selectors (ordered by specificity)
  sendButton: [
    'button[data-testid="send-button"]',
    'button[aria-label="Send message"]',
    'button[aria-label="Send" i]',
    'button[type="submit"]',
    'form button[type="submit"]'
  ],
  
  // Badge container
  badge: '#prompt-lib-badge'
};

/**
 * Find the first matching element using the provided selectors
 * @param {string[]} selectors - Array of CSS selectors to try
 * @param {Document} root - Root element to search from (defaults to document)
 * @returns {Element|null} - First matching element or null
 */
export function findFirstElement(selectors, root = document) {
  for (const selector of selectors) {
    const element = root.querySelector(selector);
    if (element) return element;
  }
  return null;
}

/**
 * Check if an element is visible in the DOM
 * @param {Element} element - Element to check
 * @returns {boolean} - True if element is visible
 */
export function isElementVisible(element) {
  return element && element.offsetParent !== null;
}
