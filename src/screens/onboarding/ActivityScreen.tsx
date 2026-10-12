import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../constants/colors';
import { useOnboardingStore } from '../../store/onboardingStore';
import type { OnboardingStackParamList } from '../../types/navigation';
import type { ActivityLevel } from '../../types/user';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Activity'>;

const OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary (little exercise)' },
  { value: 'light', label: 'Light (1–3 days/week)' },
  { value: 'moderate', label: 'Moderate (3–5 days/week)' },
  { value: 'active', label: 'Active (6–7 days/week)' },
  { value: 'very_active', label: 'Very active (physical job)' },
];

export default function ActivityScreen({ navigation }: Props) {
  const form = useOnboardingStore((s) => s.form);
  const setForm = useOnboardingStore((s) => s.setForm);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = () => {
    if (form.activityLevel === null) {
      setError('Please select your activity level.');
      return;
    }
    setError(null);
    navigation.navigate('Goal');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>How active are you?</Text>
      {OPTIONS.map((option) => (
        <Pressable
          key={option.value}
          style={[styles.option, form.activityLevel === option.value && styles.optionSelected]}
          onPress={() => setForm({ activityLevel: option.value })}
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
    gap: 12,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  option: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#1E1E1E',
    paddingHorizontal: 16,
  },
  optionSelected: {
    borderColor: colors.primary,
  },
  optionText: {
    color: colors.text,
    fontSize: 15,
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
