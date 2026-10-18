import { Ionicons } from '@expo/vector-icons';
import { type BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { addCustomFood } from '../services/customFoods';
import type { MealType } from '../services/foodLogs';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme';
import type { RootTabParamList } from '../types/navigation';

type Route = RouteProp<RootTabParamList, 'AddCustomFood'>;
type Navigation = BottomTabNavigationProp<RootTabParamList, 'AddCustomFood'>;

const parseNonNegative = (value: string): number | null => {
  if (!value.trim()) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

export default function AddCustomFoodScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const user = useAuthStore((state) => state.user);
  const mealType: MealType | undefined = route.params?.mealType;

  const [name, setName] = useState(route.params?.prefillQuery ?? '');
  const [serving, setServing] = useState('');
  const [cal, setCal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    if (!user) return;
    if (!name.trim()) { setError('Give your food a name.'); return; }
    const calNum = parseNonNegative(cal);
    if (calNum === null || calNum === 0) { setError('Enter calories (greater than 0).'); return; }
    const proteinNum = parseNonNegative(protein);
    const carbsNum = parseNonNegative(carbs);
    const fatNum = parseNonNegative(fat);
    if (proteinNum === null || carbsNum === null || fatNum === null) {
      setError('Macros must be zero or positive numbers.');
      return;
    }
    try {
      setSaving(true);
      await addCustomFood(user.uid, {
        name: name.trim(),
        serving: serving.trim(),
        cal: calNum,
        protein: proteinNum,
        carbs: carbsNum,
        fat: fatNum,
      });
      navigation.goBack();
    } catch {
      setError('Could not save this food. Please try again.');
      Alert.alert('Save failed', 'Could not save your custom food. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const themedStyles = useMemo(() => StyleSheet.create({
    screen: { backgroundColor: theme.colors.bg, flex: 1 },
    headerRow: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
    header: { color: theme.colors.text, fontSize: 22, fontWeight: '700' },
    body: { paddingHorizontal: 20, paddingBottom: 32 },
    card: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 16, borderWidth: 1, gap: 14, padding: 16 },
    label: { color: theme.colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 0.6, marginBottom: 6, textTransform: 'uppercase' },
    input: { backgroundColor: theme.colors.surfaceHi, borderRadius: 10, color: theme.colors.text, fontSize: 16, paddingHorizontal: 14, paddingVertical: 12 },
    row: { flexDirection: 'row', gap: 12 },
    field: { flex: 1 },
    error: { color: theme.colors.danger, fontSize: 14, marginTop: 4 },
    hint: { color: theme.colors.muted, fontSize: 13, marginTop: 4 },
    saveButton: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 14, marginTop: 20, paddingVertical: 15 },
    saveText: { color: theme.colors.bg, fontSize: 16, fontWeight: '700' },
  }), [theme]);

  return (
    <KeyboardAvoidingView style={themedStyles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={themedStyles.headerRow}>
        <Pressable hitSlop={12} onPress={() => navigation.goBack()}>
          <Ionicons color={theme.colors.text} name="chevron-back" size={26} />
        </Pressable>
        <Text style={themedStyles.header}>Add custom food</Text>
      </View>
      <ScrollView contentContainerStyle={themedStyles.body} keyboardShouldPersistTaps="handled">
        <View style={themedStyles.card}>
          <View>
            <Text style={themedStyles.label}>Name</Text>
            <TextInput
              onChangeText={setName}
              placeholder="e.g. Grandma's biryani"
              placeholderTextColor={theme.colors.muted}
              style={themedStyles.input}
              value={name}
            />
          </View>
          <View>
            <Text style={themedStyles.label}>Serving</Text>
            <TextInput
              onChangeText={setServing}
              placeholder="1 serving"
              placeholderTextColor={theme.colors.muted}
              style={themedStyles.input}
              value={serving}
            />
          </View>
          <View>
            <Text style={themedStyles.label}>Calories</Text>
            <TextInput
              keyboardType="numeric"
              onChangeText={setCal}
              placeholder="250"
              placeholderTextColor={theme.colors.muted}
              style={themedStyles.input}
              value={cal}
            />
          </View>
          <View style={themedStyles.row}>
            <View style={themedStyles.field}>
              <Text style={themedStyles.label}>Protein (g)</Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={setProtein}
                placeholder="0"
                placeholderTextColor={theme.colors.muted}
                style={themedStyles.input}
                value={protein}
              />
            </View>
            <View style={themedStyles.field}>
              <Text style={themedStyles.label}>Carbs (g)</Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={setCarbs}
                placeholder="0"
                placeholderTextColor={theme.colors.muted}
                style={themedStyles.input}
                value={carbs}
              />
            </View>
            <View style={themedStyles.field}>
              <Text style={themedStyles.label}>Fat (g)</Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={setFat}
                placeholder="0"
                placeholderTextColor={theme.colors.muted}
                style={themedStyles.input}
                value={fat}
              />
            </View>
          </View>
          {error !== null && <Text style={themedStyles.error}>{error}</Text>}
          <Text style={themedStyles.hint}>Saved to your library — it'll show up in future searches.</Text>
        </View>
        <Pressable disabled={saving} onPress={() => void handleSave()} style={themedStyles.saveButton}>
          <Text style={themedStyles.saveText}>{saving ? 'Saving…' : 'Save food'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

