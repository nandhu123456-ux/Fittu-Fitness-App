import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { PortionModal } from '../components/PortionModal';
import { colors } from '../constants/colors';
import type { MealType } from '../services/foodLogs';
import { addFoodLog } from '../services/foodLogService';
import { useAuthStore } from '../store/authStore';
import type { RootTabParamList } from '../types/navigation';

export interface BarcodeFood {
  id: string;
  name: string;
  source: 'off';
  serving: string;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface OffNutriments {
  [key: string]: number | undefined;
}
interface OffProduct {
  product_name?: string;
  generic_name?: string;
  nutriments?: OffNutriments;
}
interface OffPayload {
  status?: number;
  product?: OffProduct | null;
}

const FRAME = 240;
const DIM = 'rgba(0,0,0,0.62)';

const num = (value: number | undefined): number => (Number.isFinite(value) ? (value as number) : 0);
const round1 = (value: number): number => Math.round(value * 10) / 10;

function toBarcodeFood(barcode: string, product: OffProduct): BarcodeFood {
  const nutrients = product.nutriments ?? {};
  const kcal = num(nutrients['energy-kcal_100g']);
  const kj = num(nutrients['energy-kj_100g']);
  const energy = kcal > 0 ? kcal : kj > 0 ? kj / 4.184 : 0;
  return {
    id: `off_${barcode}`,
    name: (product.product_name || product.generic_name || 'Scanned product').trim(),
    source: 'off',
    serving: '100g',
    cal: round1(energy),
    protein: round1(num(nutrients.proteins_100g)),
    carbs: round1(num(nutrients.carbohydrates_100g)),
    fat: round1(num(nutrients.fat_100g)),
  };
}

const defaultMealType = (): MealType => {
  const hour = new Date().getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 21) return 'snack';
  return 'dinner';
};

