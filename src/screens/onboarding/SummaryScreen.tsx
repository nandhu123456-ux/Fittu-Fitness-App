import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../constants/colors';
import { getUserProfile, updateUserProfile } from '../../services/user';
import { useAuthStore } from '../../store/authStore';
import { useOnboardingStore } from '../../store/onboardingStore';
import { calculateBMR, calculateTargets, calculateTDEE } from '../../utils/nutrition';

export default function SummaryScreen() {
  const form = useOnboardingStore((s) => s.form);
  const user = useAuthStore((s) => s.user);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { gender, age, heightCm, weightKg, activityLevel, goalType } = form;

  // Guard: route only renders after prior screens validated, but never compute with nulls.
  if (gender === null || activityLevel === null || goalType === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Please complete the previous steps.</Text>
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
    <View style={styles.container}>
      <Text style={styles.heading}>Your plan</Text>
      <Text style={styles.row}>BMR: {bmr} kcal/day</Text>
      <Text style={styles.row}>TDEE: {tdee} kcal/day</Text>
      <Text style={styles.rowStrong}>Daily calories: {targets.calories} kcal</Text>
      <Text style={styles.row}>Protein: {targets.protein} g</Text>
      <Text style={styles.row}>Carbs: {targets.carbs} g</Text>
      <Text style={styles.row}>Fat: {targets.fat} g</Text>
      {error !== null && <Text style={styles.error}>{error}</Text>}
      <Pressable style={styles.button} onPress={handleConfirm} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={styles.buttonText}>Confirm</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  row: {
    color: colors.text,
    fontSize: 16,
  },
  rowStrong: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
    marginVertical: 4,
  },
  error: {
    color: '#FF6B6B',
    fontSize: 14,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
