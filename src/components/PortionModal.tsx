import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { FoodResult } from '../services/foodSearch';
import { useTheme } from '../theme';

interface Props {
  visible: boolean;
  food: FoodResult | null;
  onClose: () => void;
  /** servings = the stepper multiplier; edited = the food with user-corrected serving/macros (per 1 serving). */
  onConfirm: (servings: number, edited?: FoodResult) => void;
}

export function PortionModal({ visible, food, onClose, onConfirm }: Props) {
  const theme = useTheme();
  const [servings, setServings] = useState('1');
  const [serving, setServing] = useState('');
  const [cal, setCal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [touched, setTouched] = useState(false);

  // Reset the form whenever the modal opens for a food.
  useEffect(() => {
    if (visible && food) {
      setServings('1');
      setServing(food.serving);
      setCal(String(Math.round(food.cal)));
      setProtein(String(Math.round(food.protein * 10) / 10));
      setCarbs(String(Math.round(food.carbs * 10) / 10));
      setFat(String(Math.round(food.fat * 10) / 10));
      setTouched(false);
    }
  }, [visible, food]);

  const amount = Number(servings) || 0;
  const update = (change: number) => setServings(String(Math.max(0.5, Math.round((amount + change) * 10) / 10)));

  // Per-serving values: use the edited fields if the user touched them, else the original.
  const perCal = touched ? Number(cal) || 0 : (food?.cal ?? 0);
  const perProtein = touched ? Number(protein) || 0 : (food?.protein ?? 0);
  const perCarbs = touched ? Number(carbs) || 0 : (food?.carbs ?? 0);
  const perFat = touched ? Number(fat) || 0 : (food?.fat ?? 0);

  const themedStyles = useMemo(() => StyleSheet.create({
    overlay: { backgroundColor: theme.colors.overlay, flex: 1, justifyContent: 'flex-end' },
    card: { backgroundColor: theme.colors.surfaceHi, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
    title: { color: theme.colors.text, fontSize: 21, fontWeight: '700' },
    calories: { color: theme.colors.accent, fontSize: 30, fontWeight: '700', marginTop: 18 },
    macros: { color: theme.colors.muted, fontSize: 13, marginTop: 4 },
    step: { alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
    stepText: { color: theme.colors.text, fontSize: 24 },
    input: { borderBottomColor: theme.colors.border, borderBottomWidth: 1, color: theme.colors.text, fontSize: 22, fontWeight: '700', marginHorizontal: 16, padding: 6, textAlign: 'center', width: 74 },
    units: { color: theme.colors.muted, fontSize: 12, textAlign: 'center' },
    editSection: { borderColor: theme.colors.border, borderTopWidth: 1, gap: 10, marginTop: 18, paddingTop: 14 },
    editLabel: { color: theme.colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
    servingInput: { backgroundColor: theme.colors.surface, borderRadius: 10, color: theme.colors.text, fontSize: 14, paddingHorizontal: 12, paddingVertical: 10 },
    macroRow: { flexDirection: 'row', gap: 8 },
    macroField: { alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 10, flex: 1, paddingHorizontal: 8, paddingVertical: 6 },
    macroLabel: { color: theme.colors.muted, fontSize: 10, fontWeight: '700' },
    macroInput: { color: theme.colors.text, fontSize: 15, fontWeight: '600', paddingVertical: 2, textAlign: 'center', width: '100%' },
    actions: { flexDirection: 'row', gap: 12, marginTop: 22 },
    cancel: { alignItems: 'center', borderColor: theme.colors.border, borderRadius: 14, borderWidth: 1, flex: 1, padding: 15 },
    cancelText: { color: theme.colors.text, fontWeight: '600' },
    confirm: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 14, flex: 1, padding: 15 },
    confirmText: { color: theme.colors.bg, fontWeight: '700' },
  }), [theme]);

  if (!food) return null;

  const handleConfirm = (): void => {
    if (!touched) {
      onConfirm(amount);
      return;
    }
    // User corrected the values — pass a food with the edited per-serving values.
    onConfirm(amount, { ...food, serving: serving || food.serving, cal: perCal, protein: perProtein, carbs: perCarbs, fat: perFat });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={themedStyles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ justifyContent: 'flex-end' }}>
          <Pressable onPress={(event) => event.stopPropagation()} style={themedStyles.card}>
          <Text style={themedStyles.title}>{food.name}</Text>
          <Text style={themedStyles.calories}>{Math.round(perCal * amount)} kcal</Text>
          <Text style={themedStyles.macros}>P {Math.round(perProtein * amount)}g · C {Math.round(perCarbs * amount)}g · F {Math.round(perFat * amount)}g</Text>

          <View style={styles.stepper}>
            <Pressable onPress={() => update(-0.5)} style={themedStyles.step}><Text style={themedStyles.stepText}>−</Text></Pressable>
            <TextInput keyboardType="decimal-pad" onChangeText={setServings} selectTextOnFocus style={themedStyles.input} value={servings} />
            <Pressable onPress={() => update(0.5)} style={themedStyles.step}><Text style={themedStyles.stepText}>+</Text></Pressable>
          </View>
          <Text style={themedStyles.units}>servings</Text>

          <View style={themedStyles.editSection}>
            <Text style={themedStyles.editLabel}>EDIT SERVING & MACROS (per serving)</Text>
            <TextInput
              onChangeText={(t) => { setServing(t); setTouched(true); }}
              placeholder="Serving (e.g. 1 plate, 100g)"
              placeholderTextColor={theme.colors.muted}
              style={themedStyles.servingInput}
              value={serving}
            />
            <View style={themedStyles.macroRow}>
              {([
                { label: 'CAL', value: cal, set: setCal },
                { label: 'P', value: protein, set: setProtein },
                { label: 'C', value: carbs, set: setCarbs },
                { label: 'F', value: fat, set: setFat },
              ]).map((field) => (
                <View key={field.label} style={themedStyles.macroField}>
                  <Text style={themedStyles.macroLabel}>{field.label}</Text>
                  <TextInput
                    keyboardType="numeric"
                    onChangeText={(t) => { field.set(t); setTouched(true); }}
                    style={themedStyles.macroInput}
                    value={field.value}
                  />
                </View>
              ))}
            </View>
          </View>

          <View style={themedStyles.actions}>
            <Pressable onPress={onClose} style={themedStyles.cancel}><Text style={themedStyles.cancelText}>Cancel</Text></Pressable>
            <Pressable disabled={amount <= 0} onPress={handleConfirm} style={themedStyles.confirm}><Text style={themedStyles.confirmText}>Add to log</Text></Pressable>
          </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  stepper: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
});

