import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useNavigation } from '@react-navigation/native';

import { signOut } from '../services/auth';
import { deleteAccount, updateUserProfile } from '../services/user';
import { useAuthStore } from '../store/authStore';
import { useTheme, useThemeStore } from '../theme';

type TargetKey = 'calories' | 'protein' | 'carbs' | 'fat';
type TargetValues = Record<TargetKey, string>;
const emptyTargets: TargetValues = { calories: '', protein: '', carbs: '', fat: '' };

export default function SettingsScreen() {
  const theme = useTheme();
  const mode = useThemeStore((s) => s.mode);
  const { user, profile, setProfile } = useAuthStore();
  const navigation = useNavigation();
  const [targets, setTargets] = useState<TargetValues>(emptyTargets);
  const [units, setUnits] = useState<'kg' | 'lb'>(profile?.units ?? 'kg');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (profile?.targets) setTargets({ calories: String(profile.targets.calories), protein: String(profile.targets.protein), carbs: String(profile.targets.carbs), fat: String(profile.targets.fat) }); }, [profile]);
  const saveTargets = async () => {
    if (!user || !profile) return;
    const next = Object.fromEntries(Object.entries(targets).map(([key, value]) => [key, Number(value)])) as Record<TargetKey, number>;
    if (Object.values(next).some((value) => !Number.isFinite(value) || value < 0)) { Alert.alert('Enter valid target values'); return; }
    try { setSaving(true); await updateUserProfile(user.uid, { targets: next }); setProfile({ ...profile, targets: next }); navigation.goBack(); } catch { Alert.alert('Could not save targets'); } finally { setSaving(false); }
  };
  const changeUnits = async (nextUnits: 'kg' | 'lb') => {
    if (!user || !profile) return;
    setUnits(nextUnits);
    try { await updateUserProfile(user.uid, { units: nextUnits }); setProfile({ ...profile, units: nextUnits }); } catch { Alert.alert('Could not save units'); }
  };
  const confirmDelete = () => Alert.alert('Delete account?', 'This permanently removes your profile and signs you out.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete account', style: 'destructive', onPress: () => { if (user) void deleteAccount(user.uid).catch(() => Alert.alert('Could not delete account. You may need to sign in again.')); } }]);
  // Theme-dependent styles — re-created whenever the resolved palette changes.
  const themedStyles = useMemo(() => StyleSheet.create({
    screen: { backgroundColor: theme.colors.bg },
    heading: { color: theme.colors.text, fontSize: 28, fontWeight: '700', marginBottom: 10 },
    section: { color: theme.colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 1.4, marginTop: 8 },
    card: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 20, borderWidth: 1, padding: 18 },
    label: { color: theme.colors.text, fontSize: 15 },
    input: { backgroundColor: theme.colors.surfaceHi, borderRadius: 10, color: theme.colors.text, fontSize: 15, paddingHorizontal: 12, paddingVertical: 9, textAlign: 'right', width: 100 },
    save: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 12, marginTop: 4, padding: 14 },
    saveText: { color: theme.colors.bg, fontWeight: '700' },
    activeUnit: { backgroundColor: theme.colors.accent },
    unitText: { color: theme.colors.muted, fontWeight: '700' },
    activeUnitText: { color: theme.colors.bg },
    rowText: { color: theme.colors.text, fontSize: 16 },
    deleteText: { color: theme.colors.danger, fontSize: 16 },
    divider: { backgroundColor: theme.colors.border, height: 1, marginVertical: 10 },
    checkOn: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 999, height: 22, justifyContent: 'center', width: 22 },
    checkOff: { alignItems: 'center', borderColor: theme.colors.borderStrong, borderRadius: 999, borderWidth: 2, height: 22, justifyContent: 'center', width: 22 },
    checkMark: { color: theme.colors.accentText, fontSize: 12, fontWeight: '700' },
  }), [theme]);
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><ScrollView style={themedStyles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><Text style={themedStyles.heading}>Settings</Text><Text style={themedStyles.section}>APPEARANCE</Text><View style={themedStyles.card}>{(['system', 'light', 'dark'] as const).map((value) => <Pressable key={value} onPress={() => theme.setMode(value)} style={styles.optionRow}><Text style={themedStyles.rowText}>{value[0].toUpperCase() + value.slice(1)}</Text><View style={mode === value ? themedStyles.checkOn : themedStyles.checkOff}>{mode === value ? <Text style={themedStyles.checkMark}>✓</Text> : null}</View></Pressable>)}</View><Text style={themedStyles.section}>DAILY TARGETS</Text><View style={themedStyles.card}>{(['calories', 'protein', 'carbs', 'fat'] as TargetKey[]).map((key) => <View key={key} style={styles.field}><Text style={themedStyles.label}>{key === 'calories' ? 'Calories' : `${key[0].toUpperCase()}${key.slice(1)} (g)`}</Text><TextInput keyboardType="number-pad" onChangeText={(value) => setTargets((current) => ({ ...current, [key]: value }))} style={themedStyles.input} value={targets[key]} /></View>)}<Pressable disabled={saving} onPress={() => void saveTargets()} style={themedStyles.save}><Text style={themedStyles.saveText}>{saving ? 'Saving…' : 'Save targets'}</Text></Pressable></View><Text style={themedStyles.section}>UNITS</Text><View style={themedStyles.card}><View style={styles.segmented}>{(['kg', 'lb'] as const).map((value) => <Pressable key={value} onPress={() => void changeUnits(value)} style={[styles.unit, units === value && themedStyles.activeUnit]}><Text style={[themedStyles.unitText, units === value && themedStyles.activeUnitText]}>{value.toUpperCase()}</Text></Pressable>)}</View></View><Text style={themedStyles.section}>ACCOUNT</Text><View style={themedStyles.card}><Pressable onPress={() => void signOut()} style={styles.row}><Text style={themedStyles.rowText}>Sign out</Text></Pressable><View style={themedStyles.divider} /><Pressable onPress={confirmDelete} style={styles.row}><Text style={themedStyles.deleteText}>Delete account</Text></Pressable></View></ScrollView></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  content: { gap: 12, padding: 20, paddingBottom: 40 }, field: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }, segmented: { flexDirection: 'row' }, unit: { alignItems: 'center', borderRadius: 12, flex: 1, padding: 13 }, row: { paddingVertical: 8 }, optionRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
});
