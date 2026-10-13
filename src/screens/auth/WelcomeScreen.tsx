import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme';
import type { AuthStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const themedStyles = useMemo(() => StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg, paddingHorizontal: 32, gap: 16 },
    title: { fontSize: 32, fontWeight: '700', color: theme.colors.text, marginBottom: 24 },
    button: { width: '100%', backgroundColor: theme.colors.accentAlt, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
    buttonText: { color: theme.colors.accentText, fontSize: 16, fontWeight: '600' },
  }), [theme]);
  return (
    <View style={themedStyles.container}>
      <Text style={themedStyles.title}>Be_fit</Text>
      <Pressable style={themedStyles.button} onPress={() => navigation.navigate('SignUp')}>
        <Text style={themedStyles.buttonText}>Sign Up</Text>
      </Pressable>
      <Pressable style={themedStyles.button} onPress={() => navigation.navigate('SignIn')}>
        <Text style={themedStyles.buttonText}>Sign In</Text>
      </Pressable>
    </View>
  );
}

