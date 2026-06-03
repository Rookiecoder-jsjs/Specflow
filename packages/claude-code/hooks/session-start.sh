#!/bin/bash
# SpecFlow SessionStart hook — checks for stale context, open questions, and new inputs.
# SECURITY: Never interpolate untrusted JSON values into a `node -e` source string.
# Pass data via env vars and read with process.env. Always read files in node, never in shell.
set -euo pipefail
SPECFLOW_DIR=".specflow"
STALE_DAYS=7

if [ ! -d "$SPECFLOW_DIR" ]; then
  exit 0
fi

# 1. Open questions in latest bundle
LATEST=$(ls -d "$SPECFLOW_DIR"/versions/v* 2>/dev/null | sort -V | tail -1 || true)
if [ -n "${LATEST:-}" ] && [ -f "$LATEST/bundle.json" ]; then
  OQ=$(SPECFLOW_BUNDLE_PATH="$LATEST/bundle.json" node -e "
    try {
      const fs = require('fs');
      const b = JSON.parse(fs.readFileSync(process.env.SPECFLOW_BUNDLE_PATH, 'utf-8'));
      const n = (b && b.metadata && typeof b.metadata.openQuestionCount === 'number')
        ? b.metadata.openQuestionCount : 0;
      process.stdout.write(String(n));
    } catch (e) { process.stdout.write('0'); }
  " 2>/dev/null || echo "0")
  if [ -n "$OQ" ] && [ "$OQ" != "0" ]; then
    echo ""
    echo " SpecFlow: $OQ open question(s) - check docs/spec-flow/07_open_questions.md"
    echo ""
  fi
fi

# 2. Stale context (Fresh Context principle)
if [ -f "$SPECFLOW_DIR/project.json" ]; then
  UPDATED=$(SPECFLOW_META_PATH="$SPECFLOW_DIR/project.json" node -e "
    try {
      const fs = require('fs');
      const m = JSON.parse(fs.readFileSync(process.env.SPECFLOW_META_PATH, 'utf-8'));
      process.stdout.write(typeof m.updatedAt === 'string' ? m.updatedAt : '');
    } catch (e) {}
  " 2>/dev/null || true)
  if [ -n "$UPDATED" ]; then
    # Strict ISO-8601 sanity check: only accept values that look like a timestamp.
    if [[ "$UPDATED" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?(Z|[+-][0-9]{2}:[0-9]{2})?$ ]]; then
      DAYS_SINCE=$(SPECFLOW_UPDATED="$UPDATED" node -e "
        const d = new Date(process.env.SPECFLOW_UPDATED).getTime();
        if (!isFinite(d)) { process.stdout.write('0'); return; }
        const n = Date.now();
        process.stdout.write(String(Math.round((n - d) / (1000*60*60*24))));
      " 2>/dev/null || echo "0")
      if [ -n "$DAYS_SINCE" ] && [ "$DAYS_SINCE" -gt "$STALE_DAYS" ] 2>/dev/null; then
        echo " SpecFlow: Context is $DAYS_SINCE days old (>${STALE_DAYS}d threshold). Run specflow compile to refresh."
      fi
    fi
  fi
fi

# 3. Missing CLAUDE.md
if [ ! -f "CLAUDE.md" ]; then
  echo " SpecFlow: No CLAUDE.md found. Run specflow compile to generate context map."
fi
