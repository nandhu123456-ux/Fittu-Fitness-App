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
  { key: 'protein', label: 'Protein', icon: 'barbell-outline', colorKey: 'protein' },
  { key: 'carbs', label: 'Carbs', icon: 'leaf-outline', colorKey: 'carbs' },
  { key: 'fats', label: 'Healthy Fats', icon: 'water-outline', colorKey: 'fat' },
];

export default function Intro2Screen({ navigation }: Props) {
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
    macroRow: { flexDirection: 'row', gap: 12, marginTop: 32 },
    macroCard: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 20, borderWidth: 1, flex: 1, gap: 10, padding: 16 },
    macroHalo: { alignItems: 'center', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
    macroLabel: { color: theme.colors.text, fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 8 },
    footer: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 20, marginBottom: 40 },
    cta: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 16, height: 56, justifyContent: 'center', flexDirection: 'row', gap: 8 },
    ctaText: { color: theme.colors.bg, fontSize: 16, fontWeight: '700' },
    ctaArrow: { color: theme.colors.bg, fontSize: 16, fontWeight: '700' },
  }), [theme]);

  const goBack = (): void => { navigation.goBack(); };
  const goToGender = (): void => { markSeen(); navigation.navigate('Gender'); };

  const filled = 2;
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
        <Text style={themedStyles.title}>Food that fits you</Text>
        <Text style={themedStyles.subtitle}>Get personalised meal plans based on your goals and preferences.</Text>
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
        <Pressable onPress={goToGender} style={themedStyles.cta}>
          <Text style={themedStyles.ctaText}>Next</Text>
          <Text style={themedStyles.ctaArrow}>→</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
