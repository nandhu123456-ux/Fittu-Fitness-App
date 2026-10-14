import { useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
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

export default function MenuScanScreen() {
  const theme = useTheme();
  const route = useRoute<MenuScanRoute>();
  const navigation = useNavigation<Navigation>();
  const user = useAuthStore((state) => state.user);
  const targets = useAuthStore((state) => state.profile?.targets);
  const mealType: MealType = route.params?.mealType ?? 'snack';
  const uid = user?.uid;

  const [status, setStatus] = useState<Status>('idle');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<MenuScanResult | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  const themedStyles = useMemo(() => StyleSheet.create({
    screen: { backgroundColor: theme.colors.bg, flex: 1 },
    header: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12 },
    backBtn: { padding: 6 },
    headerTitle: { color: theme.colors.text, flex: 1, fontSize: 20, fontWeight: '700' },
    content: { padding: 20, gap: 18 },
    hero: { alignItems: 'center', gap: 12, paddingVertical: 40 },
    heroCircle: { alignItems: 'center', backgroundColor: theme.colors.surfaceHi, borderRadius: 64, height: 128, justifyContent: 'center', width: 128 },
    heroTitle: { color: theme.colors.text, fontSize: 22, fontWeight: '700' },
    heroSub: { color: theme.colors.muted, fontSize: 14, textAlign: 'center' },
    button: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 14, flexDirection: 'row', gap: 8, justifyContent: 'center', padding: 15 },
    buttonText: { color: theme.colors.bg, fontWeight: '700' },
    secondary: { alignItems: 'center', borderColor: theme.colors.border, borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', padding: 15 },
    secondaryText: { color: theme.colors.text, fontWeight: '600' },
    preview: { borderRadius: 18, height: 320, width: '100%' },
    center: { alignItems: 'center', gap: 12, paddingVertical: 24 },
    statusText: { color: theme.colors.muted, fontSize: 14 },
    pill: { alignSelf: 'flex-start', backgroundColor: theme.colors.surfaceHi, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
    pillText: { color: theme.colors.accent, fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
    sectionLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
    itemCard: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 12, marginBottom: 10, padding: 14 },
    check: { alignItems: 'center', borderColor: theme.colors.border, borderRadius: 8, borderWidth: 2, height: 24, justifyContent: 'center', width: 24 },
    checkOn: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
    itemBody: { flex: 1 },
    itemName: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
    itemReason: { color: theme.colors.muted, fontSize: 12, marginTop: 3 },
    itemMeta: { color: theme.colors.muted, fontSize: 12, marginTop: 4 },
    bar: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderTopWidth: 1, flexDirection: 'row', gap: 14, padding: 16, paddingBottom: 28 },
    barInfo: { flex: 1 },
    barTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
    barSub: { color: theme.colors.muted, fontSize: 12, marginTop: 2 },
    barBtn: { backgroundColor: theme.colors.accent, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
    barBtnText: { color: theme.colors.bg, fontWeight: '700' },
  }), [theme]);

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
      setImageUri(manip.uri);
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

  const renderSection = (category: 'best' | 'moderate' | 'skip', label: string): ReactNode => {
    if (!result) return null;
    const entries = result.items.map((item, index) => ({ item, index })).filter((e) => e.item.category === category);
    if (entries.length === 0) return null;
    return (
      <View>
        <Text style={[themedStyles.sectionLabel, { color: sectionColor(category) }]}>{label}</Text>
        {entries.map(({ item, index }) => {
          const isOn = selected.has(index);
          return (
            <Pressable key={`${item.name}-${index}`} onPress={() => toggle(index)} style={[themedStyles.itemCard, isOn && { borderColor: theme.colors.accent }]}>
              <View style={[themedStyles.check, isOn && themedStyles.checkOn]}>
                {isOn ? <Ionicons color={theme.colors.bg} name="checkmark" size={16} /> : null}
              </View>
              <View style={themedStyles.itemBody}>
                <Text style={themedStyles.itemName}>{item.name}</Text>
                <Text style={themedStyles.itemReason}>{item.reason}</Text>
                <Text style={themedStyles.itemMeta}>{Math.round(item.cal)} kcal · P {Math.round(item.protein)}g · {item.estimated_portion}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  };


  return (
    <View style={themedStyles.screen}>
      <View style={themedStyles.header}>
        <Pressable hitSlop={12} onPress={() => navigation.goBack()} style={themedStyles.backBtn}>
          <Ionicons color={theme.colors.text} name="chevron-back" size={26} />
        </Pressable>
        <Text style={themedStyles.headerTitle}>Menu scanner</Text>
      </View>

      <ScrollView contentContainerStyle={themedStyles.content}>
        {(status === 'idle' || status === 'picking') && (
          <View style={themedStyles.hero}>
            <View style={themedStyles.heroCircle}>
              <Ionicons color={theme.colors.accent} name="restaurant" size={56} />
            </View>
            <Text style={themedStyles.heroTitle}>Take a photo of the menu</Text>
            <Text style={themedStyles.heroSub}>We'll tell you what fits your day and log it in one tap.</Text>
            <Pressable disabled={status === 'picking'} onPress={() => void pick(ImagePicker.launchCameraAsync)} style={themedStyles.button}>
              <Ionicons color={theme.colors.bg} name="camera" size={20} />
              <Text style={themedStyles.buttonText}>Take photo</Text>
            </Pressable>
            <Pressable disabled={status === 'picking'} onPress={() => void pick(ImagePicker.launchImageLibraryAsync)} style={themedStyles.secondary}>
              <Ionicons color={theme.colors.text} name="images" size={20} />
              <Text style={themedStyles.secondaryText}>Choose from library</Text>
            </Pressable>
          </View>
        )}

        {status === 'scanning' && (
          <View style={themedStyles.hero}>
            {imageUri && <Image resizeMode="cover" source={{ uri: imageUri }} style={themedStyles.preview} />}
            <View style={themedStyles.center}>
              <ActivityIndicator color={theme.colors.accent} size="large" />
              <Text style={themedStyles.statusText}>Reading the menu…</Text>
            </View>
          </View>
        )}

        {status === 'error' && (
          <View style={themedStyles.hero}>
            <View style={themedStyles.heroCircle}>
              <Ionicons color={theme.colors.danger} name="alert-circle" size={56} />
            </View>
            <Text style={themedStyles.heroTitle}>Couldn't read that menu</Text>
            <Text style={themedStyles.heroSub}>Try a clearer, well-lit photo of the menu.</Text>
            <Pressable onPress={() => setStatus('idle')} style={themedStyles.button}>
              <Ionicons color={theme.colors.bg} name="refresh" size={20} />
              <Text style={themedStyles.buttonText}>Try again</Text>
            </Pressable>
          </View>
        )}

        {status === 'result' && result && (
          <>
            <View style={themedStyles.pill}>
              <Text style={themedStyles.pillText}>{result.menu_type || 'Menu'}</Text>
            </View>
            {renderSection('best', 'Order this')}
            {renderSection('moderate', 'Okay in moderation')}
            {renderSection('skip', 'Skip tonight')}
          </>
        )}
      </ScrollView>

      {status === 'result' && result && (
        <View style={themedStyles.bar}>
          <View style={themedStyles.barInfo}>
            <Text style={themedStyles.barTitle}>Log {selected.size} item{selected.size === 1 ? '' : 's'}</Text>
            <Text style={themedStyles.barSub}>{Math.round(selectedTotal())} kcal total</Text>
          </View>
          <Pressable disabled={selected.size === 0 || saving} onPress={() => void logSelected()} style={[themedStyles.barBtn, (selected.size === 0 || saving) && { opacity: 0.5 }]}>
            <Text style={themedStyles.barBtnText}>{saving ? 'Adding…' : 'Add to log'}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

