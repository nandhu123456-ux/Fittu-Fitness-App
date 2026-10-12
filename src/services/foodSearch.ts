import { collection, doc, getDoc, getDocs, limit, query, setDoc, where } from 'firebase/firestore';

import ifct from '../../assets/data/ifct2017.json';
import indianDishes from '../../assets/data/indianDishes.json';
import { db } from './firebase';

export interface FoodResult {
  id: string;
  name: string;
  source: 'local' | 'cache' | 'off';
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

function localMatches(queryText: string): FoodResult[] {
  const needle = normalise(queryText);
  if (!needle) return [];
  const dishHits = indianDishes.filter((dish) => {
    const haystack = normalise(`${dish.name} ${dish.aliases.join(' ')}`);
    return haystack.includes(needle);
  });
  const ingredientHits = ifct.filter((item) => {
    const haystack = normalise(`${item.name} ${item.regn}`);
    return haystack.includes(needle);
  });
  const dishResults = dishHits.slice(0, 20).map((dish) => ({
    id: dish.id,
    name: dish.name,
    source: 'local' as const,
    serving: dish.serving,
    cal: dish.cal,
    protein: dish.protein,
    carbs: dish.carbs,
    fat: dish.fat,
  }));
  const ingredientResults = ingredientHits.slice(0, 20).map((item) => ({
    id: item.code,
    name: item.name,
    source: 'local' as const,
    serving: '100g',
    cal: item.cal,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
  }));
  return [...dishResults, ...ingredientResults].slice(0, 40);
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

export async function searchFood(queryText: string): Promise<FoodResult[]> {
  if (!normalise(queryText)) return [];
  try {
    const local = localMatches(queryText);
    if (local.length) return local;
    const cached = await cachedMatches(queryText);
    if (cached.length) return cached;
    return await offMatches(queryText);
  } catch {
    return [];
  }
}
