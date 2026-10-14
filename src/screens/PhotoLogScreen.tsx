import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { addFoodLog } from '../services/foodLogService';
import type { MealType } from '../services/foodLogs';
import { analyzeMealPhoto } from '../services/mealAnalysis';
import { searchFood } from '../services/foodSearch';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme';
import type { RootTabParamList } from '../types/navigation';

type PhotoLogRoute = RouteProp<RootTabParamList, 'PhotoLog'>;
type Navigation = BottomTabNavigationProp<RootTabParamList, 'PhotoLog'>;

type Status = 'idle' | 'uploading' | 'analyzing' | 'review' | 'error';

interface EditableItem {
  id: string;
  name: string;
  serving: string;
  cal: string;
  protein: string;
  carbs: string;
  fat: string;
  updated: boolean;
}

const pickerOptions: ImagePicker.ImagePickerOptions = {
  mediaTypes: 'images',
  quality: 0.4,
  base64: false,
  allowsEditing: true,
  aspect: [4, 3],
  exif: false,
};

const toItem = (food: { id: string; name: string; serving: string; cal: number; protein: number; carbs: number; fat: number }): EditableItem => ({
  id: food.id,
  name: food.name,
  serving: food.serving,
  cal: String(Math.round(food.cal)),
  protein: String(Math.round(food.protein * 10) / 10),
  carbs: String(Math.round(food.carbs * 10) / 10),
  fat: String(Math.round(food.fat * 10) / 10),
  updated: false,
});

