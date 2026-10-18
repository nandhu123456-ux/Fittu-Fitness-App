import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { signUp } from '../../services/auth';
import { useTheme } from '../../theme';
import type { AuthStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation }: Props) {
  const theme = useTheme();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      setError('Name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!termsAccepted) {
      setError('Please accept the Terms of Service and Privacy Policy.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signUp(email.trim(), password, displayName.trim());
      // RootNavigator switches to Onboarding automatically via onAuthChange.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign up failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const themedStyles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center', paddingHorizontal: 32, gap: 14 },
    heading: { fontSize: 24, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
    input: { backgroundColor: theme.colors.surfaceHi, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, color: theme.colors.text, fontSize: 16 },
    error: { color: theme.colors.danger, fontSize: 14 },
    button: { backgroundColor: theme.colors.accentAlt, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
    buttonText: { color: theme.colors.accentText, fontSize: 16, fontWeight: '600' },
    link: { color: theme.colors.accentAlt, textAlign: 'center', fontSize: 14 },

    // ── Terms row ─────────────────────────────────────────────
    termsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 10,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: theme.colors.muted,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: {
      backgroundColor: theme.colors.accentAlt,
      borderColor: theme.colors.accentAlt,
    },
    checkboxMark: {
      color: theme.colors.accentText,
      fontSize: 13,
      fontWeight: '700',
      lineHeight: 16,
      includeFontPadding: false, // prevents Android extra glyph padding
      textAlign: 'center',
    },
    termsText: {
      flex: 1,
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 20,
    },
    // Link inherits fontSize + lineHeight from parent Text — same visual size,
    // same baseline. Only colour/weight/underline are overridden.
    termsLink: {
      color: theme.colors.accentAlt,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
  }), [theme]);

  return (
    <KeyboardAvoidingView style={themedStyles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Text style={themedStyles.heading}>Sign Up</Text>
      <TextInput
        style={themedStyles.input}
        placeholder="Name"
        placeholderTextColor={theme.colors.muted}
        value={displayName}
        onChangeText={setDisplayName}
      />
      <TextInput
        style={themedStyles.input}
        placeholder="Email"
        placeholderTextColor={theme.colors.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={themedStyles.input}
        placeholder="Password (min 6 characters)"
        placeholderTextColor={theme.colors.muted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error !== null && <Text style={themedStyles.error}>{error}</Text>}

      <View style={themedStyles.termsRow}>
        <Pressable
          onPress={() => setTermsAccepted((prev) => !prev)}
          hitSlop={10}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: termsAccepted }}
          accessibilityLabel="Accept Terms of Service and Privacy Policy"
        >
          <View style={[themedStyles.checkbox, termsAccepted && themedStyles.checkboxChecked]}>
            {termsAccepted && <Text style={themedStyles.checkboxMark}>✓</Text>}
          </View>
        </Pressable>

        <Text style={themedStyles.termsText}>
          I agree to the{' '}
          <Text
            style={themedStyles.termsLink}
            onPress={() => (navigation as any).navigate('TermsOfService')}
            suppressHighlighting={false}
          >
            Terms of Service
          </Text>
          {' '}and{' '}
          <Text
            style={themedStyles.termsLink}
            onPress={() => (navigation as any).navigate('PrivacyPolicy')}
            suppressHighlighting={false}
          >
            Privacy Policy
          </Text>
        </Text>
      </View>

      <Pressable style={themedStyles.button} onPress={handleSubmit} disabled={submitting || !termsAccepted}>
        {submitting ? (
          <ActivityIndicator color={theme.colors.text} />
        ) : (
          <Text style={themedStyles.buttonText}>Create Account</Text>
        )}
      </Pressable>
      <Pressable onPress={() => navigation.navigate('SignIn')}>
        <Text style={themedStyles.link}>Have an account? Sign in</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}