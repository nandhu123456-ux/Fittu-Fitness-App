import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../constants/colors';
import { useOnboardingStore } from '../../store/onboardingStore';
import type { Gender } from '../../types/user';
import type { OnboardingStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Gender'>;

const OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

export default function GenderScreen({ navigation }: Props) {
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

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>What's your gender?</Text>
      {OPTIONS.map((option) => (
        <Pressable
          key={option.value}
          style={[styles.option, form.gender === option.value && styles.optionSelected]}
          onPress={() => setForm({ gender: option.value })}
        >
          <Text style={styles.optionText}>{option.label}</Text>
        </Pressable>
      ))}
      {error !== null && <Text style={styles.error}>{error}</Text>}
      <Pressable style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 14,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  option: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E1E1E',
  },
  optionSelected: {
    borderColor: colors.primary,
  },
  optionText: {
    color: colors.text,
    fontSize: 16,
  },
  error: {
    color: '#FF6B6B',
    fontSize: 14,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
