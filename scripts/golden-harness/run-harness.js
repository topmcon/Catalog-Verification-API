/**
 * Golden harness (G3 results gate) — PLATFORM-AUDIT-GUIDE §5.3.
 *
 * Compares the golden answers (human-reviewed ground truth) against each golden SKU's
 * pipeline output. Runs entirely locally on committed files — no DB, no LLM, no prod.
 *
 *   node scripts/golden-harness/run-harness.js            # report mode
 *   node scripts/golden-harness/run-harness.js --gate     # exit 1 on any hard mismatch (CI/deploy gate)
 *   node scripts/golden-harness/run-harness.js --field=AI_Finish   # filter to one field
 *
 * Trust rules:
 *   - Only entries/fields with status:"reviewed" in golden-answers.json are judged.
 *     (Falls back to golden-answers.draft.json and judges nothing until review happens —
 *     it will tell you how many entries are still unreviewed.)
 *   - Fields marked ambiguous:true are reported but never fail the gate.
 *
 * NOTE: each payload's currentOutput is the pipeline output captured at selection time
 * (2026-06-09). After a fix ships, refresh outputs by re-running verification for the golden
 * SKUs (Phase 4 replay) and re-exporting — the harness then shows exactly which golden fields
 * the fix moved.
 */
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..', '..', 'audit-results', 'golden-set');
const args = process.argv.slice(2);
const GATE = args.includes('--gate');
const FIELD_FILTER = (args.find((a) => a.startsWith('--field=')) || '').split('=')[1] || null;

function loadAnswers() {
  const final = path.join(BASE, 'golden-answers.json');
  const draft = path.join(BASE, 'golden-answers.draft.json');
  if (fs.existsSync(final)) return { file: final, data: JSON.parse(fs.readFileSync(final, 'utf8')) };
  if (fs.existsSync(draft)) return { file: draft, data: JSON.parse(fs.readFileSync(draft, 'utf8')) };
  console.error('No golden-answers[.draft].json found under', BASE);
  process.exit(2);
}

function main() {
  const { file, data } = loadAnswers();
  const entries = data.entries || [];
  let reviewedFields = 0, unreviewedFields = 0, pass = 0, fail = 0, ambiguous = 0;
  const failures = [];

  for (const e of entries) {
    const payloadFile = path.join(BASE, 'payloads', `${String(e.sf_catalog_name || e.sf_catalog_id).replace(/[^A-Za-z0-9._-]+/g, '_')}.json`);
    if (!fs.existsSync(payloadFile)) continue;
    const payload = JSON.parse(fs.readFileSync(payloadFile, 'utf8'));
    const out = payload.currentOutput || {};

    for (const [field, spec] of Object.entries(e.fields || {})) {
      if (FIELD_FILTER && field !== FIELD_FILTER) continue;
      if (spec.status !== 'reviewed') { unreviewedFields++; continue; }
      reviewedFields++;
      if (spec.ambiguous) { ambiguous++; continue; }
      const actual = String(out[field] ?? '').trim();
      const expected = String(spec.correct ?? '').trim();
      if (actual.toLowerCase() === expected.toLowerCase()) { pass++; }
      else {
        fail++;
        failures.push({ sku: e.sf_catalog_name, field, expected, actual, evidence: spec.evidence });
      }
    }
  }

  console.log(`\n═══ GOLDEN HARNESS ═══  (answers: ${path.basename(file)})`);
  console.log(`entries: ${entries.length} | reviewed fields: ${reviewedFields} | unreviewed: ${unreviewedFields} | ambiguous (excluded): ${ambiguous}`);
  console.log(`PASS: ${pass} | FAIL: ${fail}`);
  for (const f of failures.slice(0, 50)) {
    console.log(`  ✗ ${f.sku} ${f.field}: expected "${f.expected}" got "${f.actual}"${f.evidence ? `  [${f.evidence.substring(0, 60)}]` : ''}`);
  }
  if (reviewedFields === 0) {
    console.log('\n⚠️  Nothing reviewed yet — the harness judges only status:"reviewed" fields.');
    console.log('    Review workflow: audit-results/golden-set/README.md');
  }
  if (GATE && fail > 0) process.exit(1);
}

main();
