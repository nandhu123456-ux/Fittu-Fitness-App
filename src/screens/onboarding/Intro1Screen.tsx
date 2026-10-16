import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useIntroStore } from '../../store/introStore';
import { useTheme } from '../../theme';
import type { OnboardingStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Intro1'>;

const BENEFITS: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string }[] = [
  { icon: 'nutrition-outline', title: 'Smart Nutrition', subtitle: 'Know what you eat' },
  { icon: 'walk-outline', title: 'Daily Activity', subtitle: 'Keep moving' },
  { icon: 'trending-up-outline', title: 'Track Progress', subtitle: 'See real results' },
  { icon: 'sparkles-outline', title: 'AI Coach', subtitle: 'Personalised guidance' },
];

export default function Intro1Screen({ navigation }: Props) {
  const theme = useTheme();
  const markSeen = useIntroStore((s) => s.markSeen);

  const themedStyles = useMemo(() => StyleSheet.create({
    flex: { backgroundColor: theme.colors.bg, flex: 1 },
    glow: { position: 'absolute', top: -150, alignSelf: 'center', width: 400, height: 400, borderRadius: 200, backgroundColor: theme.colors.accent, opacity: 0.08 },
    header: { paddingHorizontal: 20, marginTop: 12 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    back: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
    progress: { flexDirection: 'row', gap: 4 },
    segment: { flex: 1, height: 3, borderRadius: 2, backgroundColor: theme.colors.border },
    content: { paddingHorizontal: 20, marginTop: 40 },
    title: { color: theme.colors.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
    subtitle: { color: theme.colors.muted, fontSize: 15, lineHeight: 22, marginTop: 8 },
    benefits: { gap: 12, marginTop: 32 },
    benefitCard: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
    iconCircle: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
    icon: { color: theme.colors.bg },
    benefitText: { flex: 1 },
    benefitTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
    benefitSubtitle: { color: theme.colors.muted, fontSize: 12, marginTop: 2 },
    footer: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 20, marginBottom: 40 },
    skip: { color: theme.colors.muted, fontSize: 14, fontWeight: '600', marginBottom: 12 },
    cta: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 16, height: 56, justifyContent: 'center', flexDirection: 'row', gap: 8 },
    ctaText: { color: theme.colors.bg, fontSize: 16, fontWeight: '700' },
    ctaArrow: { color: theme.colors.bg, fontSize: 16, fontWeight: '700' },
  }), [theme]);

  const goBack = (): void => { navigation.goBack(); };
  const goToGender = (): void => { markSeen(); navigation.navigate('Gender'); };
  const skipScreen = (): void => { markSeen(); navigation.navigate('Gender'); };

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
        <Text style={themedStyles.title}>A healthier you, every day</Text>
        <Text style={themedStyles.subtitle}>Track meals, stay active, build better habits.</Text>
        <View style={themedStyles.benefits}>
          {BENEFITS.map((benefit) => (
            <View key={benefit.title} style={themedStyles.benefitCard}>
              <View style={themedStyles.iconCircle}>
                <Ionicons style={themedStyles.icon} name={benefit.icon} size={20} />
              </View>
              <View style={themedStyles.benefitText}>
                <Text style={themedStyles.benefitTitle}>{benefit.title}</Text>
                <Text style={themedStyles.benefitSubtitle}>{benefit.subtitle}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
      <View style={themedStyles.footer}>
        <Pressable onPress={skipScreen}><Text style={themedStyles.skip}>Skip</Text></Pressable>
        <Pressable onPress={goToGender} style={themedStyles.cta}>
          <Text style={themedStyles.ctaText}>Next</Text>
          <Text style={themedStyles.ctaArrow}>→</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
