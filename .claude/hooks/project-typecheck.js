#!/usr/bin/env node
// PostToolUse hook — TypeScript type check after Write/Edit on .ts/.tsx files
// Determines which sub-project was modified and runs tsc --noEmit.
// Returns additionalContext with errors if typecheck fails so the agent
// sees type errors immediately and can fix them in the same turn.

const { execSync } = require('child_process');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const BACKEND_ROOT = path.join(PROJECT_ROOT, 'src/backend');
const FRONTEND_ROOT = path.join(PROJECT_ROOT, 'src/frontend');

const stdinTimeout = setTimeout(() => process.exit(0), 10000);

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => (input += chunk));
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);

  let event;
  try {
    event = JSON.parse(input);
  } catch {
    process.exit(0);
  }

  // Extract the file path from the tool input
  const toolInput = event?.tool_input || {};
  const filePath = toolInput.file_path || toolInput.path || '';

  if (!filePath) process.exit(0);

  // Normalize to forward slashes for comparison
  const normalized = filePath.replace(/\\/g, '/');

  // Only care about TypeScript files
  if (!normalized.endsWith('.ts') && !normalized.endsWith('.tsx')) process.exit(0);

  // Skip files inside .next/ build output — not user code
  if (normalized.includes('/.next/')) process.exit(0);

  // Determine which project to typecheck
  let projectDir = null;
  let projectName = null;

  if (normalized.includes('/src/backend/')) {
    projectDir = BACKEND_ROOT;
    projectName = 'backend';
  } else if (normalized.includes('/src/frontend/')) {
    projectDir = FRONTEND_ROOT;
    projectName = 'frontend';
  } else {
    process.exit(0);
  }

  const errors = [];

  // 1. TypeScript typecheck
  try {
    execSync('npx tsc --noEmit 2>&1', {
      cwd: projectDir,
      timeout: 60000,
      stdio: 'pipe',
    });
  } catch (err) {
    let out = err.stdout?.toString() || err.message || '';
    const lines = out.split('\n');
    if (lines.length > 50) {
      out = `...(${lines.length - 50} lines omitted)...\n` + lines.slice(-50).join('\n');
    }
    errors.push(`## TypeScript errors (tsc --noEmit)\n\`\`\`\n${out.trim()}\n\`\`\``);
  }

  // 2. ESLint — frontend only
  if (projectName === 'frontend') {
    try {
      execSync('npx next lint --quiet 2>&1', {
        cwd: projectDir,
        timeout: 60000,
        stdio: 'pipe',
      });
    } catch (err) {
      let out = err.stdout?.toString() || err.message || '';
      const lines = out.split('\n');
      if (lines.length > 50) {
        out = `...(${lines.length - 50} lines omitted)...\n` + lines.slice(-50).join('\n');
      }
      errors.push(`## ESLint errors (next lint)\n\`\`\`\n${out.trim()}\n\`\`\``);
    }
  }

  if (errors.length > 0) {
    const output = {
      additionalContext: `## Build checks failed in ${projectName}\n\nFix these before finishing the task:\n\n${errors.join('\n\n')}`,
    };
    process.stdout.write(JSON.stringify(output));
  }

  process.exit(0);
});
