import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { useOnboardingStore } from '../../store/onboardingStore';
import { useTheme } from '../../theme';
import type { GoalType } from '../../types/user';
import type { OnboardingStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Goal'>;

const OPTIONS: { value: GoalType; label: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'lose', label: 'Lose weight', subtitle: 'Slim down steadily', icon: 'trending-down-outline' },
  { value: 'maintain', label: 'Maintain weight', subtitle: 'Stay where you are', icon: 'heart-outline' },
  { value: 'gain', label: 'Gain weight', subtitle: 'Build strength and size', icon: 'trending-up-outline' },
];

const RATES = ['0.25', '0.5', '0.75', '1'];

export default function GoalScreen({ navigation }: Props) {
  const theme = useTheme();
  const form = useOnboardingStore((s) => s.form);
  const setForm = useOnboardingStore((s) => s.setForm);
  const [target, setTarget] = useState('');
  const [rate, setRate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleContinue = () => {
    if (form.goalType === null) {
      setError('Please select your goal.');
      return;
    }
    if (!target) {
      setError('Please enter your target weight.');
      return;
    }
    if (!rate) {
      setError('Please enter your weekly rate.');
      return;
    }
    const targetNum = Number(target);
    const rateNum = Number(rate);
    if (form.goalType !== 'maintain' && (!Number.isFinite(targetNum) || targetNum < 25 || targetNum > 300)) {
      setError('Target weight must be between 25 and 300 kg.');
      return;
    }
    if (!Number.isFinite(rateNum) || rateNum < 0.25 || rateNum > 1) {
      setError('Weekly rate must be between 0.25 and 1.0 kg.');
      return;
    }
    setError(null);
    setForm({
      targetWeightKg: form.goalType === 'maintain' ? form.weightKg : targetNum,
      weeklyRateKg: rateNum,
    });
    navigation.navigate('Summary');
  };

  const themedStyles = useMemo(() => StyleSheet.create({
    flex: { backgroundColor: theme.colors.bg, flex: 1 },
    glow: { position: 'absolute', top: -150, alignSelf: 'center', width: 400, height: 400, borderRadius: 200, backgroundColor: theme.colors.accent, opacity: 0.08 },
    header: { paddingHorizontal: 20, marginTop: 12 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    back: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
    progress: { flexDirection: 'row', gap: 4 },
    segment: { flex: 1, height: 3, borderRadius: 2, backgroundColor: theme.colors.border },
    title: { color: theme.colors.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
    subtitle: { color: theme.colors.muted, fontSize: 15, lineHeight: 22, marginTop: 8 },
    options: { gap: 12, marginTop: 32 },
    option: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 20, borderWidth: 1, height: 100, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
    optionSelected: { borderColor: theme.colors.accent, borderWidth: 2 },
    iconCircle: { alignItems: 'center', backgroundColor: theme.colors.surfaceHi, borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
    optionIcon: { color: theme.colors.muted },
    optionBody: { flex: 1, marginLeft: 12 },
    optionLabel: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
    optionSubtitle: { color: theme.colors.muted, fontSize: 13, marginTop: 2 },
    radioContainer: { alignItems: 'center', justifyContent: 'center', width: 32 },
    radioOuter: { borderColor: theme.colors.border, borderRadius: 10, borderWidth: 2, height: 20, width: 20 },
    radioInner: { backgroundColor: theme.colors.accent, borderRadius: 4, height: 8, width: 8 },
    detailsCard: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 20, borderWidth: 1, marginTop: 24, shadowColor: '#000', shadowOpacity: 0.25, shadowOffset: { width: 0, height: 8 }, shadowRadius: 16, elevation: 4 },
    detailsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    detailsRowLast: { borderBottomWidth: 0 },
    detailsLabel: { color: theme.colors.muted, fontSize: 13, width: 110 },
    detailsInput: { color: theme.colors.text, fontSize: 16, flex: 1 },
    segmented: { flexDirection: 'row', gap: 8, marginTop: 10, width: '100%' },
    rateBlock: { borderTopColor: theme.colors.border, borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
    segmentBtn: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 12, borderWidth: 1, flex: 1, minWidth: 0, paddingVertical: 10 },
    segmentBtnSelected: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
    segmentText: { color: theme.colors.text, fontSize: 12, fontWeight: '600' },
    segmentTextSelected: { color: theme.colors.bg },
    error: { color: theme.colors.danger, fontSize: 14, marginTop: 16, textAlign: 'center' },
    footer: { marginBottom: 40, paddingHorizontal: 20 },
    cta: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 16, height: 56, justifyContent: 'center', flexDirection: 'row', gap: 8 },
    ctaText: { color: theme.colors.bg, fontSize: 16, fontWeight: '700' },
    ctaArrow: { color: theme.colors.bg, fontSize: 16, fontWeight: '700' },
  }), [theme]);

  const goBack = (): void => { navigation.goBack(); };
  const filled = 4;
  const total = 5;
  const showDetails = form.goalType !== null && form.goalType !== 'maintain';
  const rateSelected = RATES.includes(rate) ? rate : '';

  return (
    <SafeAreaView style={themedStyles.flex}>
      <View style={themedStyles.glow} />
      <View style={themedStyles.header}>
        <View style={themedStyles.topRow}>
          <Pressable onPress={goBack} style={themedStyles.back} hitSlop={12}>
            <Ionicons color={theme.colors.text} name="chevron-back" size={24} />
          </Pressable>
          <View style={themedStyles.progress}>
            {Array.from({ length: total }).map((_, i) => (
              <View key={i} style={[themedStyles.segment, i < filled && { backgroundColor: theme.colors.accent }]} />
            ))}
          </View>
        </View>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0} style={themedStyles.flex}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
        <Text style={themedStyles.title}>What's your goal?</Text>
        <Text style={themedStyles.subtitle}>We'll personalise your plan based on this.</Text>
        <View style={themedStyles.options}>
          {OPTIONS.map((option) => {
            const selected = form.goalType === option.value;
            return (
              <Pressable
                key={option.value}
                style={[themedStyles.option, selected && themedStyles.optionSelected]}
                onPress={() => setForm({ goalType: option.value })}
              >
                <View style={themedStyles.iconCircle}>
                  <Ionicons style={themedStyles.optionIcon} name={option.icon} size={22} />
                </View>
                <View style={themedStyles.optionBody}>
                  <Text style={themedStyles.optionLabel}>{option.label}</Text>
                  <Text style={themedStyles.optionSubtitle}>{option.subtitle}</Text>
                </View>
                <View style={themedStyles.radioContainer}>
                  <View style={themedStyles.radioOuter}>
                    {selected && <View style={themedStyles.radioInner} />}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
        {showDetails && (
          <View style={themedStyles.detailsCard}>
            <View style={[themedStyles.detailsRow, themedStyles.detailsRowLast]}>
              <Text style={themedStyles.detailsLabel}>Target weight</Text>
              <TextInput style={themedStyles.detailsInput} placeholder="kg" placeholderTextColor={theme.colors.muted} keyboardType="numeric" value={target} onChangeText={setTarget} />
            </View>
            <View style={themedStyles.rateBlock}>
              <Text style={themedStyles.detailsLabel}>Weekly rate</Text>
              <View style={themedStyles.segmented}>
                {RATES.map((r) => {
                  const sel = rateSelected === r;
                  return (
                    <Pressable key={r} style={[themedStyles.segmentBtn, sel && themedStyles.segmentBtnSelected]} onPress={() => setRate(r)}>
                      <Text numberOfLines={1} adjustsFontSizeToFit style={[themedStyles.segmentText, sel && themedStyles.segmentTextSelected]}>{r} kg/wk</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        )}
        {error !== null && <Text style={themedStyles.error}>{error}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={themedStyles.footer}>
        <Pressable onPress={handleContinue} style={themedStyles.cta}>
          <Text style={themedStyles.ctaText}>Continue</Text>
          <Text style={themedStyles.ctaArrow}>→</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 100, paddingHorizontal: 20, paddingTop: 40 },
});
