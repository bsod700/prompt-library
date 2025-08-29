#!/usr/bin/env node

/**
 * Compile all .scss files under src/ to .css under dist/ mirroring structure.
 */

const fs = require('fs-extra');
const path = require('path');
const sass = require('sass');

const SRC_DIR = 'src';
const DIST_DIR = 'dist';
const isProd = (process.env.npm_lifecycle_event || '').includes('prod');

async function findScssFiles(dir) {
  const files = [];
  async function scan(currentDir) {
    const items = await fs.readdir(currentDir);
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        await scan(fullPath);
      } else if (item.endsWith('.scss')) {
        files.push(fullPath);
      }
    }
  }
  await scan(dir);
  return files;
}

async function compileFile(scssPath) {
  const relPath = path.relative(SRC_DIR, scssPath);
  const outPath = path.join(DIST_DIR, relPath.replace(/\.scss$/, '.css'));
  await fs.ensureDir(path.dirname(outPath));

  const result = sass.compile(scssPath, {
    style: isProd ? 'compressed' : 'expanded'
  });
  await fs.writeFile(outPath, result.css);
  return { in: scssPath, out: outPath };
}

async function main() {
  try {
    console.log('🧵 Compiling SCSS...');
    const scssFiles = await findScssFiles(SRC_DIR);
    if (scssFiles.length === 0) {
      console.log('ℹ️  No SCSS files found. Skipping.');
      return;
    }
    for (const file of scssFiles) {
      const { out } = await compileFile(file);
      console.log(`✅ ${path.relative('.', file)} → ${path.relative('.', out)}`);
    }
  } catch (err) {
    console.error('❌ SCSS compilation failed:', err.message || err);
    process.exit(1);
  }
}

main();


