import { useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { addFoodLog } from '../services/foodLogService';
import type { MealType } from '../services/foodLogs';
import { getTodaysTotals } from '../services/foodLogs';
import { scanMenu, type MenuItem, type MenuScanResult } from '../services/menuScan';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme';
import type { RootTabParamList } from '../types/navigation';

type MenuScanRoute = RouteProp<RootTabParamList, 'MenuScan'>;
type Navigation = BottomTabNavigationProp<RootTabParamList, 'MenuScan'>;

type Status = 'idle' | 'picking' | 'scanning' | 'result' | 'error';

const pickerOptions: ImagePicker.ImagePickerOptions = {
  mediaTypes: 'images',
  quality: 0.4,
  base64: false,
  allowsEditing: true,
  aspect: [3, 4],
  exif: false,
};

const BAR_HEIGHT = 90;

export default function MenuScanScreen() {
  const theme = useTheme();
  const route = useRoute<MenuScanRoute>();
  const navigation = useNavigation<Navigation>();
  const user = useAuthStore((state) => state.user);
  const targets = useAuthStore((state) => state.profile?.targets);
  const mealType: MealType = route.params?.mealType ?? 'snack';
  const uid = user?.uid;
  const insets = useSafeAreaInsets();

  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<MenuScanResult | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const themedStyles = useMemo(() => StyleSheet.create({
    screen: { backgroundColor: theme.colors.bg, flex: 1 },
    center: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
    circle: { alignItems: 'center', backgroundColor: theme.colors.accentGlow, borderRadius: 48, height: 96, justifyContent: 'center', width: 96 },
    circleScanning: { alignItems: 'center', backgroundColor: theme.colors.surfaceHi, borderColor: theme.colors.border, borderRadius: 48, borderWidth: 1, height: 96, justifyContent: 'center', width: 96 },
    title: { color: theme.colors.text, fontSize: 20, fontWeight: '600', marginTop: 20 },
    scanningTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '600', marginTop: 20 },
    subtitle: { color: theme.colors.muted, fontSize: 13, marginTop: 6, maxWidth: 260, textAlign: 'center' },
    scanningSub: { color: theme.colors.muted, fontSize: 13, marginTop: 6 },
    button: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 14, flexDirection: 'row', gap: 8, height: 52, justifyContent: 'center', width: '100%' },
    buttonText: { color: theme.colors.accentText, fontSize: 16, fontWeight: '700' },
    secondary: { alignItems: 'center', borderColor: theme.colors.border, borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 8, height: 52, justifyContent: 'center', width: '100%' },
    secondaryText: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
    resultHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
    headerTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '600' },
    itemsFound: { color: theme.colors.muted, fontSize: 13, paddingHorizontal: 20 },
    section: { marginTop: 16, paddingHorizontal: 20 },
    sectionLabel: { color: theme.colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8, textTransform: 'uppercase' },
    pill: { alignSelf: 'flex-start', backgroundColor: theme.colors.accentGlow, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
    pillText: { color: theme.colors.accent, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    itemCard: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', marginBottom: 10, overflow: 'hidden', padding: 14, width: '100%' },
    check: { alignItems: 'center', borderColor: theme.colors.border, borderRadius: 12, borderWidth: 2, height: 24, justifyContent: 'center', width: 24 },
    checkOn: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
    itemBody: { flex: 1, marginLeft: 12 },
    itemName: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
    itemReason: { color: theme.colors.muted, fontSize: 12, marginTop: 2 },
    itemMeta: { color: theme.colors.muted, fontSize: 11, marginTop: 4 },
    chevron: { color: theme.colors.muted },
    bar: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderTopWidth: 1, bottom: insets.bottom, left: 0, padding: 16, paddingBottom: 24, position: 'absolute', right: 0 },
    barRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
    barInfo: { flex: 1 },
    barSelected: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
    barTotal: { color: theme.colors.muted, fontSize: 13, marginTop: 2 },
    barBtn: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 12, flexDirection: 'row', gap: 6, height: 44, justifyContent: 'center', paddingHorizontal: 20, width: 150 },
    barBtnDisabled: { opacity: 0.5 },
    barBtnText: { color: theme.colors.accentText, fontSize: 15, fontWeight: '700' },
    errorCircle: { alignItems: 'center', marginTop: 8 },
    errorIcon: { color: theme.colors.muted },
    errorTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '600', marginTop: 12 },
    errorSub: { color: theme.colors.muted, fontSize: 13, marginTop: 6, maxWidth: 260, textAlign: 'center' },
    errorButtons: { flexDirection: 'row', gap: 10, marginTop: 22, paddingHorizontal: 20 },
    errorTryAgain: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 12, flex: 1, flexDirection: 'row', gap: 6, height: 50, justifyContent: 'center' },
    errorTryAgainText: { color: theme.colors.accentText, fontWeight: '700' },
    errorCancel: { alignItems: 'center', borderColor: theme.colors.border, borderRadius: 12, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 6, height: 50, justifyContent: 'center' },
    errorCancelText: { color: theme.colors.text, fontWeight: '600' },
  }), [theme, insets.bottom]);

  const toggle = (index: number): void => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  };

  const selectedTotal = (): number => {
    if (!result) return 0;
    return [...selected].reduce((sum, i) => sum + (result.items[i]?.cal ?? 0), 0);
  };

  const pick = async (launch: (options: ImagePicker.ImagePickerOptions) => Promise<ImagePicker.ImagePickerResult>): Promise<void> => {
    setStatus('picking');
    try {
      const picked = await launch(pickerOptions);
      if (picked.canceled || !picked.assets?.[0]) { setStatus('idle'); return; }
      setStatus('scanning');
      const manip = await manipulateAsync(picked.assets[0].uri, [{ resize: { width: 1000 } }], { compress: 0.6, format: SaveFormat.JPEG, base64: true });
      if (!manip.base64) { setStatus('error'); return; }
      let remainingCal = 0;
      let targetProtein = 0;
      if (uid) {
        const totals = await getTodaysTotals(uid);
        remainingCal = Math.max(0, Math.round((targets?.calories ?? 0) - totals.calories));
        targetProtein = targets?.protein ?? 0;
      }
      const scan = await scanMenu(manip.base64, 'image/jpeg', remainingCal, targetProtein);
      if (!scan || scan.items.length === 0) { setStatus('error'); return; }
      setResult(scan);
      setSelected(new Set());
      setStatus('result');
    } catch {
      setStatus('error');
    }
  };

  const logSelected = async (): Promise<void> => {
    if (!uid || !result || selected.size === 0) return;
    setSaving(true);
    try {
      for (const index of selected) {
        const item: MenuItem | undefined = result.items[index];
        if (!item) continue;
        await addFoodLog(uid, {
          mealType,
          food: { id: `menu_${Date.now()}_${index}`, name: item.name, source: 'custom', serving: item.estimated_portion, cal: item.cal, protein: item.protein, carbs: item.carbs, fat: item.fat },
          servings: 1,
        });
      }
      navigation.navigate('Log', { mealType });
    } catch {
      Alert.alert('Could not log items.', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const sectionColor = (category: string): string => {
    if (category === 'best') return theme.colors.accent;
    if (category === 'moderate') return theme.colors.warn;
    return theme.colors.danger;
  };

  const sectionLabel = (category: string): string => {
    if (category === 'best') return 'ORDER THIS';
    if (category === 'moderate') return 'IN MODERATION';
    return 'SKIP TONIGHT';
  };

  const renderSection = (category: 'best' | 'moderate' | 'skip'): ReactNode => {
    if (!result) return null;
    const entries = result.items.map((item, index) => ({ item, index })).filter((e) => e.item.category === category);
    if (entries.length === 0) return null;
    return (
      <View key={category} style={themedStyles.section}>
        <Text style={[themedStyles.sectionLabel, { color: sectionColor(category) }]}>{sectionLabel(category)}</Text>
        {entries.map(({ item, index }) => {
          const isOn = selected.has(index);
          return (
            <Pressable
              key={`${item.name}-${index}`}
              onPress={() => toggle(index)}
              onPressIn={() => setPressedIndex(index)}
              onPressOut={() => setPressedIndex(null)}
              style={[themedStyles.itemCard, isOn ? { borderColor: theme.colors.accent } : {}, pressedIndex === index ? { opacity: 0.7 } : {}]}
            >
              <View style={[themedStyles.check, isOn && themedStyles.checkOn]}>
                {isOn ? <Ionicons color={theme.colors.accentText} name="checkmark" size={16} /> : null}
              </View>
              <View style={themedStyles.itemBody}>
                <Text style={themedStyles.itemName}>{item.name}</Text>
                <Text style={themedStyles.itemReason}>{item.reason}</Text>
                <Text style={themedStyles.itemMeta}>{Math.round(item.cal)} kcal · P {Math.round(item.protein)}g · C {Math.round(item.carbs)}g · F {Math.round(item.fat)}g</Text>
              </View>
              <Ionicons color={theme.colors.muted} name="chevron-forward" size={18} style={themedStyles.chevron} />
            </Pressable>
          );
        })}
      </View>
    );
  };

  const idleContent = (
    <>
      <View style={themedStyles.circle}>
        <Ionicons color={theme.colors.accent} name="restaurant" size={56} />
      </View>
      <Text style={themedStyles.title}>Scan a menu</Text>
      <Text style={themedStyles.subtitle}>Point at any restaurant menu. We'll suggest what fits your day.</Text>
      <View style={{ marginTop: 24, width: '100%' }}>
        <Pressable disabled={status === 'picking'} onPress={() => void pick(ImagePicker.launchCameraAsync)} style={themedStyles.button}>
          <Ionicons color={theme.colors.accentText} name="camera" size={20} />
          <Text style={themedStyles.buttonText}>Take Photo</Text>
        </Pressable>
        <Pressable disabled={status === 'picking'} onPress={() => void pick(ImagePicker.launchImageLibraryAsync)} style={[themedStyles.secondary, { marginTop: 12 }]}>
          <Ionicons color={theme.colors.text} name="images" size={20} />
          <Text style={themedStyles.secondaryText}>Choose from Library</Text>
        </Pressable>
      </View>
    </>
  );

  return (
    <SafeAreaView style={themedStyles.screen}>
      {status === 'result' && result ? (
        <>
          <View style={themedStyles.resultHeader}>
            <Pressable hitSlop={12} onPress={() => navigation.goBack()}>
              <Ionicons color={theme.colors.text} name="chevron-back" size={24} />
            </Pressable>
            <Text style={themedStyles.headerTitle}>Menu scan</Text>
            <View style={themedStyles.pill}>
              <Text style={themedStyles.pillText}>{result.menu_type || 'Menu'}</Text>
            </View>
          </View>
          <Text style={themedStyles.itemsFound}>{result.items.length} items found</Text>
          <ScrollView contentContainerStyle={{ paddingBottom: BAR_HEIGHT + insets.bottom }} keyboardShouldPersistTaps="handled">
            {renderSection('best')}
            {renderSection('moderate')}
            {renderSection('skip')}
          </ScrollView>
          <View style={themedStyles.bar}>
            <View style={themedStyles.barRow}>
              <View style={themedStyles.barInfo}>
                <Text style={themedStyles.barSelected}>{selected.size} selected</Text>
                <Text style={themedStyles.barTotal}>{Math.round(selectedTotal())} kcal</Text>
              </View>
              <Pressable disabled={selected.size === 0 || saving} onPress={() => void logSelected()} style={[themedStyles.barBtn, (selected.size === 0 || saving) && themedStyles.barBtnDisabled]}>
                <Text style={themedStyles.barBtnText}>{saving ? 'Logging…' : 'Log items'}</Text>
              </Pressable>
            </View>
          </View>
        </>
      ) : (
        <View style={themedStyles.center}>
          {status === 'scanning' ? (
            <>
              <View style={themedStyles.circleScanning}><ActivityIndicator color={theme.colors.accent} size="large" /></View>
              <Text style={themedStyles.scanningTitle}>Reading the menu…</Text>
              <Text style={themedStyles.scanningSub}>This usually takes a few seconds.</Text>
            </>
          ) : status === 'error' ? (
            <>
              <View style={themedStyles.errorCircle}><Ionicons color={theme.colors.muted} name="alert-circle-outline" size={48} /></View>
              <Text style={themedStyles.errorTitle}>Couldn't read that menu</Text>
              <Text style={themedStyles.errorSub}>Try a clearer photo or type the dish name instead.</Text>
              <View style={themedStyles.errorButtons}>
                <Pressable onPress={() => setStatus('idle')} style={themedStyles.errorTryAgain}><Text style={themedStyles.errorTryAgainText}>Try again</Text></Pressable>
                <Pressable onPress={() => navigation.goBack()} style={themedStyles.errorCancel}><Text style={themedStyles.errorCancelText}>Cancel</Text></Pressable>
              </View>
            </>
          ) : idleContent}
        </View>
      )}
    </SafeAreaView>
  );
}