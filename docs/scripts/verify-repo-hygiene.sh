#!/usr/bin/env bash
# verify-repo-hygiene.sh - VP-Planilla
# Ensures no "tracked but ignored" files exist in the git index.

# Find tracked but ignored files
TRACKED_IGNORED=$(git ls-files -i -c --exclude-standard)

if [ -n "$TRACKED_IGNORED" ]; then
  echo "ERROR: Tracked but ignored files found in git index:"
  echo "$TRACKED_IGNORED"
  echo "Action required: Run 'git rm --cached <file>' to remove from index."
  exit 1
else
  echo "SUCCESS: Git index hygiene is clean."
  exit 0
fi
