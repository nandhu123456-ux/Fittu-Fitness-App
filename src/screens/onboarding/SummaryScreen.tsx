import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { getUserProfile, updateUserProfile } from '../../services/user';
import { useAuthStore } from '../../store/authStore';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useTheme } from '../../theme';
import { calculateBMR, calculateTargets, calculateTDEE } from '../../utils/nutrition';

export default function SummaryScreen() {
  const theme = useTheme();
  const form = useOnboardingStore((s) => s.form);
  const user = useAuthStore((s) => s.user);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const themedStyles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center', paddingHorizontal: 32, gap: 10 },
    heading: { fontSize: 22, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },
    row: { color: theme.colors.text, fontSize: 16 },
    rowStrong: { color: theme.colors.accentAlt, fontSize: 18, fontWeight: '700', marginVertical: 4 },
    error: { color: theme.colors.danger, fontSize: 14 },
    button: { backgroundColor: theme.colors.accentAlt, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
    buttonText: { color: theme.colors.accentText, fontSize: 16, fontWeight: '600' },
  }), [theme]);

  const { gender, age, heightCm, weightKg, activityLevel, goalType } = form;

  // Guard: route only renders after prior screens validated, but never compute with nulls.
  if (gender === null || activityLevel === null || goalType === null) {
    return (
      <View style={themedStyles.container}>
        <Text style={themedStyles.error}>Please complete the previous steps.</Text>
      </View>
    );
  }

  const bmr = calculateBMR(weightKg, heightCm, age, gender);
  const tdee = calculateTDEE(bmr, activityLevel);
  const targets = calculateTargets({ tdee, bmr, goalType, weightKg });
  const targetWeightKg = goalType === 'maintain' ? weightKg : form.targetWeightKg;

  const handleConfirm = async () => {
    if (user === null) {
      setError('No signed-in user found. Please sign in again.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await updateUserProfile(user.uid, {
        profile: { gender, age, heightCm, weightKg, activityLevel },
        goal: { type: goalType, targetWeightKg, weeklyRateKg: form.weeklyRateKg },
        bmr,
        tdee,
        targets,
        onboardingComplete: true,
      });
      useOnboardingStore.getState().resetForm();
      const fresh = await getUserProfile(user.uid);
      if (fresh === null) {
        setError('Plan saved but profile could not be reloaded. Please relaunch the app.');
        return;
      }
      useAuthStore.getState().setProfile(fresh);
      // RootNavigator switches to Main tabs automatically via profile.onboardingComplete.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your plan.');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <View style={themedStyles.container}>
      <Text style={themedStyles.heading}>Your plan</Text>
      <Text style={themedStyles.row}>BMR: {bmr} kcal/day</Text>
      <Text style={themedStyles.row}>TDEE: {tdee} kcal/day</Text>
      <Text style={themedStyles.rowStrong}>Daily calories: {targets.calories} kcal</Text>
      <Text style={themedStyles.row}>Protein: {targets.protein} g</Text>
      <Text style={themedStyles.row}>Carbs: {targets.carbs} g</Text>
      <Text style={themedStyles.row}>Fat: {targets.fat} g</Text>
      {error !== null && <Text style={themedStyles.error}>{error}</Text>}
      <Pressable style={themedStyles.button} onPress={handleConfirm} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color={theme.colors.text} />
        ) : (
          <Text style={themedStyles.buttonText}>Confirm</Text>
        )}
      </Pressable>
    </View>
  );
}

