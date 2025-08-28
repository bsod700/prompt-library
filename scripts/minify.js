#!/usr/bin/env node

/**
 * Minification script for production builds
 */

const fs = require('fs-extra');
const path = require('path');
const { minify } = require('terser');
const CleanCSS = require('clean-css');

const DIST_DIR = 'dist';

async function minifyFiles() {
  try {
    console.log('🔧 Starting minification...');
    
    const jsFiles = await findJsFiles(DIST_DIR);
    const cssFiles = await findCssFiles(DIST_DIR);
    const htmlFiles = await findHtmlFiles(DIST_DIR);
    
    // Minify JavaScript files
    for (const file of jsFiles) {
      await minifyJsFile(file);
    }
    
    // Remove comments and minify CSS files
    for (const file of cssFiles) {
      await minifyCssFile(file);
    }
    
    // Remove comments from HTML files
    for (const file of htmlFiles) {
      await removeHtmlComments(file);
    }
    
    console.log('✅ Minification completed successfully!');
    
  } catch (error) {
    console.error('❌ Minification failed:', error);
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

async function minifyJsFile(filePath) {
  try {
    const code = await fs.readFile(filePath, 'utf8');
    
    const result = await minify(code, {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.warn', 'console.error'],
        passes: 2
      },
      mangle: {
        toplevel: true,
        reserved: ['chrome', 'window', 'document']
      },
      format: {
        comments: false,
        beautify: false,
        indent_level: 0
      },
      sourceMap: false
    });
    
    if (result.error) {
      throw result.error;
    }
    
    await fs.writeFile(filePath, result.code);
    
    const originalSize = Buffer.byteLength(code, 'utf8');
    const minifiedSize = Buffer.byteLength(result.code, 'utf8');
    const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
    
    console.log(`📦 ${path.relative(DIST_DIR, filePath)}: ${originalSize} → ${minifiedSize} bytes (${savings}% smaller)`);
    
  } catch (error) {
    console.warn(`⚠️  Failed to minify ${filePath}:`, error.message);
  }
}

async function minifyCssFile(filePath) {
  try {
    const code = await fs.readFile(filePath, 'utf8');
    
    const cleanCSS = new CleanCSS({
      level: 2,
      format: 'keep-breaks',
      inline: false,
      rebase: false,
      removeComments: true,
      removeEmpty: true,
      removeWhitespace: true
    });
    
    const result = cleanCSS.minify(code);
    
    if (result.errors && result.errors.length > 0) {
      console.warn(`⚠️  CSS minification warnings for ${filePath}:`, result.errors);
    }
    
    await fs.writeFile(filePath, result.styles);
    
    const originalSize = Buffer.byteLength(code, 'utf8');
    const minifiedSize = Buffer.byteLength(result.styles, 'utf8');
    const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
    
    console.log(`🎨 ${path.relative(DIST_DIR, filePath)}: ${originalSize} → ${minifiedSize} bytes (${savings}% smaller)`);
    
  } catch (error) {
    console.warn(`⚠️  Failed to minify CSS ${filePath}:`, error.message);
    // Fallback to simple comment removal
    await removeCssComments(filePath);
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
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
    
    await fs.writeFile(filePath, cleanedCode);
    
    const originalSize = Buffer.byteLength(code, 'utf8');
    const cleanedSize = Buffer.byteLength(cleanedCode, 'utf8');
    const savings = ((originalSize - cleanedSize) / originalSize * 100).toFixed(1);
    
    console.log(`🎨 ${path.relative(DIST_DIR, filePath)}: ${originalSize} → ${cleanedSize} bytes (${savings}% smaller)`);
    
  } catch (error) {
    console.warn(`⚠️  Failed to clean CSS ${filePath}:`, error.message);
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
      .replace(/>\s+</g, '><') // Remove whitespace between tags
      .trim();
    
    await fs.writeFile(filePath, cleanedCode);
    
    const originalSize = Buffer.byteLength(code, 'utf8');
    const cleanedSize = Buffer.byteLength(cleanedCode, 'utf8');
    const savings = ((originalSize - cleanedSize) / originalSize * 100).toFixed(1);
    
    console.log(`🌐 ${path.relative(DIST_DIR, filePath)}: ${originalSize} → ${cleanedSize} bytes (${savings}% smaller)`);
    
  } catch (error) {
    console.warn(`⚠️  Failed to clean HTML ${filePath}:`, error.message);
  }
}

minifyFiles();
