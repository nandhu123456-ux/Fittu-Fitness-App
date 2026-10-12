import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '../constants/colors';
import { signOut } from '../services/auth';
import { deleteAccount, updateUserProfile } from '../services/user';
import { useAuthStore } from '../store/authStore';

type TargetKey = 'calories' | 'protein' | 'carbs' | 'fat';
type TargetValues = Record<TargetKey, string>;
const emptyTargets: TargetValues = { calories: '', protein: '', carbs: '', fat: '' };

export default function SettingsScreen() {
  const { user, profile, setProfile } = useAuthStore();
  const [targets, setTargets] = useState<TargetValues>(emptyTargets);
  const [units, setUnits] = useState<'kg' | 'lb'>(profile?.units ?? 'kg');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (profile?.targets) setTargets({ calories: String(profile.targets.calories), protein: String(profile.targets.protein), carbs: String(profile.targets.carbs), fat: String(profile.targets.fat) }); }, [profile]);
  const saveTargets = async () => {
    if (!user || !profile) return;
    const next = Object.fromEntries(Object.entries(targets).map(([key, value]) => [key, Number(value)])) as Record<TargetKey, number>;
    if (Object.values(next).some((value) => !Number.isFinite(value) || value < 0)) { Alert.alert('Enter valid target values'); return; }
    try { setSaving(true); await updateUserProfile(user.uid, { targets: next }); setProfile({ ...profile, targets: next }); } catch { Alert.alert('Could not save targets'); } finally { setSaving(false); }
  };
  const changeUnits = async (nextUnits: 'kg' | 'lb') => {
    if (!user || !profile) return;
    setUnits(nextUnits);
    try { await updateUserProfile(user.uid, { units: nextUnits }); setProfile({ ...profile, units: nextUnits }); } catch { Alert.alert('Could not save units'); }
  };
  const confirmDelete = () => Alert.alert('Delete account?', 'This permanently removes your profile and signs you out.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete account', style: 'destructive', onPress: () => { if (user) void deleteAccount(user.uid).catch(() => Alert.alert('Could not delete account. You may need to sign in again.')); } }]);
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><Text style={styles.heading}>Settings</Text><Text style={styles.section}>DAILY TARGETS</Text><View style={styles.card}>{(['calories', 'protein', 'carbs', 'fat'] as TargetKey[]).map((key) => <View key={key} style={styles.field}><Text style={styles.label}>{key === 'calories' ? 'Calories' : `${key[0].toUpperCase()}${key.slice(1)} (g)`}</Text><TextInput keyboardType="number-pad" onChangeText={(value) => setTargets((current) => ({ ...current, [key]: value }))} style={styles.input} value={targets[key]} /></View>)}<Pressable disabled={saving} onPress={() => void saveTargets()} style={styles.save}><Text style={styles.saveText}>{saving ? 'Saving…' : 'Save targets'}</Text></Pressable></View><Text style={styles.section}>UNITS</Text><View style={styles.card}><View style={styles.segmented}>{(['kg', 'lb'] as const).map((value) => <Pressable key={value} onPress={() => void changeUnits(value)} style={[styles.unit, units === value && styles.activeUnit]}><Text style={[styles.unitText, units === value && styles.activeUnitText]}>{value.toUpperCase()}</Text></Pressable>)}</View></View><Text style={styles.section}>ACCOUNT</Text><View style={styles.card}><Pressable onPress={() => void signOut()} style={styles.row}><Text style={styles.rowText}>Sign out</Text></Pressable><View style={styles.divider} /><Pressable onPress={confirmDelete} style={styles.row}><Text style={styles.deleteText}>Delete account</Text></Pressable></View></ScrollView>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg }, content: { gap: 12, padding: 20, paddingBottom: 40 }, heading: { color: colors.text, fontSize: 28, fontWeight: '700', marginBottom: 10 }, section: { color: colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 1.4, marginTop: 8 }, card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, padding: 18 }, field: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }, label: { color: colors.text, fontSize: 15 }, input: { backgroundColor: colors.surfaceHi, borderRadius: 10, color: colors.text, fontSize: 15, paddingHorizontal: 12, paddingVertical: 9, textAlign: 'right', width: 100 }, save: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 12, marginTop: 4, padding: 14 }, saveText: { color: colors.bg, fontWeight: '700' }, segmented: { flexDirection: 'row' }, unit: { alignItems: 'center', borderRadius: 12, flex: 1, padding: 13 }, activeUnit: { backgroundColor: colors.accent }, unitText: { color: colors.muted, fontWeight: '700' }, activeUnitText: { color: colors.bg }, row: { paddingVertical: 8 }, rowText: { color: colors.text, fontSize: 16 }, deleteText: { color: colors.danger, fontSize: 16 }, divider: { backgroundColor: colors.border, height: 1, marginVertical: 10 },
});
