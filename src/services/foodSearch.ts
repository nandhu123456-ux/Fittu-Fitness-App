import Fuse from 'fuse.js';
import { collection, doc, getDoc, getDocs, limit, query, setDoc, where } from 'firebase/firestore';

import ifct from '../../assets/data/ifct2017.json';
import indianDishes from '../../assets/data/indianDishes.json';
import { db } from './firebase';
import { getCustomFoods } from './customFoods';
import { getCorrections } from './foodCorrections';
import { estimateNutritionFromName } from './estimateNutrition';
import { lookupViaVercel } from './vercelNutrition';

export interface FoodResult {
  id: string;
  name: string;
  source: 'local' | 'cache' | 'off' | 'usda' | 'custom';
  serving: string;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface OffProduct { code?: string; product_name?: string; serving_size?: string; nutriments?: Record<string, number>; }

const normalise = (value: string): string => value.trim().toLowerCase();
const termsFor = (name: string): string[] => normalise(name).split(/\s+/).filter(Boolean);
const toNumber = (value: unknown): number => Number.isFinite(Number(value)) ? Number(value) : 0;

interface RankableFood {
  id: string;
  name: string;
  aliases?: string[];
  serving: string;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  source: 'local';
}

function buildFuse(items: RankableFood[]): Fuse<RankableFood> {
  return new Fuse(items, {
    keys: [
      { name: 'name', weight: 2 },
      { name: 'aliases', weight: 1 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
    includeScore: true,
    minMatchCharLength: 2,
    shouldSort: true,
  });
}

/**
 * Ranks local results: exact > startsWith > word-start > word-boundary > alias,
 * with a Fuse.js fuzzy fallback when nothing matches directly. If a user
 * correction exists for this query, the corrected food is forced to the top.
 */
function rankLocal(
  items: RankableFood[],
  query: string,
  corrections?: Record<string, { chosenFoodId: string }>
): RankableFood[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const scored = items.map((item) => {
    const name = item.name.toLowerCase();
    const aliases = (item.aliases ?? []).map((a) => a.toLowerCase());
    let score = 0;

    // Name matches (strongest first)
    if (name === q) score = Math.max(score, 100);
    else if (name.startsWith(q)) score = Math.max(score, 90);
    else if (name.split(/\s+/).some((w) => w.startsWith(q))) score = Math.max(score, 80);
    else if (new RegExp(`\\b${q}\\b`).test(name)) score = Math.max(score, 70);

    // Alias matches (rank lower than name matches)
    for (const alias of aliases) {
      if (alias === q) score = Math.max(score, 80);
      else if (alias.startsWith(q)) score = Math.max(score, 70);
      else if (alias.split(/\s+/).some((w) => w.startsWith(q))) score = Math.max(score, 60);
      else if (new RegExp(`\\b${q}\\b`).test(alias)) score = Math.max(score, 50);
    }

    return { item, score };
  });

  const correction = corrections?.[q];

  let ranked: RankableFood[];
  const exact = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  if (exact.length === 0) {
    const fuse = buildFuse(items);
    ranked = fuse.search(q).map((r) => r.item);
  } else {
    ranked = exact.map((s) => s.item);
  }

  // Learning loop: force the user's previously-chosen food to the top.
  if (correction) {
    const idx = ranked.findIndex((r) => r.id === correction.chosenFoodId);
    if (idx > 0) {
      const [boosted] = ranked.splice(idx, 1);
      ranked.unshift(boosted);
    } else if (idx === -1) {
      const chosen = items.find((i) => i.id === correction.chosenFoodId);
      if (chosen) ranked.unshift(chosen);
    }
  }

  return ranked;
}

// Corrections are read from Firestore per-user; cache briefly to avoid a read
// on every keystroke-driven search.
let cachedCorrections: Record<string, { chosenFoodId: string }> = {};
let cachedCorrectionsAt = 0;
const CORRECTIONS_TTL = 5 * 60 * 1000;

async function loadCorrections(uid: string): Promise<Record<string, { chosenFoodId: string }>> {
  if (Date.now() - cachedCorrectionsAt < CORRECTIONS_TTL) return cachedCorrections;
  cachedCorrections = await getCorrections(uid);
  cachedCorrectionsAt = Date.now();
  return cachedCorrections;
}


async function cachedMatches(queryText: string): Promise<FoodResult[]> {
  const snapshots = await getDocs(query(collection(db, 'cachedFoods'), where('keywords', 'array-contains', normalise(queryText)), limit(20)));
  return snapshots.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data(), source: 'cache' } as FoodResult));
}

async function cacheOffResult(food: FoodResult): Promise<void> {
  const reference = doc(db, 'cachedFoods', food.id);
  if ((await getDoc(reference)).exists()) return;
  await setDoc(reference, { ...food, keywords: [...new Set([...termsFor(food.name), food.id.toLowerCase()])] });
}

async function offMatches(queryText: string): Promise<FoodResult[]> {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(queryText)}&search_simple=1&action=process&json=1&lc=en&page_size=20`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const payload = await response.json() as { products?: OffProduct[] };
  const results = (payload.products ?? []).filter((product) => product.code && product.product_name).map((product) => {
    const nutrients = product.nutriments ?? {};
    return { id: product.code as string, name: product.product_name as string, source: 'off' as const, serving: product.serving_size || '100g', cal: toNumber(nutrients['energy-kcal_100g'] ?? nutrients['energy-kcal']), protein: toNumber(nutrients.proteins_100g), carbs: toNumber(nutrients.carbohydrates_100g), fat: toNumber(nutrients.fat_100g) };
  });
  await Promise.all(results.map((food) => cacheOffResult(food).catch(() => undefined)));
  return results;
}

export async function searchFood(queryText: string, uid?: string): Promise<FoodResult[]> {
  if (!normalise(queryText)) return [];
  try {
    const localItems: RankableFood[] = indianDishes.map((d) => ({
      id: d.id,
      name: d.name,
      aliases: d.aliases,
      serving: d.serving,
      cal: d.cal,
      protein: d.protein,
      carbs: d.carbs,
      fat: d.fat,
      source: 'local' as const,
    }));
    const ifctItems: RankableFood[] = ifct.map((f) => ({
      id: f.code,
      name: f.name,
      serving: '100g',
      cal: f.cal,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      source: 'local' as const,
    }));
    const corrections = uid ? await loadCorrections(uid) : {};
    const ranked = rankLocal([...localItems, ...ifctItems], queryText, corrections);
    if (ranked.length) {
      return ranked.map((r) => ({
        id: r.id,
        name: r.name,
        source: 'local' as const,
        serving: r.serving,
        cal: r.cal,
        protein: r.protein,
        carbs: r.carbs,
        fat: r.fat,
      }));
    }
    const cached = await cachedMatches(queryText);
    if (cached.length) return cached;
    const off = await offMatches(queryText);
    if (off.length) return off;
    const vercel = await lookupViaVercel(queryText);
    if (vercel) return [vercel];
    if (uid) {
      const customs = await getCustomFoods(uid);
      const needle = normalise(queryText);
      const customHits = customs.filter((food) => normalise(food.name).includes(needle));
      if (customHits.length) return customHits;
    }
    // Last resort: AI estimate from the name alone (Indian dishes not in USDA/OFF).
    const aiEstimate = await estimateNutritionFromName(queryText);
    if (aiEstimate) return [aiEstimate];
    return [];
  } catch {
    return [];
  }
}
