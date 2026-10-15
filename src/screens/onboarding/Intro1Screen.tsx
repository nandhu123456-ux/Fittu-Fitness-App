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
    flex: { backgroundColor: theme.colors.bg, flex: 1, padding: 24 },
    topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'flex-end' },
    skip: { color: theme.colors.accent, fontSize: 14, fontWeight: '600' },
    title: { color: theme.colors.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
    subtitle: { color: theme.colors.muted, fontSize: 14, lineHeight: 20, marginTop: 6 },
    card: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
    cardIcon: { alignItems: 'center', backgroundColor: theme.colors.surfaceHi, borderRadius: 12, height: 40, justifyContent: 'center', width: 40 },
    cardText: { flex: 1 },
    cardTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
    cardSubtitle: { color: theme.colors.muted, fontSize: 12, marginTop: 1 },
    dots: { alignItems: 'center', flexDirection: 'row', gap: 8, marginVertical: 20 },
    dot: { backgroundColor: theme.colors.border, borderRadius: 4, height: 8, width: 8 },
    dotActive: { backgroundColor: theme.colors.accent, width: 22 },
    footer: { flex: 1, justifyContent: 'flex-end' },
    cta: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 16, flexDirection: 'row', gap: 8, height: 56, justifyContent: 'center', marginTop: 20 },
    ctaText: { color: theme.colors.accentText, fontSize: 16, fontWeight: '700' },
  }), [theme]);

  const goToGender = (): void => {
    markSeen();
    navigation.navigate('Gender');
  };

  return (
    <SafeAreaView style={themedStyles.flex}>
      <View style={themedStyles.topRow}>
        <Pressable hitSlop={8} onPress={goToGender}>
          <Text style={themedStyles.skip}>Skip</Text>
        </Pressable>
      </View>

      <View style={{ gap: 16, marginTop: 32 }}>
        <Text style={themedStyles.title}>A healthier you, every day</Text>
        <Text style={themedStyles.subtitle}>Track meals, stay active, build better habits.</Text>
        <View style={{ gap: 12 }}>
          {BENEFITS.map((benefit) => (
            <View key={benefit.title} style={themedStyles.card}>
              <View style={themedStyles.cardIcon}>
                <Ionicons color={theme.colors.accent} name={benefit.icon} size={20} />
              </View>
              <View style={themedStyles.cardText}>
                <Text style={themedStyles.cardTitle}>{benefit.title}</Text>
                <Text style={themedStyles.cardSubtitle}>{benefit.subtitle}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={themedStyles.footer}>
        <View style={themedStyles.dots}>
          <View style={[themedStyles.dot, themedStyles.dotActive]} />
          <View style={themedStyles.dot} />
        </View>
        <Pressable
          onPress={() => { markSeen(); navigation.navigate('Intro2'); }}
          style={themedStyles.cta}
        >
          <Text style={themedStyles.ctaText}>Next</Text>
          <Ionicons color={theme.colors.accentText} name="arrow-forward" size={20} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
