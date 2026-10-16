import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useOnboardingStore } from '../../store/onboardingStore';
import { useTheme } from '../../theme';
import type { Gender } from '../../types/user';
import type { OnboardingStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Gender'>;

const OPTIONS: { value: Gender; label: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'male', label: 'Male', subtitle: 'Biological male', icon: 'male-outline' },
  { value: 'female', label: 'Female', subtitle: 'Biological female', icon: 'female-outline' },
];

export default function GenderScreen({ navigation }: Props) {
  const theme = useTheme();
  const form = useOnboardingStore((s) => s.form);
  const setForm = useOnboardingStore((s) => s.setForm);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = () => {
    if (form.gender === null) {
      setError('Please select an option.');
      return;
    }
    setError(null);
    navigation.navigate('BodyStats');
  };

  const themedStyles = useMemo(() => StyleSheet.create({
    flex: { backgroundColor: theme.colors.bg, flex: 1 },
    glow: { position: 'absolute', top: -150, alignSelf: 'center', width: 400, height: 400, borderRadius: 200, backgroundColor: theme.colors.accent, opacity: 0.08 },
    header: { paddingHorizontal: 20, marginTop: 12 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    back: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
    progress: { flexDirection: 'row', gap: 4 },
    segment: { flex: 1, height: 3, borderRadius: 2, backgroundColor: theme.colors.border },
    content: { flex: 1, paddingHorizontal: 20, paddingTop: 40, justifyContent: 'center' },
    title: { color: theme.colors.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
    subtitle: { color: theme.colors.muted, fontSize: 15, lineHeight: 22, marginTop: 8 },
    options: { gap: 12, marginTop: 32 },
    option: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 20, borderWidth: 1, height: 100, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
    optionSelected: { borderColor: theme.colors.accent, borderWidth: 2 },
    iconCircle: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
    optionIcon: { color: theme.colors.bg },
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
  const filled = 1;
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
        <Text style={themedStyles.title}>What's your biological sex?</Text>
        <Text style={themedStyles.subtitle}>This helps us calculate your metabolism accurately.</Text>
        <View style={themedStyles.options}>
          {OPTIONS.map((option) => {
            const selected = form.gender === option.value;
            return (
              <Pressable
                key={option.value}
                style={[themedStyles.option, selected && themedStyles.optionSelected]}
                onPress={() => setForm({ gender: option.value })}
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
