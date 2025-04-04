#!/usr/bin/env node

/**
 * Script to prepare the project for Netlify deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure the data directory exists in the Netlify build
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('Created data directory');
}

// Copy existing SQLite database if it exists
const srcDbPath = path.join(__dirname, 'data.db');
const destDbPath = path.join(dataDir, 'bloxfruits_pvp.db');

if (fs.existsSync(srcDbPath)) {
  fs.copyFileSync(srcDbPath, destDbPath);
  console.log('Copied SQLite database to data directory');
} else {
  console.log('No existing SQLite database found - will be created on first run');
}

// Build the frontend and backend
console.log('Building the application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Build completed successfully');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}

console.log('Project prepared for Netlify deployment');