import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { signIn } from '../../services/auth';
import { useTheme } from '../../theme';
import type { AuthStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

export default function SignInScreen({ navigation }: Props) {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      // RootNavigator switches to Main automatically via onAuthChange.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed.');
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
      <Text style={themedStyles.heading}>Sign In</Text>
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
        placeholder="Password"
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
          <Text style={themedStyles.buttonText}>Sign In</Text>
        )}
      </Pressable>
      <Pressable onPress={() => navigation.navigate('SignUp')}>
        <Text style={themedStyles.link}>No account? Sign up</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

