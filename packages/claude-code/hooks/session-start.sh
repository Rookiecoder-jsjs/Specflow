#!/bin/bash
# SpecFlow SessionStart hook — checks for stale context, open questions, and new inputs
SPECFLOW_DIR=".specflow"
STALE_DAYS=7

if [ -d "$SPECFLOW_DIR" ]; then
  # Check for open questions in latest bundle
  LATEST=$(ls -d "$SPECFLOW_DIR"/versions/v* 2>/dev/null | sort -V | tail -1)
  if [ -n "$LATEST" ] && [ -f "$LATEST/bundle.json" ]; then
    OQ=$(node -e "try{const b=require('./$LATEST/bundle.json');process.stdout.write(String(b.metadata?.openQuestionCount||0))}catch(e){process.stdout.write('0')}" 2>/dev/null)
    if [ "$OQ" != "0" ] && [ -n "$OQ" ]; then
      echo ""
      echo " SpecFlow: $OQ open question(s) — check docs/spec-flow/07_open_questions.md"
      echo ""
    fi
  fi

  # Check for stale context (Fresh Context principle)
  if [ -f "$SPECFLOW_DIR/project.json" ]; then
    UPDATED=$(node -e "try{const m=require('./$SPECFLOW_DIR/project.json');console.log(m.updatedAt||'')}catch(e){}" 2>/dev/null)
    if [ -n "$UPDATED" ]; then
      DAYS_SINCE=$(node -e "const d=new Date('$UPDATED').getTime();const n=Date.now();console.log(Math.round((n-d)/(1000*60*60*24)))" 2>/dev/null)
      if [ "$DAYS_SINCE" -gt "$STALE_DAYS" ] 2>/dev/null; then
        echo " SpecFlow: Context is $DAYS_SINCE days old (>${STALE_DAYS}d threshold). Run specflow compile to refresh."
      fi
    fi
  fi

  # Check for missing CLAUDE.md
  if [ ! -f "CLAUDE.md" ]; then
    echo " SpecFlow: No CLAUDE.md found. Run specflow compile to generate context map."
  fi
fi
