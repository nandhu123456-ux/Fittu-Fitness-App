import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { calculateBMR, calculateTDEE, calculateTargets } from '../utils/nutrition';
import { formatCalories, formatGrams, formatWeight } from '../utils/format';
import { updateUserProfile } from '../services/user';
import { addWeight } from '../services/weightLogs';
import { useUserDoc } from '../hooks/useRealtime';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme';
import type { GoalType } from '../types/user';
import type { RootTabParamList } from '../types/navigation';

type Navigation = BottomTabNavigationProp<RootTabParamList, 'Goals'>;

const GOAL_OPTIONS: { value: GoalType; label: string; desc: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'lose', label: 'Lose Weight', desc: 'Create a calorie deficit', icon: 'trending-down-outline' },
  { value: 'gain', label: 'Build Muscle', desc: 'Gain strength and muscle', icon: 'trending-up-outline' },
  { value: 'maintain', label: 'Stay Healthy', desc: 'Improve overall wellness', icon: 'heart-outline' },
];

const WEEKLY_RATES: number[] = [0.25, 0.5, 0.75, 1];

export default function GoalsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Navigation>();
  const { user, profile, setProfile } = useAuthStore();
  const uid = user?.uid;
  const profileData = profile?.profile;

  useUserDoc(uid);

  const [goalType, setGoalType] = useState<GoalType>(profile?.goal?.type ?? 'maintain');
  const [targetWeight, setTargetWeight] = useState<string>(profile?.goal?.targetWeightKg ? formatWeight(profile.goal.targetWeightKg) : '');
  const [heightCm, setHeightCm] = useState<string>(profileData?.heightCm ? String(profileData.heightCm) : '');
  const [weightKg, setWeightKg] = useState<string>(profileData?.weightKg ? formatWeight(profileData.weightKg) : '');
  const [weeklyRate, setWeeklyRate] = useState<number>(profile?.goal?.weeklyRateKg ?? 0.5);

  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [targetWeightError, setTargetWeightError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const targetWeightNum = Number(targetWeight);

  useEffect(() => {
    if (!profileData) return;
    setHeightCm(String(profileData.heightCm || 0));
    setWeightKg(formatWeight(profileData.weightKg));
    const tw = profile?.goal?.targetWeightKg ?? profileData.weightKg;
    setTargetWeight(tw ? formatWeight(tw) : '');
    setGoalType(profile?.goal?.type ?? 'maintain');
    setWeeklyRate(profile?.goal?.weeklyRateKg ?? 0.5);
  }, [profileData, profile?.goal]);

  const targets = profile?.targets;
  const selectedGoalObj = GOAL_OPTIONS.find((g) => g.value === goalType) || GOAL_OPTIONS[2];

  const handleSave = async (): Promise<void> => {
    if (!user || !profile || !profileData) return;
    setTargetWeightError(null);
    if (!Number.isFinite(targetWeightNum) || targetWeightNum < 25 || targetWeightNum > 300) {
      setTargetWeightError('Target weight must be between 25 and 300 kg.');
      return;
    }
    try {
      setSaving(true);
      const weightNum = Number(weightKg);
      const heightNum = Number(heightCm);
      const bmr = calculateBMR(weightNum, heightNum, profileData.age, profileData.gender);
      const tdee = calculateTDEE(bmr, profileData.activityLevel);
      const calculatedTargets = calculateTargets({ tdee, bmr, goalType, weightKg: weightNum });
      await updateUserProfile(user.uid, {
        profile: { ...profileData, weightKg: weightNum, heightCm: heightNum },
        goal: { type: goalType, targetWeightKg: targetWeightNum, weeklyRateKg: weeklyRate },
        targets: calculatedTargets,
        bmr,
        tdee,
      });
      try { await addWeight(user.uid, weightNum); } catch {}
      setProfile({
        ...profile,
        profile: { ...profileData, weightKg: weightNum, heightCm: heightNum },
        goal: { type: goalType, targetWeightKg: targetWeightNum, weeklyRateKg: weeklyRate },
        targets: calculatedTargets,
        bmr,
        tdee,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Could not save goals');
    } finally {
      setSaving(false);
    }
  };

  const themedStyles = useMemo(() => StyleSheet.create({
    screen: { backgroundColor: theme.colors.bg, flex: 1 },
    content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, flex: 1 },

    header: { alignItems: 'center', flexDirection: 'row', marginBottom: 16 },
    headerTitle: { color: theme.colors.text, fontSize: 22, fontWeight: '700', marginLeft: 12 },

    section: { color: theme.colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginTop: 16, marginBottom: 6 },
    card: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },

    // Body metrics row
    metricsRow: { flexDirection: 'row', gap: 14 },
    field: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    label: { color: theme.colors.text, fontSize: 14 },
    input: { backgroundColor: theme.colors.surfaceHi, borderRadius: 10, color: theme.colors.text, fontSize: 16, paddingHorizontal: 12, paddingVertical: 11, textAlign: 'right', width: 88 },

    // Target weight — hero input row (input flex-fills, kg suffix on the right)
    targetInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    targetInput: {
      backgroundColor: theme.colors.surfaceHi,
      borderRadius: 12,
      color: theme.colors.text,
      flex: 1,
      fontSize: 28,
      fontWeight: '700',
      letterSpacing: 0.5,
      paddingHorizontal: 16,
      paddingVertical: 14,
      textAlign: 'center',
    },
    targetUnit: { color: theme.colors.muted, fontSize: 16, fontWeight: '600' },

    // Compact Goal Row
    goalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    goalLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    goalTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
    editBtn: { backgroundColor: theme.colors.surfaceHi, padding: 8, borderRadius: 10 },

    // Weekly Rate
    segmented: { flexDirection: 'row', gap: 8, width: '100%' },
    ratePill: { alignItems: 'center', backgroundColor: theme.colors.surfaceHi, borderColor: theme.colors.border, borderRadius: 10, borderWidth: 1, flex: 1, minWidth: 0, paddingVertical: 10 },
    ratePillActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
    rateText: { color: theme.colors.muted, fontSize: 13, fontWeight: '600' },
    rateTextActive: { color: theme.colors.bg },

    // Daily targets — large tiles
    targetsRow: { flexDirection: 'row', gap: 10 },
    targetTile: { alignItems: 'center', backgroundColor: theme.colors.surfaceHi, borderRadius: 12, flex: 1, paddingVertical: 14, minHeight: 76 },
    targetDot: { borderRadius: 4, height: 8, width: 8 },
    targetValue: { color: theme.colors.text, fontSize: 18, fontWeight: '700', marginTop: 6 },
    targetName: { fontSize: 11, fontWeight: '600', marginTop: 2 },

    // Save button
    saveButton: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 14, padding: 16, marginTop: 'auto' },
    saveText: { color: theme.colors.bg, fontSize: 16, fontWeight: '700' },
    error: { color: theme.colors.danger, fontSize: 12, marginTop: 4 },

    // Goal Picker Modal
    modalBackdrop: { backgroundColor: 'rgba(0,0,0,0.5)', flex: 1, justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 16, gap: 8 },
    modalTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700', marginBottom: 8 },
    modalOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
    modalOptionActive: { backgroundColor: theme.colors.surfaceHi, borderColor: theme.colors.accent },
    modalOptionText: { color: theme.colors.text, fontSize: 15, marginLeft: 12 },
    modalOptionTextActive: { color: theme.colors.accent, fontWeight: '600' },
    modalClose: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
    modalCloseText: { color: theme.colors.muted, fontSize: 15, fontWeight: '600' },
  }), [theme]);

  return (
    <SafeAreaView style={themedStyles.screen} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={themedStyles.content}>

          <View style={themedStyles.header}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
              <Ionicons color={theme.colors.text} name="chevron-back" size={24} />
            </Pressable>
            <Text style={themedStyles.headerTitle}>Your Goals</Text>
          </View>

          <Text style={themedStyles.section}>BODY METRICS</Text>
          <View style={themedStyles.card}>
            <View style={themedStyles.metricsRow}>
              <View style={themedStyles.field}>
                <Text style={themedStyles.label}>Height</Text>
                <TextInput keyboardType="decimal-pad" onChangeText={setHeightCm} style={themedStyles.input} value={heightCm} />
              </View>
              <View style={themedStyles.field}>
                <Text style={themedStyles.label}>Weight</Text>
                <TextInput keyboardType="decimal-pad" onChangeText={setWeightKg} style={themedStyles.input} value={weightKg} />
              </View>
            </View>
          </View>

          <Text style={themedStyles.section}>YOUR GOAL</Text>
          <View style={themedStyles.card}>
            <View style={themedStyles.goalRow}>
              <View style={themedStyles.goalLeft}>
                <Ionicons color={theme.colors.accent} name={selectedGoalObj.icon} size={22} />
                <Text style={themedStyles.goalTitle}>{selectedGoalObj.label}</Text>
              </View>
              <Pressable onPress={() => setGoalModalVisible(true)} style={themedStyles.editBtn}>
                <Ionicons color={theme.colors.text} name="pencil" size={16} />
              </Pressable>
            </View>
          </View>

          <Text style={themedStyles.section}>TARGET WEIGHT (KG)</Text>
          <View style={themedStyles.card}>
            <View style={themedStyles.targetInputRow}>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={setTargetWeight}
                style={themedStyles.targetInput}
                value={targetWeight}
                placeholder="70.0"
                placeholderTextColor={theme.colors.muted}
              />
              <Text style={themedStyles.targetUnit}>kg</Text>
            </View>
            {targetWeightError !== null && <Text style={themedStyles.error}>{targetWeightError}</Text>}
          </View>

          <Text style={themedStyles.section}>WEEKLY RATE</Text>
          <View style={themedStyles.card}>
            <View style={themedStyles.segmented}>
              {WEEKLY_RATES.map((rate) => (
                <Pressable key={rate} onPress={() => setWeeklyRate(rate)} style={[themedStyles.ratePill, weeklyRate === rate && themedStyles.ratePillActive]}>
                  <Text numberOfLines={1} adjustsFontSizeToFit style={[themedStyles.rateText, weeklyRate === rate && themedStyles.rateTextActive]}>{rate} kg</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Text style={themedStyles.section}>DAILY TARGETS</Text>
          <View style={themedStyles.card}>
            <View style={themedStyles.targetsRow}>
              <View style={themedStyles.targetTile}>
                <View style={[themedStyles.targetDot, { backgroundColor: theme.colors.accent }]} />
                <Text style={themedStyles.targetValue}>{targets ? formatCalories(targets.calories) : '—'}</Text>
                <Text style={[themedStyles.targetName, { color: theme.colors.accent }]}>Cal</Text>
              </View>
              <View style={themedStyles.targetTile}>
                <View style={[themedStyles.targetDot, { backgroundColor: theme.colors.protein }]} />
                <Text style={themedStyles.targetValue}>{targets ? `${formatGrams(targets.protein)}` : '—'}</Text>
                <Text style={[themedStyles.targetName, { color: theme.colors.protein }]}>Pro</Text>
              </View>
              <View style={themedStyles.targetTile}>
                <View style={[themedStyles.targetDot, { backgroundColor: theme.colors.carbs }]} />
                <Text style={themedStyles.targetValue}>{targets ? `${formatGrams(targets.carbs)}` : '—'}</Text>
                <Text style={[themedStyles.targetName, { color: theme.colors.carbs }]}>Carb</Text>
              </View>
              <View style={themedStyles.targetTile}>
                <View style={[themedStyles.targetDot, { backgroundColor: theme.colors.fat }]} />
                <Text style={themedStyles.targetValue}>{targets ? `${formatGrams(targets.fat)}` : '—'}</Text>
                <Text style={[themedStyles.targetName, { color: theme.colors.fat }]}>Fat</Text>
              </View>
            </View>
          </View>

          <Pressable disabled={saving} onPress={() => void handleSave()} style={themedStyles.saveButton}>
            <Text style={themedStyles.saveText}>{saving ? 'Saving…' : 'Save changes'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* GOAL SELECTOR MODAL */}
      <Modal visible={goalModalVisible} transparent animationType="fade" onRequestClose={() => setGoalModalVisible(false)}>
        <Pressable style={themedStyles.modalBackdrop} onPress={() => setGoalModalVisible(false)}>
          <View style={themedStyles.modalContent}>
            <Text style={themedStyles.modalTitle}>Select Goal</Text>
            {GOAL_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => {
                  setGoalType(opt.value);
                  setGoalModalVisible(false);
                }}
                style={[themedStyles.modalOption, goalType === opt.value && themedStyles.modalOptionActive]}
              >
                <Ionicons name={opt.icon} size={22} color={goalType === opt.value ? theme.colors.accent : theme.colors.muted} />
                <Text style={[themedStyles.modalOptionText, goalType === opt.value && themedStyles.modalOptionTextActive]}>{opt.label}</Text>
              </Pressable>
            ))}
            <Pressable style={themedStyles.modalClose} onPress={() => setGoalModalVisible(false)}>
              <Text style={themedStyles.modalCloseText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}