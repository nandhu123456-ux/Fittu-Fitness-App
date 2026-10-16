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
      <Pressable style={themedStyles.button} onPress={handleSubmit} disabled={submitting}>
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

