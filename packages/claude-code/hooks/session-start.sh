#!/bin/bash
# SpecFlow SessionStart hook — checks for new inputs and open questions
SPECFLOW_DIR=".specflow"
if [ -d "$SPECFLOW_DIR" ]; then
  LATEST=$(ls -d "$SPECFLOW_DIR"/versions/v* 2>/dev/null | sort -V | tail -1)
  if [ -n "$LATEST" ] && [ -f "$LATEST/bundle.json" ]; then
    OQ=$(node -e "try{const b=require('./$LATEST/bundle.json');process.stdout.write(String(b.metadata?.openQuestionCount||0))}catch(e){process.stdout.write('0')}" 2>/dev/null)
    if [ "$OQ" != "0" ] && [ -n "$OQ" ]; then
      echo ""
      echo " SpecFlow: $OQ open question(s) — check docs/spec-flow/07_open_questions.md"
      echo ""
    fi
  fi
  # Check for new untracked inputs
  if [ -f "$SPECFLOW_DIR/project.json" ]; then
    UPDATED=$(node -e "try{const m=require('./$SPECFLOW_DIR/project.json');console.log(m.updatedAt||'')}catch(e){}" 2>/dev/null)
    if [ -n "$UPDATED" ]; then
      echo " SpecFlow: last bundle compiled $UPDATED"
    fi
  fi
fi
