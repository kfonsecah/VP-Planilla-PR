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

  let typecheckOutput = '';
  let failed = false;

  try {
    execSync('npx tsc --noEmit 2>&1', {
      cwd: projectDir,
      timeout: 60000,
      stdio: 'pipe',
    });
  } catch (err) {
    failed = true;
    typecheckOutput = err.stdout?.toString() || err.message || '';
    // Trim to last 50 lines to avoid flooding context
    const lines = typecheckOutput.split('\n');
    if (lines.length > 50) {
      typecheckOutput = `...(${lines.length - 50} lines omitted)...\n` + lines.slice(-50).join('\n');
    }
  }

  if (failed) {
    const output = {
      additionalContext: `## TypeScript errors in ${projectName} (tsc --noEmit)\n\nFix these before finishing the task:\n\`\`\`\n${typecheckOutput.trim()}\n\`\`\``,
    };
    process.stdout.write(JSON.stringify(output));
  }

  process.exit(0);
});
