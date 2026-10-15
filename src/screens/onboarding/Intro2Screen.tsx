import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useIntroStore } from '../../store/introStore';
import { useTheme } from '../../theme';
import { withAlpha } from '../../utils/color';
import type { OnboardingStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Intro2'>;

const MACROS: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; colorKey: 'protein' | 'carbs' | 'fat' }[] = [
  { key: 'protein', label: 'Protein', icon: 'fish-outline', colorKey: 'protein' },
  { key: 'carbs', label: 'Carbs', icon: 'nutrition-outline', colorKey: 'carbs' },
  { key: 'fats', label: 'Healthy Fats', icon: 'water-outline', colorKey: 'fat' },
];

export default function Intro2Screen({ navigation }: Props) {
  const theme = useTheme();
  const markSeen = useIntroStore((s) => s.markSeen);

  const themedStyles = useMemo(() => StyleSheet.create({
    flex: { backgroundColor: theme.colors.bg, flex: 1, padding: 24 },
    topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'flex-end' },
    skip: { color: theme.colors.accent, fontSize: 14, fontWeight: '600' },
    title: { color: theme.colors.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
    subtitle: { color: theme.colors.muted, fontSize: 14, lineHeight: 20, marginTop: 6 },
    macroRow: { flexDirection: 'row', gap: 12 },
    macroCard: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 16, borderWidth: 1, flex: 1, gap: 8, padding: 12 },
    macroHalo: { alignItems: 'center', borderRadius: 999, height: 44, justifyContent: 'center', width: 44 },
    macroLabel: { color: theme.colors.text, fontSize: 13, fontWeight: '600', textAlign: 'center' },
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

      <View style={{ gap: 24, marginTop: 32 }}>
        <View>
          <Text style={themedStyles.title}>Food that fits you</Text>
          <Text style={themedStyles.subtitle}>Get personalised meal plans based on your goals and preferences.</Text>
        </View>
        <View style={themedStyles.macroRow}>
          {MACROS.map((macro) => {
            const color = theme.colors[macro.colorKey];
            return (
              <View key={macro.key} style={themedStyles.macroCard}>
                <View style={[themedStyles.macroHalo, { backgroundColor: withAlpha(color, 0.2) }]}>
                  <Ionicons color={color} name={macro.icon} size={20} />
                </View>
                <Text style={themedStyles.macroLabel}>{macro.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={themedStyles.footer}>
        <View style={themedStyles.dots}>
          <View style={themedStyles.dot} />
          <View style={[themedStyles.dot, themedStyles.dotActive]} />
        </View>
        <Pressable onPress={goToGender} style={themedStyles.cta}>
          <Text style={themedStyles.ctaText}>Next</Text>
          <Ionicons color={theme.colors.accentText} name="arrow-forward" size={20} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
