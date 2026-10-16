import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useOnboardingStore } from '../../store/onboardingStore';
import { useTheme } from '../../theme';
import type { ActivityLevel } from '../../types/user';
import type { OnboardingStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Activity'>;

const OPTIONS: { value: ActivityLevel; label: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'sedentary', label: 'Sedentary', subtitle: 'Little or no exercise', icon: 'bed-outline' },
  { value: 'light', label: 'Light', subtitle: '1–3 days/week', icon: 'walk-outline' },
  { value: 'moderate', label: 'Moderate', subtitle: '3–5 days/week', icon: 'bicycle-outline' },
  { value: 'active', label: 'Active', subtitle: '6–7 days/week', icon: 'barbell-outline' },
  { value: 'very_active', label: 'Very active', subtitle: 'Physical job', icon: 'flame-outline' },
];

export default function ActivityScreen({ navigation }: Props) {
  const theme = useTheme();
  const form = useOnboardingStore((s) => s.form);
  const setForm = useOnboardingStore((s) => s.setForm);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = () => {
    if (form.activityLevel === null) {
      setError('Please select your activity level.');
      return;
    }
    setError(null);
    navigation.navigate('Goal');
  };

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
    options: { gap: 10, marginTop: 32 },
    option: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 20, borderWidth: 1, height: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
    optionSelected: { borderColor: theme.colors.accent, borderWidth: 2 },
    iconCircle: { alignItems: 'center', backgroundColor: theme.colors.surfaceHi, borderRadius: 16, height: 40, justifyContent: 'center', width: 40 },
    optionIcon: { color: theme.colors.muted },
    optionBody: { flex: 1, marginLeft: 12 },
    optionLabel: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
    optionSubtitle: { color: theme.colors.muted, fontSize: 13, marginTop: 2 },
    radioContainer: { alignItems: 'center', justifyContent: 'center', width: 32 },
    radioOuter: { borderColor: theme.colors.border, borderRadius: 10, borderWidth: 2, height: 20, width: 20 },
    radioInner: { backgroundColor: theme.colors.accent, borderRadius: 4, height: 8, width: 8 },
    error: { color: theme.colors.danger, fontSize: 14, marginTop: 16, textAlign: 'center' },
    footer: { marginBottom: 40, paddingHorizontal: 20 },
    cta: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 16, height: 56, justifyContent: 'center', flexDirection: 'row', gap: 8 },
    ctaText: { color: theme.colors.bg, fontSize: 16, fontWeight: '700' },
    ctaArrow: { color: theme.colors.bg, fontSize: 16, fontWeight: '700' },
  }), [theme]);

  const goBack = (): void => { navigation.goBack(); };
  const filled = 3;
  const total = 5;

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
      <View style={themedStyles.content}>
        <Text style={themedStyles.title}>How active are you?</Text>
        <Text style={themedStyles.subtitle}>Pick the option that best matches your typical week.</Text>
        <View style={themedStyles.options}>
          {OPTIONS.map((option) => {
            const selected = form.activityLevel === option.value;
            return (
              <Pressable
                key={option.value}
                style={[themedStyles.option, selected && themedStyles.optionSelected]}
                onPress={() => setForm({ activityLevel: option.value })}
              >
                <View style={themedStyles.iconCircle}>
                  <Ionicons style={themedStyles.optionIcon} name={option.icon} size={20} />
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
        {error !== null && <Text style={themedStyles.error}>{error}</Text>}
      </View>
      <View style={themedStyles.footer}>
        <Pressable onPress={handleContinue} style={themedStyles.cta}>
          <Text style={themedStyles.ctaText}>Continue</Text>
          <Text style={themedStyles.ctaArrow}>→</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
