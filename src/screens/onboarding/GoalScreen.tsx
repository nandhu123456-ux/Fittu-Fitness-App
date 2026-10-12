import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '../../constants/colors';
import { useOnboardingStore } from '../../store/onboardingStore';
import type { OnboardingStackParamList } from '../../types/navigation';
import type { GoalType } from '../../types/user';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Goal'>;

const OPTIONS: { value: GoalType; label: string }[] = [
  { value: 'lose', label: 'Lose weight' },
  { value: 'maintain', label: 'Maintain weight' },
  { value: 'gain', label: 'Gain weight' },
];

export default function GoalScreen({ navigation }: Props) {
  const form = useOnboardingStore((s) => s.form);
  const setForm = useOnboardingStore((s) => s.setForm);
  const [target, setTarget] = useState('');
  const [rate, setRate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleContinue = () => {
    if (form.goalType === null) {
      setError('Please select your goal.');
      return;
    }
    if (!target) {
      setError('Please enter your target weight.');
      return;
    }
    if (!rate) {
      setError('Please enter your weekly rate.');
      return;
    }
    const targetNum = Number(target);
    const rateNum = Number(rate);
    if (form.goalType !== 'maintain' && (!Number.isFinite(targetNum) || targetNum < 25 || targetNum > 300)) {
      setError('Target weight must be between 25 and 300 kg.');
      return;
    }
    if (!Number.isFinite(rateNum) || rateNum < 0.25 || rateNum > 1) {
      setError('Weekly rate must be between 0.25 and 1.0 kg.');
      return;
    }
    setError(null);
    setForm({
      targetWeightKg: form.goalType === 'maintain' ? form.weightKg : targetNum,
      weeklyRateKg: rateNum,
    });
    navigation.navigate('Summary');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>What's your goal?</Text>
      {OPTIONS.map((option) => (
        <Pressable
          key={option.value}
          style={[styles.option, form.goalType === option.value && styles.optionSelected]}
          onPress={() => setForm({ goalType: option.value })}
        >
          <Text style={styles.optionText}>{option.label}</Text>
        </Pressable>
      ))}
      {form.goalType !== null && form.goalType !== 'maintain' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Target weight (kg)"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            value={target}
            onChangeText={setTarget}
          />
          <TextInput
            style={styles.input}
            placeholder="Weekly rate (kg, 0.25–1.0)"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            value={rate}
            onChangeText={setRate}
          />
        </>
      )}
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
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#1E1E1E',
  },
  optionSelected: {
    borderColor: colors.primary,
  },
  optionText: {
    color: colors.text,
    fontSize: 15,
  },
  input: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
