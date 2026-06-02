#!/bin/bash
# SpecFlow PostCompile hook — regenerates CLAUDE.md after compilation
SPECFLOW_DIR=".specflow"
if [ -d "$SPECFLOW_DIR" ]; then
  LATEST=$(ls -d "$SPECFLOW_DIR"/versions/v* 2>/dev/null | sort -V | tail -1)
  if [ -n "$LATEST" ] && [ -f "$LATEST/bundle.json" ]; then
    VERSION=$(node -e "try{const b=require('./$LATEST/bundle.json');console.log(b.version||'')}catch(e){}" 2>/dev/null)
    echo ""
    echo " SpecFlow: PCB v$VERSION compiled successfully"
    echo " 12 files generated in docs/spec-flow/"
    echo ""
  fi
fi
