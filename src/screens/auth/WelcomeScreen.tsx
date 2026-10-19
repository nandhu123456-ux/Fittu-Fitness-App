import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';
import type { AuthStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  const theme = useTheme();

  const themedStyles = useMemo(() => StyleSheet.create({
    flex: { backgroundColor: theme.colors.bg, flex: 1 },
    glow: { position: 'absolute', top: -150, alignSelf: 'center', width: 400, height: 400, borderRadius: 200, backgroundColor: theme.colors.accent, opacity: 0.08 },
    center: { alignItems: 'center', marginTop: 80 },
    icon: { width: 120, height: 120, borderRadius: 28 },
    wordmark: { flexDirection: 'row', marginTop: 24 },
    wordFi: { color: theme.colors.text, fontSize: 42, fontWeight: '700' },
    wordTtu: { color: theme.colors.accent, fontSize: 42, fontWeight: '700' },
    tagline: { color: theme.colors.muted, fontSize: 13, letterSpacing: 2.5, textAlign: 'center', textTransform: 'uppercase', marginTop: 16 },
    footer: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 20 },
    cta: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 16, height: 56, justifyContent: 'center', flexDirection: 'row', gap: 8, marginBottom: 24 },
    ctaText: { color: theme.colors.bg, fontSize: 16, fontWeight: '700' },
    ctaArrow: { color: theme.colors.bg, fontSize: 16, fontWeight: '700' },
    signInRow: { alignItems: 'center', flexDirection: 'row', gap: 4, justifyContent: 'center' },
    signInPlain: { color: theme.colors.muted, fontSize: 14 },
    signInLink: { color: theme.colors.accent, fontSize: 14, fontWeight: '600' },
  }), [theme]);

  return (
    <SafeAreaView style={themedStyles.flex}>
      <View style={themedStyles.glow} />
      <View style={themedStyles.center}>
        <Image source={require('../../../icons/icon.png')} style={themedStyles.icon} />
        <View style={themedStyles.wordmark}>
          <Text style={themedStyles.wordFi}>Fi</Text>
          <Text style={themedStyles.wordTtu}>ttu</Text>
        </View>
        <Text style={themedStyles.tagline}>Discipline today.\nBrighter tomorrow.</Text>
      </View>
      <View style={themedStyles.footer}>
        <Pressable onPress={() => navigation.navigate('SignUp')} style={themedStyles.cta}>
          <Text style={themedStyles.ctaText}>Get Started</Text>
          <Text style={themedStyles.ctaArrow}>→</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('SignIn')} style={themedStyles.signInRow}>
          <Text style={themedStyles.signInPlain}>Already have an account?</Text>
          <Text style={themedStyles.signInLink}>Sign in</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
