#!/usr/bin/env node
// Postinstall script — installs SpecFlow AI plugin into the user's Claude Code project
const fs = require("fs");
const path = require("path");

const target = process.argv[2] || process.cwd();

console.log("");
console.log("  SpecFlow AI — Project Context Compiler");
console.log("");

// Source directories (relative to this script = the npm package root)
const src = __dirname;

// 1. Copy slash commands
const cmdsSrc = path.join(src, "commands");
const cmdsDst = path.join(target, ".claude", "commands");
if (fs.existsSync(cmdsSrc)) {
  fs.mkdirSync(cmdsDst, { recursive: true });
  const cmdFiles = fs.readdirSync(cmdsSrc).filter(f => f.endsWith(".md"));
  for (const f of cmdFiles) {
    fs.copyFileSync(path.join(cmdsSrc, f), path.join(cmdsDst, f));
  }
  console.log(`  Commands: ${cmdFiles.length} installed to .claude/commands/`);
}

// 2. Copy hook scripts
const hooksSrc = path.join(src, "hooks");
const hooksDst = path.join(target, ".claude", "hooks");
if (fs.existsSync(hooksSrc)) {
  fs.mkdirSync(hooksDst, { recursive: true });
  for (const f of fs.readdirSync(hooksSrc)) {
    const dst = path.join(hooksDst, f);
    if (f.endsWith(".sh")) {
      fs.copyFileSync(path.join(hooksSrc, f), dst);
      try { fs.chmodSync(dst, 0o755); } catch (_) {}
    } else if (f === "settings.json") {
      // Merge hook settings with existing
      let existing = {};
      if (fs.existsSync(dst)) {
        try { existing = JSON.parse(fs.readFileSync(dst, "utf-8")); } catch (_) {}
      }
      const pluginSettings = JSON.parse(fs.readFileSync(path.join(hooksSrc, f), "utf-8"));
      const merged = deepMerge(existing, pluginSettings);
      fs.writeFileSync(dst, JSON.stringify(merged, null, 2), "utf-8");
    }
  }
  console.log("  Hooks: installed to .claude/hooks/");
}

// 3. Ensure .specflow directory exists
const specflowDir = path.join(target, ".specflow");
fs.mkdirSync(specflowDir, { recursive: true });
fs.mkdirSync(path.join(specflowDir, "inputs"), { recursive: true });
fs.mkdirSync(path.join(specflowDir, "versions"), { recursive: true });

// 4. Ensure docs/spec-flow directory exists
const docsDir = path.join(target, "docs", "spec-flow");
fs.mkdirSync(docsDir, { recursive: true });

// 5. Copy skills to .claude/skills/ (so /skill specflow-workflow can be triggered)
const skillsSrc = path.join(src, "skills");
const skillsDst = path.join(target, ".claude", "skills");
if (fs.existsSync(skillsSrc)) {
  fs.mkdirSync(skillsDst, { recursive: true });
  let skillCount = 0;
  for (const entry of fs.readdirSync(skillsSrc, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillDir = path.join(skillsSrc, entry.name);
    const dstDir = path.join(skillsDst, entry.name);
    fs.mkdirSync(dstDir, { recursive: true });
    for (const f of fs.readdirSync(skillDir)) {
      const srcFile = path.join(skillDir, f);
      const dstFile = path.join(dstDir, f);
      const stat = fs.statSync(srcFile);
      if (stat.isFile()) {
        fs.copyFileSync(srcFile, dstFile);
        skillCount++;
      }
    }
  }
  if (skillCount > 0) {
    console.log(`  Skills: ${skillCount} file(s) installed to .claude/skills/`);
  }
}

// 6. Add specflow.config.json and config.json to .gitignore
const gitignorePath = path.join(target, ".gitignore");
const gitignoreEntries = ["specflow.config.json", "config.json"];
let existingContent = "";
if (fs.existsSync(gitignorePath)) {
  existingContent = fs.readFileSync(gitignorePath, "utf-8");
}
const missingEntries = gitignoreEntries.filter(e => !existingContent.includes(e));
if (missingEntries.length > 0) {
  const block = "\n# SpecFlow AI config (contains API keys)\n" + missingEntries.join("\n") + "\n";
  fs.appendFileSync(gitignorePath, block);
  console.log(`  Git: added ${missingEntries.join(", ")} to .gitignore`);
}

console.log("");
console.log("  SpecFlow AI plugin ready!");
console.log("  Next: Create specflow.config.json with your API keys, then run:");
console.log("    /specflow:init");
console.log("    /specflow:compile --audio meeting.m4a");
console.log("");

function deepMerge(a, b) {
  const result = { ...a };
  for (const key of Object.keys(b)) {
    if (Array.isArray(b[key]) && Array.isArray(a[key])) {
      result[key] = [...a[key], ...b[key]];
    } else if (typeof b[key] === "object" && b[key] !== null && typeof a[key] === "object" && a[key] !== null) {
      result[key] = deepMerge(a[key], b[key]);
    } else {
      result[key] = b[key];
    }
  }
  return result;
}
