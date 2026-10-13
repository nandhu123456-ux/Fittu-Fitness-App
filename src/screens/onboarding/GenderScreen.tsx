import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useOnboardingStore } from '../../store/onboardingStore';
import { useTheme } from '../../theme';
import type { Gender } from '../../types/user';
import type { OnboardingStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Gender'>;

const OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

export default function GenderScreen({ navigation }: Props) {
  const theme = useTheme();
  const form = useOnboardingStore((s) => s.form);
  const setForm = useOnboardingStore((s) => s.setForm);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = () => {
    if (form.gender === null) {
      setError('Please select an option.');
      return;
    }
    setError(null);
    navigation.navigate('BodyStats');
  };

  const themedStyles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center', paddingHorizontal: 32, gap: 14 },
    heading: { fontSize: 22, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },
    option: { backgroundColor: theme.colors.surface, borderRadius: 8, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.surface },
    optionSelected: { borderColor: theme.colors.accent },
    optionText: { color: theme.colors.text, fontSize: 16 },
    error: { color: theme.colors.danger, fontSize: 14 },
    button: { backgroundColor: theme.colors.accentAlt, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    buttonText: { color: theme.colors.accentText, fontSize: 16, fontWeight: '600' },
  }), [theme]);
  return (
    <View style={themedStyles.container}>
      <Text style={themedStyles.heading}>What's your gender?</Text>
      {OPTIONS.map((option) => (
        <Pressable
          key={option.value}
          style={[themedStyles.option, form.gender === option.value && themedStyles.optionSelected]}
          onPress={() => setForm({ gender: option.value })}
        >
          <Text style={themedStyles.optionText}>{option.label}</Text>
        </Pressable>
      ))}
      {error !== null && <Text style={themedStyles.error}>{error}</Text>}
      <Pressable style={themedStyles.button} onPress={handleContinue}>
        <Text style={themedStyles.buttonText}>Continue</Text>
      </Pressable>
    </View>
  );
}
