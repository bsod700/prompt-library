#!/usr/bin/env node

/**
 * Build script to create distribution zip file
 */

const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

const DIST_DIR = 'dist';
const ZIP_NAME = 'prompt-library-extension.zip';

async function buildZip() {
  try {
    console.log('📦 Building distribution zip...');
    
    // Ensure dist directory exists
    if (!(await fs.pathExists(DIST_DIR))) {
      console.log('🔄 Dist directory not found, running build first...');
      const { execSync } = require('child_process');
      execSync('npm run build', { stdio: 'inherit' });
    }
    
    const output = fs.createWriteStream(ZIP_NAME);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    output.on('close', () => {
      const size = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`✅ Zip created successfully: ${ZIP_NAME}`);
      console.log(`📊 Total size: ${size} MB`);
    });
    
    archive.on('error', (err) => {
      throw err;
    });
    
    archive.pipe(output);
    
    // Add dist directory contents to zip
    archive.directory(DIST_DIR, false);
    
    await archive.finalize();
    
  } catch (error) {
    console.error('❌ Failed to create zip:', error);
    process.exit(1);
  }
}

buildZip();
