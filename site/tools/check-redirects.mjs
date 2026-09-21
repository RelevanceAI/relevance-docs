/**
 * Validates the generated host configs against each platform's ACTUAL syntax.
 *
 * This gate exists because three redirects shipped with Mintlify's bare `*`
 * wildcard in vercel.json. Vercel validates routes at deployment-CREATION
 * time, so it rejected the whole deployment before any build ran -- all 163
 * rules taken down by 3 bad ones, with no build log to look at. Every local
 * check passed, because none of them read the generated config.
 *
 * Do not swap these rules for a path-to-regexp call: the version resolvable
 * here is v3, which accepts a bare `*`, so it does not reproduce Vercel's
 * stricter validation. The rules are encoded explicitly on purpose.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const VERCEL = path.join(ROOT, 'site/vercel.json');
const CF = path.join(ROOT, 'site/public/_redirects');

const errors = [];
const warn = [];

// ---- Vercel -------------------------------------------------------------
// Limits: 2048 routes per deployment (redirects + rewrites + headers).
const VERCEL_ROUTE_LIMIT = 2048;
const cfg = JSON.parse(fs.readFileSync(VERCEL, 'utf8'));
const redirects = cfg.redirects ?? [];
const headers = cfg.headers ?? [];
const rewrites = cfg.rewrites ?? [];

const namedParams = (p) => [...p.matchAll(/:(\w+)/g)].map((m) => m[1]);
// Strip named wildcards first, then anything left containing `*` is bare.
const hasBareWildcard = (p) => /\*/.test(p.replace(/:\w+[*+?]/g, ''));

redirects.forEach((r, i) => {
  for (const [field, value] of [['source', r.source], ['destination', r.destination]]) {
    if (typeof value !== 'string') {
      errors.push(`vercel redirect[${i}].${field} is not a string`);
      continue;
    }
    if (hasBareWildcard(value)) {
      errors.push(
        `vercel redirect[${i}].${field} uses a bare "*": ${value}\n` +
        `      Vercel needs a named wildcard, e.g. ${value.replace(/\*/g, ':path*')}`);
    }
  }
  if (typeof r.source === 'string' && typeof r.destination === 'string' &&
      !/^https?:\/\//.test(r.destination)) {
    const src = new Set(namedParams(r.source));
    for (const p of namedParams(r.destination)) {
      if (!src.has(p)) {
        errors.push(`vercel redirect[${i}] destination uses :${p}, absent from source\n` +
                    `      ${r.source} -> ${r.destination}`);
      }
    }
  }
  if (!r.source?.startsWith('/')) errors.push(`vercel redirect[${i}].source must start with "/"`);
});

const routes = redirects.length + headers.length + rewrites.length;
if (routes > VERCEL_ROUTE_LIMIT) {
  errors.push(`vercel routes ${routes} exceeds the ${VERCEL_ROUTE_LIMIT} per-deployment limit`);
} else if (routes > VERCEL_ROUTE_LIMIT * 0.8) {
  warn.push(`vercel routes ${routes} is within 20% of the ${VERCEL_ROUTE_LIMIT} limit`);
}

// ---- Cloudflare Pages ---------------------------------------------------
// Limits: 2000 static + 100 dynamic redirects.
let cfStatic = 0;
let cfDynamic = 0;
if (fs.existsSync(CF)) {
  const lines = fs.readFileSync(CF, 'utf8').split('\n')
    .map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  lines.forEach((line, i) => {
    const [from, to, code] = line.split(/\s+/);
    if (!from?.startsWith('/')) { errors.push(`_redirects line ${i + 1}: source must start with "/" -- ${line}`); return; }
    if (!to) { errors.push(`_redirects line ${i + 1}: missing destination -- ${line}`); return; }
    if (code && !/^\d{3}$/.test(code)) errors.push(`_redirects line ${i + 1}: bad status "${code}"`);
    // Cloudflare uses `*` in the source and `:splat` in the destination.
    if (/:\w+\*/.test(from)) {
      errors.push(`_redirects line ${i + 1}: source uses path-to-regexp ":name*"; Cloudflare wants "*" -- ${from}`);
    }
    if (from.includes('*')) {
      cfDynamic++;
      if (!to.includes(':splat')) {
        warn.push(`_redirects line ${i + 1}: wildcard source with no :splat in destination -- ${line}`);
      }
    } else {
      cfStatic++;
      if (to.includes(':splat')) errors.push(`_redirects line ${i + 1}: :splat in destination but no wildcard in source`);
    }
  });
  if (cfStatic > 2000) errors.push(`_redirects has ${cfStatic} static rules, over the 2000 limit`);
  if (cfDynamic > 100) errors.push(`_redirects has ${cfDynamic} dynamic rules, over the 100 limit`);
}

console.log(`vercel redirects : ${redirects.length}  (+${headers.length} headers, +${rewrites.length} rewrites = ${routes} routes / ${VERCEL_ROUTE_LIMIT})`);
console.log(`cloudflare rules : ${cfStatic} static + ${cfDynamic} dynamic (limits 2000 / 100)`);
console.log(`errors           : ${errors.length}`);

for (const w of warn) console.warn(`  WARN  ${w}`);
if (errors.length) {
  console.error('\nInvalid redirect configuration:');
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log('\nREDIRECTS OK: valid for both Vercel and Cloudflare Pages.');
