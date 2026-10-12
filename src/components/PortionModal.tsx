import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '../constants/colors';
import type { FoodResult } from '../services/foodSearch';

interface Props {
  visible: boolean;
  food: FoodResult | null;
  onClose: () => void;
  onConfirm: (servings: number) => void;
}

export function PortionModal({ visible, food, onClose, onConfirm }: Props) {
  const [servings, setServings] = useState('1');
  useEffect(() => { if (visible) setServings('1'); }, [visible, food]);
  const amount = Number(servings) || 0;
  const update = (change: number) => setServings(String(Math.max(0.5, Math.round((amount + change) * 10) / 10)));
  if (!food) return null;
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><Pressable onPress={onClose} style={styles.overlay}><Pressable onPress={(event) => event.stopPropagation()} style={styles.card}>
    <Text style={styles.title}>{food.name}</Text><Text style={styles.serving}>{food.serving}</Text>
    <Text style={styles.calories}>{Math.round(food.cal * amount)} kcal</Text><Text style={styles.macros}>P {Math.round(food.protein * amount)}g · C {Math.round(food.carbs * amount)}g · F {Math.round(food.fat * amount)}g</Text>
    <View style={styles.stepper}><Pressable onPress={() => update(-0.5)} style={styles.step}><Text style={styles.stepText}>−</Text></Pressable><TextInput keyboardType="decimal-pad" onChangeText={setServings} selectTextOnFocus style={styles.input} value={servings} /><Pressable onPress={() => update(0.5)} style={styles.step}><Text style={styles.stepText}>+</Text></Pressable></View><Text style={styles.units}>servings</Text>
    <View style={styles.actions}><Pressable onPress={onClose} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></Pressable><Pressable disabled={amount <= 0} onPress={() => onConfirm(amount)} style={styles.confirm}><Text style={styles.confirmText}>Add to log</Text></Pressable></View>
  </Pressable></Pressable></Modal>;
}

const styles = StyleSheet.create({
  overlay: { backgroundColor: 'rgba(0,0,0,0.68)', flex: 1, justifyContent: 'flex-end' }, card: { backgroundColor: colors.surfaceHi, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }, title: { color: colors.text, fontSize: 21, fontWeight: '700' }, serving: { color: colors.muted, fontSize: 13, marginTop: 5 }, calories: { color: colors.accent, fontSize: 30, fontWeight: '700', marginTop: 22 }, macros: { color: colors.muted, fontSize: 13, marginTop: 4 }, stepper: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 22 }, step: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 22, height: 44, justifyContent: 'center', width: 44 }, stepText: { color: colors.text, fontSize: 24 }, input: { borderBottomColor: colors.border, borderBottomWidth: 1, color: colors.text, fontSize: 22, fontWeight: '700', marginHorizontal: 16, padding: 6, textAlign: 'center', width: 74 }, units: { color: colors.muted, fontSize: 12, textAlign: 'center' }, actions: { flexDirection: 'row', gap: 12, marginTop: 26 }, cancel: { alignItems: 'center', borderColor: colors.border, borderRadius: 14, borderWidth: 1, flex: 1, padding: 15 }, cancelText: { color: colors.text, fontWeight: '600' }, confirm: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 14, flex: 1, padding: 15 }, confirmText: { color: colors.bg, fontWeight: '700' },
});
