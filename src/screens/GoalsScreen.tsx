import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { calculateBMR, calculateTDEE, calculateTargets } from '../utils/nutrition';
import { formatCalories, formatGrams, formatWeight } from '../utils/format';
import { updateUserProfile } from '../services/user';
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

const MILLIS_PER_DAY = 86_400_000;

export default function GoalsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Navigation>();
  const { user, profile, setProfile } = useAuthStore();
  const profileData = profile?.profile;
  const currentWeight = profileData?.weightKg;
  const [goalType, setGoalType] = useState<GoalType>(profile?.goal?.type ?? 'maintain');
  const [targetWeight, setTargetWeight] = useState<string>(formatWeight(profile?.goal?.targetWeightKg ?? currentWeight ?? 70));
  const [weeklyRate, setWeeklyRate] = useState<number>(profile?.goal?.weeklyRateKg ?? 0.5);
  const [targetWeightError, setTargetWeightError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const targetWeightNum = Number(targetWeight);

  const targetDateLabel = useMemo(() => {
    if (goalType === 'maintain') return '';
    const cw = currentWeight;
    const tw = targetWeightNum;
    if (!cw || !Number.isFinite(tw) || weeklyRate <= 0) return '';
    const weeks = Math.abs(tw - cw) / weeklyRate;
    const date = new Date(Date.now() + weeks * 7 * MILLIS_PER_DAY);
    return `By ${date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`;
  }, [goalType, targetWeight, weeklyRate, currentWeight]);

  const targets = profile?.targets;

  const handleSave = async (): Promise<void> => {
    if (!user || !profile || !profileData) return;
    setTargetWeightError(null);
    if (!Number.isFinite(targetWeightNum) || targetWeightNum < 25 || targetWeightNum > 300) {
      setTargetWeightError('Target weight must be between 25 and 300 kg.');
      return;
    }
    try {
      setSaving(true);
      const weightKg = profileData.weightKg;
      const bmr = calculateBMR(weightKg, profileData.heightCm, profileData.age, profileData.gender);
      const tdee = calculateTDEE(bmr, profileData.activityLevel);
      const targets = calculateTargets({ tdee, bmr, goalType, weightKg });
      await updateUserProfile(user.uid, {
        goal: { type: goalType, targetWeightKg: targetWeightNum, weeklyRateKg: weeklyRate },
        targets,
        bmr,
        tdee,
      });
      setProfile({
        ...profile,
        goal: { type: goalType, targetWeightKg: targetWeightNum, weeklyRateKg: weeklyRate },
        targets,
        bmr,
        tdee,
      });
      Alert.alert('Goals saved', 'Your goals have been updated.');
      navigation.goBack();
    } catch {
      Alert.alert('Could not save goals');
    } finally {
      setSaving(false);
    }
  };

  const themedStyles = useMemo(() => StyleSheet.create({
    screen: { backgroundColor: theme.colors.bg, flex: 1 },
    header: { alignItems: 'center', flexDirection: 'row', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
    headerTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '600', marginLeft: 12 },
    subtitle: { color: theme.colors.muted, fontSize: 13, marginTop: 4, paddingHorizontal: 20 },
    section: { color: theme.colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 1.4, marginTop: 20, paddingHorizontal: 20 },
    card: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 20, borderWidth: 1, marginHorizontal: 20, marginTop: 8, padding: 18 },
    goalCard: { alignItems: 'center', borderColor: theme.colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', padding: 14 },
    goalCardActive: { borderColor: theme.colors.accent, borderWidth: 2 },
    goalCardText: { flex: 1, marginLeft: 12 },
    goalTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
    goalTitleActive: { color: theme.colors.accent },
    goalSubtitle: { color: theme.colors.muted, fontSize: 13 },
    goalSubtitleActive: { color: theme.colors.accent },
    label: { color: theme.colors.text, fontSize: 15 },
    input: { backgroundColor: theme.colors.surfaceHi, borderRadius: 10, color: theme.colors.text, fontSize: 15, paddingHorizontal: 12, paddingVertical: 9, textAlign: 'right', width: 100 },
    error: { color: theme.colors.danger, fontSize: 13, marginTop: 6 },
    segmented: { flexDirection: 'row', gap: 8, marginTop: 4, width: '100%' },
    ratePill: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 12, borderWidth: 1, flex: 1, minWidth: 0, paddingVertical: 10 },
    ratePillActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
    rateText: { color: theme.colors.muted, fontSize: 12, fontWeight: '600' },
    rateTextActive: { color: theme.colors.bg },
    rowValue: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
    targetsNote: { color: theme.colors.muted, fontSize: 13, marginTop: 4 },
    targetsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    targetTile: { alignItems: 'center', backgroundColor: theme.colors.surfaceHi, borderRadius: 14, flex: 1, paddingVertical: 10 },
    targetDot: { borderRadius: 4, height: 8, marginTop: 6, width: 8 },
    targetValue: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginTop: 4 },
    targetName: { fontSize: 11, fontWeight: '600', marginTop: 2 },
    saveButton: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 12, bottom: 30, left: 20, padding: 14, position: 'absolute', right: 20 },
    saveText: { color: theme.colors.bg, fontSize: 16, fontWeight: '700' },
  }), [theme]);

  return (
    <KeyboardAvoidingView style={themedStyles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={themedStyles.header}>
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons color={theme.colors.text} name="chevron-back" size={24} />
          </Pressable>
          <Text style={themedStyles.headerTitle}>Your Goals</Text>
        </View>
        <Text style={themedStyles.subtitle}>We personalise your plan based on these.</Text>

        <Text style={themedStyles.section}>YOUR GOAL</Text>
        <View style={themedStyles.card}>
          {GOAL_OPTIONS.map((option) => (
            <Pressable key={option.value} onPress={() => setGoalType(option.value)} style={[themedStyles.goalCard, goalType === option.value && themedStyles.goalCardActive]}>
              <Ionicons color={goalType === option.value ? theme.colors.accent : theme.colors.muted} name={option.icon} size={26} />
              <View style={themedStyles.goalCardText}>
                <Text style={[themedStyles.goalTitle, goalType === option.value && themedStyles.goalTitleActive]}>{option.label}</Text>
                <Text style={[themedStyles.goalSubtitle, goalType === option.value && themedStyles.goalSubtitleActive]}>{option.desc}</Text>
              </View>
              {goalType === option.value && <Ionicons color={theme.colors.accentText} name="checkmark" size={20} />}
            </Pressable>
          ))}
        </View>

        <Text style={themedStyles.section}>TARGET WEIGHT</Text>
        <View style={themedStyles.card}>
          <View style={styles.field}>
            <Text style={themedStyles.label}>Target weight</Text>
            <TextInput keyboardType="decimal-pad" onChangeText={setTargetWeight} style={themedStyles.input} value={targetWeight} />
          </View>
          {targetWeightError !== null && <Text style={themedStyles.error}>{targetWeightError}</Text>}
        </View>

        <Text style={themedStyles.section}>WEEKLY RATE</Text>
        <View style={themedStyles.card}>
          <View style={themedStyles.segmented}>
            {WEEKLY_RATES.map((rate) => (
              <Pressable key={rate} onPress={() => setWeeklyRate(rate)} style={[themedStyles.ratePill, weeklyRate === rate && themedStyles.ratePillActive]}>
                <Text numberOfLines={1} adjustsFontSizeToFit style={[themedStyles.rateText, weeklyRate === rate && themedStyles.rateTextActive]}>{rate} kg/wk</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {goalType !== 'maintain' && (
          <>
            <Text style={themedStyles.section}>TARGET DATE</Text>
            <View style={themedStyles.card}>
              <View style={styles.field}>
                <Text style={themedStyles.label}>Target date</Text>
                <Text style={themedStyles.rowValue}>{targetDateLabel}</Text>
              </View>
            </View>
          </>
        )}

        <Text style={themedStyles.section}>DAILY TARGETS</Text>
        <View style={themedStyles.card}>
          <View style={themedStyles.targetsRow}>
            <View style={themedStyles.targetTile}>
              <View style={[themedStyles.targetDot, { backgroundColor: theme.colors.accent }]} />
              <Text style={themedStyles.targetValue}>{targets ? formatCalories(targets.calories) : '—'}</Text>
              <Text style={[themedStyles.targetName, { color: theme.colors.accent }]}>Calories</Text>
            </View>
            <View style={themedStyles.targetTile}>
              <View style={[themedStyles.targetDot, { backgroundColor: theme.colors.protein }]} />
              <Text style={themedStyles.targetValue}>{targets ? `${formatGrams(targets.protein)}g` : '—'}</Text>
              <Text style={[themedStyles.targetName, { color: theme.colors.protein }]}>Protein</Text>
            </View>
            <View style={themedStyles.targetTile}>
              <View style={[themedStyles.targetDot, { backgroundColor: theme.colors.carbs }]} />
              <Text style={themedStyles.targetValue}>{targets ? `${formatGrams(targets.carbs)}g` : '—'}</Text>
              <Text style={[themedStyles.targetName, { color: theme.colors.carbs }]}>Carbs</Text>
            </View>
            <View style={themedStyles.targetTile}>
              <View style={[themedStyles.targetDot, { backgroundColor: theme.colors.fat }]} />
              <Text style={themedStyles.targetValue}>{targets ? `${formatGrams(targets.fat)}g` : '—'}</Text>
              <Text style={[themedStyles.targetName, { color: theme.colors.fat }]}>Fat</Text>
            </View>
          </View>
          <Text style={themedStyles.targetsNote}>Recalculated when you save</Text>
        </View>
      </ScrollView>
      <Pressable disabled={saving} onPress={() => void handleSave()} style={themedStyles.saveButton}>
        <Text style={themedStyles.saveText}>{saving ? 'Saving…' : 'Save changes'}</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 100 },
  field: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 8 },
});
