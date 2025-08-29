#!/usr/bin/env node

/**
 * Build script to copy source files to dist directory
 */

const fs = require('fs-extra');
const path = require('path');

const SRC_DIR = 'src';
const DIST_DIR = 'dist';

async function copyFiles() {
  try {
    console.log('🔄 Starting build...');
    
    // Clean dist directory
    await fs.remove(DIST_DIR);
    await fs.ensureDir(DIST_DIR);
    
    // Copy source files, excluding SCSS (compiled separately)
    await fs.copy(SRC_DIR, DIST_DIR, {
      filter: (src) => !src.endsWith('.scss')
    });
    
    // Copy icons directory
    if (await fs.pathExists('icons')) {
      await fs.copy('icons', path.join(DIST_DIR, 'icons'));
    }
    
    // Copy README and other docs
    const filesToCopy = ['README.md', 'LICENSE'];
    for (const file of filesToCopy) {
      if (await fs.pathExists(file)) {
        await fs.copy(file, path.join(DIST_DIR, file));
      }
    }
    
    console.log('✅ Build completed successfully!');
    console.log(`📁 Output directory: ${DIST_DIR}`);
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

copyFiles();
