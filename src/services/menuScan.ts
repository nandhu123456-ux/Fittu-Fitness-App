import { auth } from './firebase';

const MENU_URL = 'https://be-fit-api.nanda-dev.workers.dev/api/menu-scan';

export type MenuCategory = 'best' | 'moderate' | 'skip';

export interface MenuItem {
  name: string;
  category: MenuCategory;
  reason: string;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  estimated_portion: string;
}

export interface MenuScanResult {
  menu_type: string;
  items: MenuItem[];
}

export async function scanMenu(
  imageBase64: string,
  mimeType: string,
  remainingCal: number,
  targetProtein: number
): Promise<MenuScanResult | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    const idToken = await user.getIdToken();
    const res = await fetch(MENU_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ imageBase64, mimeType, remainingCal, targetProtein }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !Array.isArray(data.items)) return null;
    return {
      menu_type: String(data.menu_type ?? ''),
      items: data.items.map((i: { [k: string]: unknown }) => ({
        name: String(i.name ?? ''),
        category: (i.category === 'best' || i.category === 'moderate' || i.category === 'skip' ? i.category : 'moderate') as MenuCategory,
        reason: String(i.reason ?? ''),
        cal: Number(i.cal ?? 0),
        protein: Number(i.protein ?? 0),
        carbs: Number(i.carbs ?? 0),
        fat: Number(i.fat ?? 0),
        estimated_portion: String(i.estimated_portion ?? '1 serving'),
      })),
    };
  } catch (e) {
    console.warn('[menuScan] error', e);
    return null;
  }
}
