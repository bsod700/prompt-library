/**
 * Storage service for Chrome extension
 * Handles all chrome.storage.sync operations with proper error handling
 */

import { STORAGE_KEYS, DEFAULT_STORAGE } from '../constants/schema.js';

/**
 * Get a single value from storage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {Promise<*>} - Stored value or default
 */
export async function getStorageValue(key, defaultValue = null) {
  try {
    const result = await chrome.storage.sync.get([key]);
    return result[key] !== undefined ? result[key] : defaultValue;
  } catch (error) {
    console.error(`Failed to get storage value for key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Get multiple values from storage
 * @param {string[]} keys - Array of storage keys
 * @returns {Promise<Object>} - Object with key-value pairs
 */
export async function getStorageValues(keys) {
  try {
    return await chrome.storage.sync.get(keys);
  } catch (error) {
    console.error('Failed to get storage values:', error);
    return {};
  }
}

/**
 * Set a single value in storage
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @returns {Promise<void>}
 */
export async function setStorageValue(key, value) {
  try {
    await chrome.storage.sync.set({ [key]: value });
  } catch (error) {
    console.error(`Failed to set storage value for key "${key}":`, error);
    throw error;
  }
}

/**
 * Set multiple values in storage
 * @param {Object} values - Object with key-value pairs
 * @returns {Promise<void>}
 */
export async function setStorageValues(values) {
  try {
    await chrome.storage.sync.set(values);
  } catch (error) {
    console.error('Failed to set storage values:', error);
    throw error;
  }
}

/**
 * Remove a key from storage
 * @param {string} key - Storage key to remove
 * @returns {Promise<void>}
 */
export async function removeStorageValue(key) {
  try {
    await chrome.storage.sync.remove([key]);
  } catch (error) {
    console.error(`Failed to remove storage value for key "${key}":`, error);
    throw error;
  }
}

/**
 * Clear all storage
 * @returns {Promise<void>}
 */
export async function clearStorage() {
  try {
    await chrome.storage.sync.clear();
  } catch (error) {
    console.error('Failed to clear storage:', error);
    throw error;
  }
}

/**
 * Get all extension state from storage
 * @returns {Promise<Object>} - Complete extension state
 */
export async function getExtensionState() {
  try {
    const state = await chrome.storage.sync.get(Object.values(STORAGE_KEYS));
    
    // Apply defaults for missing values
    const result = { ...DEFAULT_STORAGE };
    Object.keys(state).forEach(key => {
      if (state[key] !== undefined) {
        result[key] = state[key];
      }
    });
    
    return result;
  } catch (error) {
    console.error('Failed to get extension state:', error);
    return DEFAULT_STORAGE;
  }
}

/**
 * Save extension state to storage
 * @param {Object} state - State object to save
 * @returns {Promise<void>}
 */
export async function saveExtensionState(state) {
  try {
    // Only save valid keys
    const validState = {};
    Object.keys(state).forEach(key => {
      if (Object.values(STORAGE_KEYS).includes(key)) {
        validState[key] = state[key];
      }
    });
    
    await chrome.storage.sync.set(validState);
  } catch (error) {
    console.error('Failed to save extension state:', error);
    throw error;
  }
}

/**
 * Initialize storage with default values if empty
 * @returns {Promise<void>}
 */
export async function initializeStorage() {
  try {
    const state = await getExtensionState();
    const hasTemplates = state[STORAGE_KEYS.TEMPLATES] && 
                        state[STORAGE_KEYS.TEMPLATES].length > 0;
    
    if (!hasTemplates) {
      await setStorageValue(STORAGE_KEYS.TEMPLATES, DEFAULT_STORAGE[STORAGE_KEYS.TEMPLATES]);
    }
  } catch (error) {
    console.error('Failed to initialize storage:', error);
  }
}

/**
 * Get storage quota information
 * @returns {Promise<Object>} - Quota information
 */
export async function getStorageQuota() {
  try {
    return await chrome.storage.sync.getBytesInUse();
  } catch (error) {
    console.error('Failed to get storage quota:', error);
    return null;
  }
}
