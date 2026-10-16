import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getUserProfile, updateUserProfile } from '../../services/user';
import { useAuthStore } from '../../store/authStore';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useTheme } from '../../theme';
import type { OnboardingStackParamList } from '../../types/navigation';
import { calculateBMR, calculateTargets, calculateTDEE } from '../../utils/nutrition';

export default function SummaryScreen() {
  const theme = useTheme();
  const form = useOnboardingStore((s) => s.form);
  const user = useAuthStore((s) => s.user);
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const themedStyles = useMemo(() => StyleSheet.create({
    flex: { backgroundColor: theme.colors.bg, flex: 1 },
    glow: { position: 'absolute', top: -150, alignSelf: 'center', width: 400, height: 400, borderRadius: 200, backgroundColor: theme.colors.accent, opacity: 0.08 },
    header: { paddingHorizontal: 20, marginTop: 12 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    back: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
    progress: { flexDirection: 'row', gap: 4 },
    segment: { flex: 1, height: 3, borderRadius: 2, backgroundColor: theme.colors.border },
    content: { flex: 1, paddingHorizontal: 20, paddingTop: 40 },
    title: { color: theme.colors.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
    subtitle: { color: theme.colors.muted, fontSize: 15, lineHeight: 22, marginTop: 8 },
    heroCard: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 20, borderWidth: 1, marginTop: 32, shadowColor: '#000', shadowOpacity: 0.25, shadowOffset: { width: 0, height: 8 }, shadowRadius: 16, elevation: 4, padding: 24, alignItems: 'center' },
    calorieNumber: { color: theme.colors.accent, fontSize: 48, fontWeight: '700' },
    calorieUnit: { color: theme.colors.text, fontSize: 13, fontWeight: '600', marginTop: 2 },
    bmrLine: { color: theme.colors.muted, fontSize: 12, marginTop: 8 },
    macros: { flexDirection: 'row', gap: 10, marginTop: 24 },
    macroMini: { alignItems: 'center', backgroundColor: theme.colors.surfaceHi, borderRadius: 14, paddingVertical: 10, flex: 1 },
    macroDot: { alignItems: 'center', borderRadius: 10, height: 20, justifyContent: 'center', width: 20, marginBottom: 6 },
    macroValue: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
    macroLabel: { color: theme.colors.muted, fontSize: 11 },
    statsRow: { flexDirection: 'row', gap: 10, marginTop: 16, paddingHorizontal: 4 },
    statMini: { alignItems: 'center', backgroundColor: theme.colors.surfaceHi, borderRadius: 14, paddingVertical: 10, flex: 1 },
    statValue: { color: theme.colors.accent, fontSize: 16, fontWeight: '700' },
    statLabel: { color: theme.colors.muted, fontSize: 11 },
    error: { color: theme.colors.danger, fontSize: 14, marginTop: 16, textAlign: 'center' },
    footer: { marginBottom: 40, paddingHorizontal: 20 },
    cta: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 16, height: 56, justifyContent: 'center', flexDirection: 'row', gap: 8 },
    ctaText: { color: theme.colors.bg, fontSize: 16, fontWeight: '700' },
    ctaArrow: { color: theme.colors.bg, fontSize: 16, fontWeight: '700' },
    successCard: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 20, borderWidth: 1, alignItems: 'center', paddingVertical: 32 },
    successIcon: { alignItems: 'center', backgroundColor: theme.colors.success, borderRadius: 28, height: 56, justifyContent: 'center', width: 56 },
    successTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '700', marginTop: 16 },
    successSubtitle: { color: theme.colors.muted, fontSize: 13, textAlign: 'center', marginTop: 6, paddingHorizontal: 24 },
    missingWrap: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
    missingTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '700', marginTop: 12 },
    missingBody: { color: theme.colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6, textAlign: 'center' },
    missingBtn: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 14, marginTop: 20, paddingHorizontal: 24, paddingVertical: 12 },
    missingBtnText: { color: theme.colors.bg, fontSize: 14, fontWeight: '700' },
  }), [theme]);

  const { gender, age, heightCm, weightKg, activityLevel, goalType } = form;

  if (gender === null || activityLevel === null || goalType === null) {
    return (
      <SafeAreaView style={themedStyles.flex}>
        <View style={themedStyles.glow} />
        <View style={themedStyles.missingWrap}>
          <Ionicons name="alert-circle-outline" size={40} color={theme.colors.muted} />
          <Text style={themedStyles.missingTitle}>Almost there</Text>
          <Text style={themedStyles.missingBody}>Some details are missing. Go back and complete them.</Text>
          <Pressable onPress={() => navigation.goBack()} style={themedStyles.missingBtn}>
            <Text style={themedStyles.missingBtnText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
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
      setSuccess(true);
      setSubmitting(false);
      setTimeout(() => {
        const fresh = getUserProfile(user.uid);
        fresh.then((profile) => {
          if (profile !== null) {
            useAuthStore.getState().setProfile(profile);
          }
        });
      }, 900);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your plan.');
      setSubmitting(false);
    }
  };

  const { protein, carbs, fat } = targets;

  return (
    <SafeAreaView style={themedStyles.flex}>
      <View style={themedStyles.glow} />
      <View style={themedStyles.header}>
        <View style={themedStyles.topRow}>
          <Pressable style={themedStyles.back} hitSlop={12} />
          <View style={themedStyles.progress}>
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i} style={[themedStyles.segment, { backgroundColor: theme.colors.accent }]} />
            ))}
          </View>
        </View>
      </View>
      <View style={themedStyles.content}>
        <Text style={themedStyles.title}>Your plan is ready</Text>
        <Text style={themedStyles.subtitle}>Here's what we calculated for you.</Text>
        <View style={themedStyles.heroCard}>
          <Text style={themedStyles.calorieNumber}>{targets.calories}</Text>
          <Text style={themedStyles.calorieUnit}>kcal / day</Text>
          <Text style={themedStyles.bmrLine}>{bmr} BMR · {tdee} TDEE</Text>
        </View>
        <View style={themedStyles.macros}>
          <View style={themedStyles.macroMini}>
            <View style={[themedStyles.macroDot, { backgroundColor: theme.colors.protein }]} />
            <Text style={themedStyles.macroValue}>{targets.protein}</Text>
            <Text style={themedStyles.macroLabel}>Protein</Text>
          </View>
          <View style={themedStyles.macroMini}>
            <View style={[themedStyles.macroDot, { backgroundColor: theme.colors.carbs }]} />
            <Text style={themedStyles.macroValue}>{targets.carbs}</Text>
            <Text style={themedStyles.macroLabel}>Carbs</Text>
          </View>
          <View style={themedStyles.macroMini}>
            <View style={[themedStyles.macroDot, { backgroundColor: theme.colors.fat }]} />
            <Text style={themedStyles.macroValue}>{targets.fat}</Text>
            <Text style={themedStyles.macroLabel}>Healthy Fats</Text>
          </View>
        </View>
        <View style={themedStyles.statsRow}>
          <View style={themedStyles.statMini}>
            <Text style={themedStyles.statValue}>{targetWeightKg}</Text>
            <Text style={themedStyles.statLabel}>Target weight</Text>
          </View>
          <View style={themedStyles.statMini}>
            <Text style={themedStyles.statValue}>—</Text>
            <Text style={themedStyles.statLabel}>BMI</Text>
          </View>
          <View style={themedStyles.statMini}>
            <Text style={themedStyles.statValue}>—</Text>
            <Text style={themedStyles.statLabel}>Body Fat</Text>
          </View>
        </View>
        {error !== null && <Text style={themedStyles.error}>{error}</Text>}
      </View>
      <View style={themedStyles.footer}>
        {!success ? (
          <Pressable onPress={handleConfirm} style={themedStyles.cta} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color={theme.colors.text} />
            ) : (
              <>
                <Text style={themedStyles.ctaText}>Start my journey</Text>
                <Text style={themedStyles.ctaArrow}>→</Text>
              </>
            )}
          </Pressable>
        ) : (
          <View style={themedStyles.successCard}>
            <View style={themedStyles.successIcon}>
              <Ionicons name="checkmark-outline" color={theme.colors.bg} size={24} />
            </View>
            <Text style={themedStyles.successTitle}>Plan saved</Text>
            <Text style={themedStyles.successSubtitle}>Your personalised plan is ready. Welcome to Fittu.</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
