import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';
import type { AuthStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const BENEFITS: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string }[] = [
  { icon: 'checkmark-circle', title: 'Better Food', subtitle: 'Know what you eat' },
  { icon: 'flame', title: 'Stronger You', subtitle: 'Real results' },
  { icon: 'heart', title: 'Healthier Tomorrow', subtitle: 'Personalised guidance' },
];

export default function WelcomeScreen({ navigation }: Props) {
  const theme = useTheme();

  const themedStyles = useMemo(() => StyleSheet.create({
    flex: { backgroundColor: theme.colors.bg, flex: 1, padding: 24 },
    brand: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    brandFit: { color: theme.colors.accent },
    word: { color: theme.colors.text, fontSize: 40, fontWeight: '700' },
    tagline: { color: theme.colors.muted, fontSize: 13, letterSpacing: 2, marginTop: 12, textAlign: 'center', textTransform: 'uppercase' },
    benefits: { alignSelf: 'center', gap: 16, maxWidth: 320, width: '100%' },
    benefit: { alignItems: 'center', flexDirection: 'row', gap: 14 },
    benefitText: { flex: 1 },
    benefitTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
    benefitSubtitle: { color: theme.colors.muted, fontSize: 12, marginTop: 1 },
    footer: { flex: 1, justifyContent: 'flex-end' },
    cta: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 16, flexDirection: 'row', gap: 8, height: 56, justifyContent: 'center' },
    ctaText: { color: theme.colors.accentText, fontSize: 16, fontWeight: '700' },
    signInRow: { alignItems: 'center', flexDirection: 'row', gap: 4, justifyContent: 'center', marginTop: 16 },
    signInPlain: { color: theme.colors.muted, fontSize: 14 },
    signInLink: { color: theme.colors.accent, fontSize: 14, fontWeight: '600' },
  }), [theme]);

  return (
    <SafeAreaView style={themedStyles.flex}>
      <View style={styles.center}>
        <View style={themedStyles.brand}>
          <Text style={themedStyles.word}>Be</Text>
          <Text style={[themedStyles.word, themedStyles.brandFit]}>_</Text>
          <Text style={themedStyles.word}>fit</Text>
        </View>
        <Text style={themedStyles.tagline}>{'Discipline today\nBrighter tomorrow'}</Text>
      </View>

      <View style={themedStyles.benefits}>
        {BENEFITS.map((benefit) => (
          <View key={benefit.title} style={themedStyles.benefit}>
            <Ionicons color={theme.colors.accent} name={benefit.icon} size={20} />
            <View style={themedStyles.benefitText}>
              <Text style={themedStyles.benefitTitle}>{benefit.title}</Text>
              <Text style={themedStyles.benefitSubtitle}>{benefit.subtitle}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={themedStyles.footer}>
        <Pressable onPress={() => navigation.navigate('SignUp')} style={themedStyles.cta}>
          <Text style={themedStyles.ctaText}>Get Started</Text>
          <Ionicons color={theme.colors.accentText} name="chevron-forward" size={20} />
        </Pressable>
        <Pressable onPress={() => navigation.navigate('SignIn')} style={themedStyles.signInRow}>
          <Text style={themedStyles.signInPlain}>Already have an account?</Text>
          <Text style={themedStyles.signInLink}>Sign In</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { marginTop: 48 },
});
