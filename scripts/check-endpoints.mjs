#!/usr/bin/env node
/**
 * Every city endpoint this template teaches must actually be reachable.
 *
 * This exists because the template once documented an `/actions/speak` family
 * that does not exist. The MCP server rejects unknown paths with "outside the
 * bot-authorized City surface", so the agent could not speak, move, or react —
 * and, having been handed a confident-looking table, it told its owner the
 * city could not do those things rather than reading the real manual.
 *
 * The published `openbotcity-mcp` package ships the same policy the live tool
 * enforces, so we check against that rather than a copy that can drift.
 *
 * Run: node scripts/check-endpoints.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const { cityPathDecision } = await import('openbotcity-mcp/build/policy/cityCapabilities.js');

const ROOT = new URL('..', import.meta.url).pathname;
const TEMPLATE = join(ROOT, 'lifestyle', 'openclawcity-citizen');

/**
 * Claude Code slash-commands share the leading-slash shape but are not city
 * endpoints. Listed explicitly rather than pattern-matched, so a genuine
 * one-segment city path (`/gallery`, `/concerts`, `/asks`) is still checked.
 */
const NOT_CITY_ENDPOINTS = new Set([
  '/manage-channels',
  '/add-openclawcity',
  '/add-dial-number',
  '/add-dial-tool',
  '/init-first-agent',
]);

/** Endpoints appear as `/path` in backticks. Placeholders stand in for ids. */
const ENDPOINT_RE = /`(\/[a-zA-Z0-9/_.<>:-]+)`/g;
const PLACEHOLDER_RE = /<[^>]+>|:[a-zA-Z_]+|[A-Z_]{3,}/g;

function markdownFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...markdownFiles(full));
    else if (entry.endsWith('.md')) out.push(full);
  }
  return out;
}

const problems = [];
let checked = 0;

for (const file of markdownFiles(TEMPLATE)) {
  const text = readFileSync(file, 'utf8');
  for (const [, raw] of text.matchAll(ENDPOINT_RE)) {
    // Skip prose paths that are not city endpoints.
    if (NOT_CITY_ENDPOINTS.has(raw)) continue;
    if (raw.endsWith('.md') && !raw.startsWith('/skill')) continue;
    if (/^\/(?:[a-z-]+\/)*[a-z-]+\.(?:json|ts|mjs)$/.test(raw)) continue;
    const path = raw.replace(PLACEHOLDER_RE, 'x');
    checked += 1;
    let decision;
    try {
      decision = cityPathDecision(path);
    } catch (err) {
      // normalizeCityPath rejects anything that is not a safe API path.
      decision = `rejected (${err instanceof Error ? err.message : err})`;
    }
    if (decision !== 'allowed') {
      problems.push(`${file.replace(ROOT, '')}: ${raw} -> ${decision}`);
    }
  }
}

if (problems.length > 0) {
  console.error(`check-endpoints: ${problems.length} endpoint(s) the agent cannot reach:\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error('\nRead https://api.openbotcity.com/skill.md and use the exact paths it documents.');
  process.exit(1);
}

console.log(`check-endpoints: ${checked} endpoint reference(s) OK`);
