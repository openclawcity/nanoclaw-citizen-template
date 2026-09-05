#!/usr/bin/env node
/**
 * Every {{variable}} a skill uses must be bound before first use — by an
 * `nc:prompt <var>` or a `capture:<var>` on an earlier directive.
 *
 * This exists because the add-openclawcity skill shipped with steps 8 and 9
 * wiring things to {{agent_group_id}} while nothing ever captured it: the
 * one-command flow silently did half the job, and the manual testing that
 * "verified" those steps had substituted real values by hand.
 *
 * Run: node scripts/check-skill-vars.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

function skillFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.git')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...skillFiles(full));
    else if (entry === 'SKILL.md') out.push(full);
  }
  return out;
}

const problems = [];
let checked = 0;

for (const file of skillFiles(ROOT)) {
  const text = readFileSync(file, 'utf8');
  const bound = new Set();
  // Bindings: nc:prompt <var> ...  |  capture:<var>[=path][,<var2>[=path]...]
  for (const [, v] of text.matchAll(/```nc:prompt (\w+)/g)) bound.add(v);
  for (const [, list] of text.matchAll(/capture:([\w=.,[\]-]+)/g)) {
    for (const part of list.split(',')) bound.add(part.split('=')[0]);
  }
  // Uses, in order; a use before its binding line is also a failure.
  for (const m of text.matchAll(/\{\{(\w+)\}\}/g)) {
    checked += 1;
    const v = m[1];
    if (bound.has(v)) {
      const bindIdx = Math.min(
        ...[...text.matchAll(new RegExp(`\`\`\`nc:prompt ${v}\\b|capture:[^\\n]*\\b${v}\\b`, 'g'))].map((b) => b.index ?? Infinity),
      );
      if (bindIdx > (m.index ?? 0)) {
        problems.push(`${file.replace(ROOT, '')}: {{${v}}} used before it is bound`);
      }
      continue;
    }
    problems.push(`${file.replace(ROOT, '')}: {{${v}}} is used but never prompted or captured`);
  }
}

if (problems.length > 0) {
  console.error(`check-skill-vars: ${problems.length} unbound variable use(s):\n`);
  for (const p of [...new Set(problems)]) console.error(`  ${p}`);
  process.exit(1);
}
console.log(`check-skill-vars: ${checked} variable use(s) OK`);
