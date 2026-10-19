import { Ionicons } from '@expo/vector-icons';
import { type BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { addCustomFood, deleteCustomFood, getCustomFoods, updateCustomFood } from '../services/customFoods';
import type { MealType } from '../services/foodLogs';
import type { FoodResult } from '../services/foodSearch';
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

  // Toggle between 'add' and 'list'
  const [mode, setMode] = useState<'add' | 'list'>('add');

  // --- ADD FORM STATE ---
  const [name, setName] = useState(route.params?.prefillQuery ?? '');
  const [serving, setServing] = useState('');
  const [cal, setCal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- LIST & EDIT STATE ---
  const [foods, setFoods] = useState<FoodResult[]>([]);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [editingFood, setEditingFood] = useState<FoodResult | null>(null);
  
  const [editName, setEditName] = useState('');
  const [editServing, setEditServing] = useState('');
  const [editCal, setEditCal] = useState('');
  const [editPro, setEditPro] = useState('');
  const [editCarb, setEditCarb] = useState('');
  const [editFat, setEditFat] = useState('');

  const loadFoods = useCallback(async () => {
    if (!user) return;
    setLoadingFoods(true);
    const data = await getCustomFoods(user.uid);
    setFoods(data);
    setLoadingFoods(false);
  }, [user]);

  useEffect(() => {
    if (mode === 'list') {
      void loadFoods();
    }
  }, [mode, loadFoods]);

  // --- ACTIONS ---
  const handleSaveNew = async () => {
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
      
      // Clear form, load new list, and switch to list mode
      setName('');
      setServing('');
      setCal('');
      setProtein('');
      setCarbs('');
      setFat('');
      await loadFoods();
      setMode('list');
    } catch {
      setError('Could not save this food. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, foodName: string) => {
    if (!user) return;
    Alert.alert('Delete Food', `Remove "${foodName}" from your list?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteCustomFood(user.uid, id);
          void loadFoods();
        }
      }
    ]);
  };

  const openEdit = (food: FoodResult) => {
    setEditingFood(food);
    setEditName(food.name);
    setEditServing(food.serving || '');
    setEditCal(String(food.cal));
    setEditPro(String(food.protein));
    setEditCarb(String(food.carbs));
    setEditFat(String(food.fat));
  };

  const handleSaveEdit = async () => {
    if (!user || !editingFood) return;
    try {
      await updateCustomFood(user.uid, editingFood.id, {
        name: editName,
        serving: editServing,
        cal: Number(editCal) || 0,
        protein: Number(editPro) || 0,
        carbs: Number(editCarb) || 0,
        fat: Number(editFat) || 0,
      });
      setEditingFood(null);
      void loadFoods();
    } catch (e) {
      Alert.alert('Error', 'Could not update food.');
    }
  };

  const themedStyles = useMemo(() => StyleSheet.create({
    screen: { backgroundColor: theme.colors.bg, flex: 1 },
    headerRow: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
    header: { color: theme.colors.text, fontSize: 22, fontWeight: '700' },
    
    // Segmented Toggle
    toggleRow: { flexDirection: 'row', backgroundColor: theme.colors.surface, marginHorizontal: 20, borderRadius: 12, padding: 4, marginBottom: 16 },
    toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    toggleBtnActive: { backgroundColor: theme.colors.surfaceHi },
    toggleText: { color: theme.colors.muted, fontSize: 14, fontWeight: '600' },
    toggleTextActive: { color: theme.colors.accent },

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

    // List styles
    listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    foodName: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
    foodMacros: { fontSize: 12, color: theme.colors.muted, marginTop: 4 },
    actionBtn: { padding: 8, marginLeft: 8 },
    emptyWrap: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: theme.colors.muted, marginTop: 16, fontSize: 16 },

    // Edit Modal styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text, marginBottom: 16 },
  }), [theme]);

  return (
    <KeyboardAvoidingView style={themedStyles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={themedStyles.headerRow}>
        <Pressable hitSlop={12} onPress={() => navigation.goBack()}>
          <Ionicons color={theme.colors.text} name="chevron-back" size={26} />
        </Pressable>
        <Text style={themedStyles.header}>My Custom Foods</Text>
      </View>

      {/* TOGGLE */}
      <View style={themedStyles.toggleRow}>
        <Pressable style={[themedStyles.toggleBtn, mode === 'add' && themedStyles.toggleBtnActive]} onPress={() => setMode('add')}>
          <Text style={[themedStyles.toggleText, mode === 'add' && themedStyles.toggleTextActive]}>Add New</Text>
        </Pressable>
        <Pressable style={[themedStyles.toggleBtn, mode === 'list' && themedStyles.toggleBtnActive]} onPress={() => setMode('list')}>
          <Text style={[themedStyles.toggleText, mode === 'list' && themedStyles.toggleTextActive]}>Saved Foods</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={themedStyles.body} keyboardShouldPersistTaps="handled">
        
        {/* ADD NEW VIEW */}
        {mode === 'add' && (
          <>
            <View style={themedStyles.card}>
              <View>
                <Text style={themedStyles.label}>Name</Text>
                <TextInput onChangeText={setName} placeholder="e.g. Grandma's biryani" placeholderTextColor={theme.colors.muted} style={themedStyles.input} value={name} />
              </View>
              <View>
                <Text style={themedStyles.label}>Serving</Text>
                <TextInput onChangeText={setServing} placeholder="1 serving" placeholderTextColor={theme.colors.muted} style={themedStyles.input} value={serving} />
              </View>
              <View>
                <Text style={themedStyles.label}>Calories</Text>
                <TextInput keyboardType="numeric" onChangeText={setCal} placeholder="250" placeholderTextColor={theme.colors.muted} style={themedStyles.input} value={cal} />
              </View>
              <View style={themedStyles.row}>
                <View style={themedStyles.field}>
                  <Text style={themedStyles.label}>Protein (g)</Text>
                  <TextInput keyboardType="numeric" onChangeText={setProtein} placeholder="0" placeholderTextColor={theme.colors.muted} style={themedStyles.input} value={protein} />
                </View>
                <View style={themedStyles.field}>
                  <Text style={themedStyles.label}>Carbs (g)</Text>
                  <TextInput keyboardType="numeric" onChangeText={setCarbs} placeholder="0" placeholderTextColor={theme.colors.muted} style={themedStyles.input} value={carbs} />
                </View>
                <View style={themedStyles.field}>
                  <Text style={themedStyles.label}>Fat (g)</Text>
                  <TextInput keyboardType="numeric" onChangeText={setFat} placeholder="0" placeholderTextColor={theme.colors.muted} style={themedStyles.input} value={fat} />
                </View>
              </View>
              {error !== null && <Text style={themedStyles.error}>{error}</Text>}
            </View>
            <Pressable disabled={saving} onPress={() => void handleSaveNew()} style={themedStyles.saveButton}>
              <Text style={themedStyles.saveText}>{saving ? 'Saving…' : 'Save to my foods'}</Text>
            </Pressable>
          </>
        )}

        {/* LIST VIEW */}
        {mode === 'list' && (
          <>
            {loadingFoods ? (
              <ActivityIndicator color={theme.colors.accent} style={{ marginTop: 40 }} />
            ) : foods.length === 0 ? (
              <View style={themedStyles.emptyWrap}>
                <Ionicons name="fast-food-outline" size={60} color={theme.colors.muted} />
                <Text style={themedStyles.emptyText}>You haven't added any foods yet.</Text>
              </View>
            ) : (
              foods.map(food => (
                <View key={food.id} style={themedStyles.listItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={themedStyles.foodName}>{food.name}</Text>
                    <Text style={themedStyles.foodMacros}>{food.serving || '1 serving'} · {food.cal} kcal · P:{food.protein}g C:{food.carbs}g F:{food.fat}g</Text>
                  </View>
                  <Pressable onPress={() => openEdit(food)} style={themedStyles.actionBtn}>
                    <Ionicons name="pencil" size={20} color={theme.colors.accent} />
                  </Pressable>
                  <Pressable onPress={() => handleDelete(food.id, food.name)} style={themedStyles.actionBtn}>
                    <Ionicons name="trash" size={20} color={theme.colors.danger} />
                  </Pressable>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* EDIT MODAL */}
      <Modal visible={!!editingFood} transparent animationType="slide">
        <View style={themedStyles.modalOverlay}>
          <View style={themedStyles.modalCard}>
            <Text style={themedStyles.modalTitle}>Edit Food</Text>
            
            <Text style={themedStyles.label}>FOOD NAME</Text>
            <TextInput style={themedStyles.input} value={editName} onChangeText={setEditName} />

            <Text style={themedStyles.label}>SERVING SIZE</Text>
            <TextInput style={themedStyles.input} value={editServing} onChangeText={setEditServing} />

            <View style={themedStyles.row}>
              <View style={{ flex: 1 }}>
                <Text style={themedStyles.label}>CALORIES</Text>
                <TextInput style={themedStyles.input} keyboardType="decimal-pad" value={editCal} onChangeText={setEditCal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={themedStyles.label}>PROTEIN (G)</Text>
                <TextInput style={themedStyles.input} keyboardType="decimal-pad" value={editPro} onChangeText={setEditPro} />
              </View>
            </View>

            <View style={themedStyles.row}>
              <View style={{ flex: 1 }}>
                <Text style={themedStyles.label}>CARBS (G)</Text>
                <TextInput style={themedStyles.input} keyboardType="decimal-pad" value={editCarb} onChangeText={setEditCarb} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={themedStyles.label}>FAT (G)</Text>
                <TextInput style={themedStyles.input} keyboardType="decimal-pad" value={editFat} onChangeText={setEditFat} />
              </View>
            </View>

            <View style={[themedStyles.row, { marginTop: 24 }]}>
              <Pressable style={[themedStyles.saveButton, { flex: 1, backgroundColor: theme.colors.surfaceHi, marginTop: 0 }]} onPress={() => setEditingFood(null)}>
                <Text style={[themedStyles.saveText, { color: theme.colors.text }]}>Cancel</Text>
              </Pressable>
              <Pressable style={[themedStyles.saveButton, { flex: 1, marginTop: 0 }]} onPress={handleSaveEdit}>
                <Text style={themedStyles.saveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}