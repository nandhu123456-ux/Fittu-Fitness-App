import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { useOnboardingStore } from '../../store/onboardingStore';
import { useTheme } from '../../theme';
import type { OnboardingStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'BodyStats'>;

export default function BodyStatsScreen({ navigation }: Props) {
  const theme = useTheme();
  const form = useOnboardingStore((s) => s.form);
  const setForm = useOnboardingStore((s) => s.setForm);
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleContinue = () => {
    if (!age) {
      setError('Please enter your age.');
      return;
    }
    if (!height) {
      setError('Please enter your height.');
      return;
    }
    if (!weight) {
      setError('Please enter your weight.');
      return;
    }
    const ageNum = Number(age);
    const heightNum = Number(height);
    const weightNum = Number(weight);
    if (!Number.isInteger(ageNum) || ageNum < 13 || ageNum > 100) {
      setError('Age must be a whole number between 13 and 100.');
      return;
    }
    if (!Number.isFinite(heightNum) || heightNum < 100 || heightNum > 250) {
      setError('Height must be between 100 and 250 cm.');
      return;
    }
    if (!Number.isFinite(weightNum) || weightNum < 25 || weightNum > 300) {
      setError('Weight must be between 25 and 300 kg.');
      return;
    }
    setError(null);
    setForm({ age: ageNum, heightCm: heightNum, weightKg: weightNum });
    navigation.navigate('Activity');
  };

  const themedStyles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center', paddingHorizontal: 32, gap: 14 },
    heading: { fontSize: 22, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },
    input: { backgroundColor: theme.colors.surfaceHi, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, color: theme.colors.text, fontSize: 16 },
    error: { color: theme.colors.danger, fontSize: 14 },
    button: { backgroundColor: theme.colors.accentAlt, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    buttonText: { color: theme.colors.accentText, fontSize: 16, fontWeight: '600' },
  }), [theme]);
  return (
    <KeyboardAvoidingView style={themedStyles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Text style={themedStyles.heading}>Your body stats</Text>
      <TextInput
        style={themedStyles.input}
        placeholder="Age (13–100)"
        placeholderTextColor={theme.colors.muted}
        keyboardType="numeric"
        value={age}
        onChangeText={setAge}
      />
      <TextInput
        style={themedStyles.input}
        placeholder="Height in cm (100–250)"
        placeholderTextColor={theme.colors.muted}
        keyboardType="numeric"
        value={height}
        onChangeText={setHeight}
      />
      <TextInput
        style={themedStyles.input}
        placeholder="Weight in kg (25–300)"
        placeholderTextColor={theme.colors.muted}
        keyboardType="numeric"
        value={weight}
        onChangeText={setWeight}
      />
      {error !== null && <Text style={themedStyles.error}>{error}</Text>}
      <Pressable style={themedStyles.button} onPress={handleContinue}>
        <Text style={themedStyles.buttonText}>Continue</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

