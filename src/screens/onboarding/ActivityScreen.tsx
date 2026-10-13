import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useOnboardingStore } from '../../store/onboardingStore';
import { useTheme } from '../../theme';
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
  const theme = useTheme();
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

  const themedStyles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
    heading: { fontSize: 22, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
    option: { backgroundColor: theme.colors.surface, borderRadius: 8, paddingVertical: 14, alignItems: 'flex-start', borderWidth: 1, borderColor: theme.colors.surface, paddingHorizontal: 16 },
    optionSelected: { borderColor: theme.colors.accent },
    optionText: { color: theme.colors.text, fontSize: 15 },
    error: { color: theme.colors.danger, fontSize: 14 },
    button: { backgroundColor: theme.colors.accentAlt, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    buttonText: { color: theme.colors.accentText, fontSize: 16, fontWeight: '600' },
  }), [theme]);
  return (
    <View style={themedStyles.container}>
      <Text style={themedStyles.heading}>How active are you?</Text>
      {OPTIONS.map((option) => (
        <Pressable
          key={option.value}
          style={[themedStyles.option, form.activityLevel === option.value && themedStyles.optionSelected]}
          onPress={() => setForm({ activityLevel: option.value })}
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