export default function BarcodeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList, 'Barcode'>>();
  const { user } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();
  const scanned = useRef(false);
  const [food, setFood] = useState<BarcodeFood | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [torch, setTorch] = useState(false);

  const reset = (): void => {
    scanned.current = false;
    setNotFound(false);
    setError(null);
    setNotice(null);
  };

  const handleScan = async ({ data }: BarcodeScanningResult): Promise<void> => {
    if (scanned.current) return;
    scanned.current = true;
    setLoading(true);
    setNotFound(false);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(data)}.json`,
      );
      if (!response.ok) throw new Error('lookup-failed');
      const payload = (await response.json()) as OffPayload;
      const product = payload.status === 1 ? payload.product : null;
      const nutrients = product?.nutriments;
      if (product && nutrients && Object.keys(nutrients).length > 0) {
        setFood(toBarcodeFood(data, product));
        setModalVisible(true);
      } else {
        setNotFound(true);
      }
    } catch {
      setError('Could not reach OpenFoodFacts. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (servings: number): Promise<void> => {
    if (!food) return;
    setModalVisible(false);
    if (user) {
      try {
        await addFoodLog(user.uid, { mealType: defaultMealType(), food, servings });
      } catch {
        setFood(null);
        reset();
        setError('Could not save this entry. Please try again.');
        return;
      }
    }
    navigation.goBack();
  };

  const handleCancelModal = (): void => {
    setModalVisible(false);
    setFood(null);
    reset();
  };
  if (permission === null) {
    return (
      <View style={[styles.fill, styles.center]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.fill, styles.center, styles.padded]}>
        <Ionicons color={colors.muted} name="camera-outline" size={52} />
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionBody}>Grant camera permission to scan product barcodes.</Text>
        <Pressable onPress={() => void requestPermission()} style={styles.grantButton}>
          <Text style={styles.grantText}>Grant permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <CameraView
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
        enableTorch={torch}
        onBarcodeScanned={(result) => void handleScan(result)}
        style={StyleSheet.absoluteFill}
      />

      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View style={styles.topBar}>
          <Pressable hitSlop={12} onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons color={colors.text} name="close" size={26} />
          </Pressable>
          <Pressable hitSlop={12} onPress={() => setTorch((value) => !value)} style={styles.iconButton}>
            <Ionicons color={torch ? colors.accent : colors.text} name={torch ? 'flash' : 'flash-off'} size={26} />
          </Pressable>
        </View>

        <View style={styles.dim} />
        <View style={styles.middleRow}>
          <View style={styles.dimSide} />
          <View style={styles.frame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.dimSide} />
        </View>
        <View style={styles.dim}>
          <Text style={styles.hint}>Point at a barcode</Text>
        </View>
      </View>

      {loading && (
        <View pointerEvents="auto" style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={styles.loadingText}>Looking up product…</Text>
        </View>
      )}

      {(notFound || error !== null) && (
        <View pointerEvents="box-none" style={styles.statusWrap}>
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>{error ?? 'Product not found. Add as custom food?'}</Text>
            {notice !== null && <Text style={styles.notice}>{notice}</Text>}
            <View style={styles.statusActions}>
              {!error && !notice && (
                <Pressable
                  onPress={() => setNotice('Custom food entry coming soon.')}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryText}>Add custom</Text>
                </Pressable>
              )}
              <Pressable onPress={reset} style={styles.primaryButton}>
                <Text style={styles.primaryText}>Scan again</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      <PortionModal
        food={food}
        onClose={handleCancelModal}
        onConfirm={(servings) => void handleConfirm(servings)}
        visible={modalVisible}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  padded: { gap: 14, paddingHorizontal: 32 },
  permissionTitle: { color: colors.text, fontSize: 22, fontWeight: '700', marginTop: 18 },
  permissionBody: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  grantButton: { backgroundColor: colors.accent, borderRadius: 12, marginTop: 10, paddingHorizontal: 28, paddingVertical: 14 },
  grantText: { color: colors.bg, fontSize: 15, fontWeight: '700' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  iconButton: { backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 22, padding: 8 },
  dim: { alignItems: 'center', backgroundColor: DIM, flex: 1, justifyContent: 'flex-end', paddingBottom: 28 },
  dimSide: { backgroundColor: DIM, flex: 1 },
  middleRow: { flexDirection: 'row', height: FRAME },
  frame: { borderColor: colors.accent, borderRadius: 24, borderWidth: 2, height: FRAME, width: FRAME },
  corner: { borderColor: colors.accent, height: 30, position: 'absolute', width: 30 },
  cornerTL: { borderTopLeftRadius: 22, borderTopWidth: 4, borderLeftWidth: 4, left: -1, top: -1 },
  cornerTR: { borderTopRightRadius: 22, borderTopWidth: 4, borderRightWidth: 4, right: -1, top: -1 },
  cornerBL: { borderBottomLeftRadius: 22, borderBottomWidth: 4, borderLeftWidth: 4, bottom: -1, left: -1 },
  cornerBR: { borderBottomRightRadius: 22, borderBottomWidth: 4, borderRightWidth: 4, bottom: -1, right: -1 },
  hint: { color: colors.text, fontSize: 14, fontWeight: '500' },
  loadingOverlay: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', gap: 14, justifyContent: 'center', ...StyleSheet.absoluteFillObject },
  loadingText: { color: colors.text, fontSize: 15 },
  statusWrap: { bottom: 48, left: 24, position: 'absolute', right: 24 },
  statusCard: { backgroundColor: colors.surfaceHi, borderColor: colors.border, borderRadius: 20, borderWidth: 1, gap: 14, padding: 20 },
  statusText: { color: colors.text, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  notice: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  statusActions: { flexDirection: 'row', gap: 12 },
  secondaryButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, flex: 1, padding: 14 },
  secondaryText: { color: colors.text, fontWeight: '600' },
  primaryButton: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 12, flex: 1, padding: 14 },
  primaryText: { color: colors.bg, fontWeight: '700' },
});

