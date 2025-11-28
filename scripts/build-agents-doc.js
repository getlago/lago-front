#!/usr/bin/env node

/**
 * Script to build AGENTS.md from individual markdown files in docs/agents/
 * 
 * Usage: node scripts/build-agents-doc.cjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.join(__dirname, '..', 'docs', 'agents');
const OUTPUT_FILE = path.join(__dirname, '..', 'AGENTS.md');

// Order of files to include (based on filename prefix)
const FILE_ORDER = [
  '00-introduction.md',
  '01-package-manager.md',
  '02-project-stack.md',
  '03-development-guidelines.md',
  '04-file-structure.md',
  '05-scripts-commands.md',
  '06-code-quality.md',
  '07-testing-practices.md',
  '08-typescript-conventions.md',
  '09-folder-architecture.md',
  '10-documentation.md',
];

function buildAgentsDoc() {
  console.log('Building AGENTS.md from docs/agents/...');

  const sections = [];

  for (const filename of FILE_ORDER) {
    const filePath = path.join(DOCS_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: File ${filename} not found, skipping...`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    sections.push(content);
  }

  const fullContent = sections.join('\n\n');

  fs.writeFileSync(OUTPUT_FILE, fullContent, 'utf-8');
  console.log(`✅ Successfully built AGENTS.md (${fullContent.length} characters)`);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildAgentsDoc();
}

export { buildAgentsDoc };