export default function PhotoLogScreen() {
  const theme = useTheme();
  const route = useRoute<PhotoLogRoute>();
  const navigation = useNavigation<Navigation>();
  const user = useAuthStore((state) => state.user);
  const mealType: MealType = route.params?.mealType ?? 'breakfast';
  const themedStyles = useMemo(() => StyleSheet.create({
    screen: { backgroundColor: theme.colors.bg, flex: 1 },
    content: { padding: 20, gap: 16 },
    title: { color: theme.colors.text, fontSize: 24, fontWeight: '700' },
    subtitle: { color: theme.colors.muted, fontSize: 13, marginTop: 3 },
    button: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 14, flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', padding: 15 },
    buttonText: { color: theme.colors.bg, fontWeight: '700' },
    secondary: { alignItems: 'center', borderColor: theme.colors.border, borderRadius: 14, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', padding: 15 },
    secondaryText: { color: theme.colors.text, fontWeight: '600' },
    preview: { borderRadius: 16, height: 180, width: '100%' },
    state: { alignItems: 'center', gap: 10, paddingVertical: 30 },
    stateText: { color: theme.colors.muted, fontSize: 14 },
    card: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 16, borderWidth: 1, gap: 10, padding: 14 },
    cardTop: { alignItems: 'center', flexDirection: 'row', gap: 10 },
    nameInput: { color: theme.colors.text, flex: 1, fontSize: 16, fontWeight: '600', paddingVertical: 4 },
    servingInput: { color: theme.colors.muted, fontSize: 13, paddingVertical: 4 },
    macroRow: { flexDirection: 'row', gap: 8 },
    macroField: { alignItems: 'center', backgroundColor: theme.colors.surfaceHi, borderRadius: 10, flex: 1, paddingHorizontal: 8, paddingVertical: 6 },
    macroLabel: { color: theme.colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    macroInput: { color: theme.colors.text, fontSize: 14, fontWeight: '600', paddingVertical: 2, textAlign: 'center', width: '100%' },
    updatedTag: { color: theme.colors.accent, fontSize: 11, fontWeight: '600' },
    trash: { padding: 4 },
    addItem: { alignItems: 'center', borderColor: theme.colors.border, borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', padding: 14 },
    addItemText: { color: theme.colors.accent, fontSize: 14, fontWeight: '600' },
    bottom: { borderColor: theme.colors.border, borderTopWidth: 1, flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 28 },
  }), [theme]);

  const patch = (id: string, changes: Partial<EditableItem>): void => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...changes } : it)));
  };

  const remove = (id: string): void => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const addItem = (): void => {
    setItems((prev) => [...prev, { id: `manual_${Date.now()}`, name: '', serving: '1 serving', cal: '0', protein: '0', carbs: '0', fat: '0', updated: false }]);
  };

  // On name blur, look the name up and refill macros if there's a confident match.
  const refillFromName = async (id: string, newName: string): Promise<void> => {
    const trimmed = newName.trim();
    if (trimmed.length < 2) return;
    try {
      const results = await searchFood(trimmed, uid);
      if (!results.length) return;
      const top = results[0];
      const topName = top.name.toLowerCase();
      if (topName.startsWith(trimmed.toLowerCase())) {
        patch(id, { serving: top.serving, cal: String(Math.round(top.cal)), protein: String(Math.round(top.protein * 10) / 10), carbs: String(Math.round(top.carbs * 10) / 10), fat: String(Math.round(top.fat * 10) / 10), updated: true });
      }
    } catch {
      // ignore — leave the item unchanged
    }
  };


  const uid = user?.uid;

  const [status, setStatus] = useState<Status>('idle');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [saving, setSaving] = useState(false);
  const analyze = async (asset: ImagePicker.ImagePickerAsset): Promise<void> => {
    setStatus('uploading');
    try {
      const manip = await manipulateAsync(asset.uri, [{ resize: { width: 800 } }], { compress: 0.5, format: SaveFormat.JPEG, base64: true });
      if (!manip.base64) { setStatus('error'); return; }
      setImageUri(manip.uri);
      setStatus('analyzing');
      const results = await analyzeMealPhoto(manip.base64, 'image/jpeg');
      if (results.length === 0) { setStatus('error'); return; }
      setItems(results.map(toItem));
      setStatus('review');
    } catch {
      setStatus('error');
    }
  };

  const pick = async (launch: (options: ImagePicker.ImagePickerOptions) => Promise<ImagePicker.ImagePickerResult>): Promise<void> => {
    try {
      const result = await launch(pickerOptions);
      if (result.canceled || !result.assets?.[0]) { setStatus('idle'); return; }
      await analyze(result.assets[0]);
    } catch {
      setStatus('error');
    }
  };

  const saveAll = async (): Promise<void> => {
    if (!uid) return;
    const valid = items.filter((it) => it.name.trim().length > 0);
    if (valid.length === 0) { Alert.alert('Nothing to log.', 'Add at least one named item.'); return; }
    setSaving(true);
    try {
      for (const it of valid) {
        await addFoodLog(uid, {
          mealType,
          food: {
            id: it.id,
            name: it.name.trim(),
            source: 'custom',
            serving: it.serving || '1 serving',
            cal: Number(it.cal) || 0,
            protein: Number(it.protein) || 0,
            carbs: Number(it.carbs) || 0,
            fat: Number(it.fat) || 0,
          },
          servings: 1,
        });
      }
      navigation.navigate('Log', { mealType });
    } catch {
      Alert.alert('Could not save items.', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };


  return (
    <KeyboardAvoidingView style={themedStyles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={themedStyles.content} keyboardShouldPersistTaps="handled">
        {(status === 'idle' || status === 'uploading') && (
          <>
            <View>
              <Text style={themedStyles.title}>Snap your meal</Text>
              <Text style={themedStyles.subtitle}>Photograph your plate — we'll list every dish for you to edit.</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable onPress={() => void pick(ImagePicker.launchCameraAsync)} style={themedStyles.button}>
                <Ionicons color={theme.colors.bg} name="camera" size={20} />
                <Text style={themedStyles.buttonText}>Take Photo</Text>
              </Pressable>
              <Pressable onPress={() => void pick(ImagePicker.launchImageLibraryAsync)} style={themedStyles.secondary}>
                <Ionicons color={theme.colors.text} name="images" size={20} />
                <Text style={themedStyles.secondaryText}>Library</Text>
              </Pressable>
            </View>
          </>
        )}

        {(status === 'uploading' || status === 'analyzing') && (
          <View style={themedStyles.state}>
            <ActivityIndicator color={theme.colors.accent} size="large" />
            <Text style={themedStyles.stateText}>{status === 'uploading' ? 'Preparing photo…' : 'Identifying your meal…'}</Text>
          </View>
        )}

        {status === 'error' && (
          <View style={themedStyles.state}>
            <Ionicons color={theme.colors.danger} name="alert-circle" size={44} />
            <Text style={themedStyles.stateText}>Couldn't identify the food. Try a clearer photo.</Text>
            <Pressable onPress={() => setStatus('idle')} style={themedStyles.button}>
              <Text style={themedStyles.buttonText}>Try again</Text>
            </Pressable>
          </View>
        )}

        {status === 'review' && (
          <>
            {imageUri && <Image resizeMode="cover" source={{ uri: imageUri }} style={themedStyles.preview} />}
            <Text style={themedStyles.subtitle}>{items.length} item{items.length === 1 ? '' : 's'} detected · edit any value or remove items</Text>

            {items.map((it) => (
              <View key={it.id} style={themedStyles.card}>
                <View style={themedStyles.cardTop}>
                  <TextInput
                    onChangeText={(text) => patch(it.id, { name: text })}
                    onBlur={() => void refillFromName(it.id, it.name)}
                    placeholder="Food name"
                    placeholderTextColor={theme.colors.muted}
                    style={themedStyles.nameInput}
                    value={it.name}
                  />
                  {it.updated && <Text style={themedStyles.updatedTag}>Updated</Text>}
                  <Pressable hitSlop={10} onPress={() => remove(it.id)} style={themedStyles.trash}>
                    <Ionicons color={theme.colors.danger} name="trash-outline" size={20} />
                  </Pressable>
                </View>
                <TextInput
                  onChangeText={(text) => patch(it.id, { serving: text })}
                  placeholder="Serving (e.g. 1 plate)"
                  placeholderTextColor={theme.colors.muted}
                  style={themedStyles.servingInput}
                  value={it.serving}
                />
                <View style={themedStyles.macroRow}>
                  {([
                    { label: 'CAL', key: 'cal' as const },
                    { label: 'P', key: 'protein' as const },
                    { label: 'C', key: 'carbs' as const },
                    { label: 'F', key: 'fat' as const },
                  ]).map((field) => (
                    <View key={field.key} style={themedStyles.macroField}>
                      <Text style={themedStyles.macroLabel}>{field.label}</Text>
                      <TextInput
                        keyboardType="numeric"
                        onChangeText={(text) => patch(it.id, { [field.key]: text })}
                        style={themedStyles.macroInput}
                        value={it[field.key]}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ))}

            <Pressable onPress={addItem} style={themedStyles.addItem}>
              <Ionicons color={theme.colors.accent} name="add-circle-outline" size={20} />
              <Text style={themedStyles.addItemText}>Add item</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      {status === 'review' && (
        <View style={themedStyles.bottom}>
          <Pressable onPress={() => navigation.goBack()} style={themedStyles.secondary}>
            <Text style={themedStyles.secondaryText}>Cancel</Text>
          </Pressable>
          <Pressable disabled={saving} onPress={() => void saveAll()} style={[themedStyles.button, saving && { opacity: 0.6 }]}>
            <Text style={themedStyles.buttonText}>{saving ? 'Saving…' : `Log ${items.length} item${items.length === 1 ? '' : 's'}`}</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

