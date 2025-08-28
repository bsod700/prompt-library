#!/usr/bin/env node

/**
 * Comment removal script for development builds
 * Removes all comments without full minification
 */

const fs = require('fs-extra');
const path = require('path');

const DIST_DIR = 'dist';

async function removeComments() {
  try {
    console.log('🧹 Starting comment removal...');
    
    const jsFiles = await findJsFiles(DIST_DIR);
    const cssFiles = await findCssFiles(DIST_DIR);
    const htmlFiles = await findHtmlFiles(DIST_DIR);
    
    // Remove comments from JavaScript files
    for (const file of jsFiles) {
      await removeJsComments(file);
    }
    
    // Remove comments from CSS files
    for (const file of cssFiles) {
      await removeCssComments(file);
    }
    
    // Remove comments from HTML files
    for (const file of htmlFiles) {
      await removeHtmlComments(file);
    }
    
    console.log('✅ Comment removal completed successfully!');
    
  } catch (error) {
    console.error('❌ Comment removal failed:', error);
    process.exit(1);
  }
}

async function findJsFiles(dir) {
  const files = [];
  
  async function scan(currentDir) {
    const items = await fs.readdir(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        await scan(fullPath);
      } else if (item.endsWith('.js')) {
        files.push(fullPath);
      }
    }
  }
  
  await scan(dir);
  return files;
}

async function findCssFiles(dir) {
  const files = [];
  
  async function scan(currentDir) {
    const items = await fs.readdir(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        await scan(fullPath);
      } else if (item.endsWith('.css')) {
        files.push(fullPath);
      }
    }
  }
  
  await scan(dir);
  return files;
}

async function findHtmlFiles(dir) {
  const files = [];
  
  async function scan(currentDir) {
    const items = await fs.readdir(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        await scan(fullPath);
      } else if (item.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  }
  
  await scan(dir);
  return files;
}

async function removeJsComments(filePath) {
  try {
    const code = await fs.readFile(filePath, 'utf8');
    
    // Remove single-line comments (// ...)
    let codeWithoutComments = code.replace(/\/\/.*$/gm, '');
    
    // Remove multi-line comments (/* ... */)
    codeWithoutComments = codeWithoutComments.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove empty lines and excessive whitespace
    const cleanedCode = codeWithoutComments
      .replace(/^\s*[\r\n]/gm, '') // Remove empty lines
      .replace(/\n\s*\n/g, '\n') // Remove multiple consecutive empty lines
      .trim();
    
    await fs.writeFile(filePath, cleanedCode);
    
    const originalSize = Buffer.byteLength(code, 'utf8');
    const cleanedSize = Buffer.byteLength(cleanedCode, 'utf8');
    const savings = ((originalSize - cleanedSize) / originalSize * 100).toFixed(1);
    
    console.log(`📦 ${path.relative(DIST_DIR, filePath)}: ${originalSize} → ${cleanedSize} bytes (${savings}% smaller)`);
    
  } catch (error) {
    console.warn(`⚠️  Failed to remove JS comments from ${filePath}:`, error.message);
  }
}

async function removeCssComments(filePath) {
  try {
    const code = await fs.readFile(filePath, 'utf8');
    
    // Remove CSS comments (/* ... */)
    const codeWithoutComments = code.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove empty lines and excessive whitespace
    const cleanedCode = codeWithoutComments
      .replace(/^\s*[\r\n]/gm, '') // Remove empty lines
      .replace(/\n\s*\n/g, '\n') // Remove multiple consecutive empty lines
      .trim();
    
    await fs.writeFile(filePath, cleanedCode);
    
    const originalSize = Buffer.byteLength(code, 'utf8');
    const cleanedSize = Buffer.byteLength(cleanedCode, 'utf8');
    const savings = ((originalSize - cleanedSize) / originalSize * 100).toFixed(1);
    
    console.log(`🎨 ${path.relative(DIST_DIR, filePath)}: ${originalSize} → ${cleanedSize} bytes (${savings}% smaller)`);
    
  } catch (error) {
    console.warn(`⚠️  Failed to remove CSS comments from ${filePath}:`, error.message);
  }
}

async function removeHtmlComments(filePath) {
  try {
    const code = await fs.readFile(filePath, 'utf8');
    
    // Remove HTML comments (<!-- ... -->)
    const codeWithoutComments = code.replace(/<!--[\s\S]*?-->/g, '');
    
    // Remove empty lines and excessive whitespace
    const cleanedCode = codeWithoutComments
      .replace(/^\s*[\r\n]/gm, '') // Remove empty lines
      .replace(/\n\s*\n/g, '\n') // Remove multiple consecutive empty lines
      .trim();
    
    await fs.writeFile(filePath, cleanedCode);
    
    const originalSize = Buffer.byteLength(code, 'utf8');
    const cleanedSize = Buffer.byteLength(cleanedCode, 'utf8');
    const savings = ((originalSize - cleanedSize) / originalSize * 100).toFixed(1);
    
    console.log(`🌐 ${path.relative(DIST_DIR, filePath)}: ${originalSize} → ${cleanedSize} bytes (${savings}% smaller)`);
    
  } catch (error) {
    console.warn(`⚠️  Failed to remove HTML comments from ${filePath}:`, error.message);
  }
}

removeComments();
