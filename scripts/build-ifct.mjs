import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(fileURLToPath(import.meta.url), '..', '..');
const rawCsvPath = join(rootDir, 'scripts', 'ifct2017_raw.csv');
const outJsonPath = join(rootDir, 'assets', 'data', 'ifct2017.json');
const headerDumpPath = join(rootDir, 'scripts', 'ifct_header_raw.txt');

// ---------- minimal RFC4180 CSV parser (handles quoted fields w/ embedded commas) ----------
function parseCsvLine(line) {
  const fields = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
  }
  fields.push(cur);
  return fields;
}

async function fetchCsv(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download CSV: ${res.status}`);
  return await res.text();
}

async function main() {
  let csvText = '';
  if (existsSync(rawCsvPath)) {
    csvText = readFileSync(rawCsvPath, 'utf8');
    console.log(`[build] read CSV from ${rawCsvPath} (${(csvText.length / 1024).toFixed(1)} KB)`);
  } else {
    console.log('[build] CSV not found locally; downloading from GitHub...');
    csvText = await fetchCsv(
      'https://github.com/nithyamani/IndianFoodComposition/raw/main/IndianFoodCompositionTable_In_CSV_Format.csv'
    );
    writeFileSync(rawCsvPath, csvText, 'utf8');
    console.log(`[build] saved to ${rawCsvPath} (${(csvText.length / 1024).toFixed(1)} KB)`);
  }

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = parseCsvLine(lines[0]);
  writeFileSync(headerDumpPath, lines[0], 'utf8');
  console.log(`[build] header dump written to ${headerDumpPath} (${header.length} columns)`);

  const COL = {
    code: 0,
    name: 1,
    regn: 2,
    protein: 4,
    fat: 6,
    carbs: 10,
    energyKj: 11,
  };

  const out = [];
  let skipped = 0;
  for (let i = 1; i < lines.length; i++) {
    const f = parseCsvLine(lines[i]);
    if (f.length <= Math.max(...Object.values(COL))) {
      skipped++;
      continue;
    }
    const code = f[COL.code].trim();
    const name = f[COL.name].trim();
    const regn = f[COL.regn].trim();
    const toNum = (s) => {
      if (s === undefined || s === null || /^x$/i.test(s.trim()) || s.trim() === '') return 0;
      const n = Number(s);
      return Number.isFinite(n) ? n : 0;
    };
    // Energy is stored in kJ in the source; convert to kcal.
    const cal = Math.round((toNum(f[COL.energyKj]) / 4.184) * 10) / 10;
    out.push({
      code,
      name,
      regn,
      cal,
      protein: toNum(f[COL.protein]),
      carbs: toNum(f[COL.carbs]),
      fat: toNum(f[COL.fat]),
    });
  }

  mkdirSync(join(rootDir, 'assets', 'data'), { recursive: true });
  writeFileSync(outJsonPath, JSON.stringify(out), 'utf8');
  console.log(`[build] wrote ${outJsonPath} — ${out.length} rows, ${(Buffer.byteLength(JSON.stringify(out), 'utf8') / 1024).toFixed(1)} KB`);
  if (skipped > 0) console.log(`[build] WARNING: ${skipped} short/blank rows skipped`);
}

main().catch((err) => {
  console.error('[build] ERROR:', err);
  process.exit(1);
});
