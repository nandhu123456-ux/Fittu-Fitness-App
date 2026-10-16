import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    flex: { backgroundColor: theme.colors.bg, flex: 1 },
    glow: { position: 'absolute', top: -150, alignSelf: 'center', width: 400, height: 400, borderRadius: 200, backgroundColor: theme.colors.accent, opacity: 0.08 },
    header: { paddingHorizontal: 20, marginTop: 12 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    back: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
    progress: { flexDirection: 'row', gap: 4 },
    segment: { flex: 1, height: 3, borderRadius: 2, backgroundColor: theme.colors.border },
    title: { color: theme.colors.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
    subtitle: { color: theme.colors.muted, fontSize: 15, lineHeight: 22, marginTop: 8 },
    card: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 20, borderWidth: 1, marginTop: 32, shadowColor: '#000', shadowOpacity: 0.25, shadowOffset: { width: 0, height: 8 }, shadowRadius: 16, elevation: 4 },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    rowLast: { borderBottomWidth: 0 },
    iconCircle: { alignItems: 'center', backgroundColor: theme.colors.surfaceHi, borderRadius: 14, height: 36, justifyContent: 'center', width: 36 },
    rowLabel: { color: theme.colors.text, fontSize: 15, flex: 1, marginLeft: 12 },
    input: { color: theme.colors.text, fontSize: 16, textAlign: 'right', width: 60 },
    error: { color: theme.colors.danger, fontSize: 14, marginTop: 16, textAlign: 'center' },
    footer: { marginBottom: 40, paddingHorizontal: 20 },
    cta: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 16, height: 56, justifyContent: 'center', flexDirection: 'row', gap: 8 },
    ctaText: { color: theme.colors.bg, fontSize: 16, fontWeight: '700' },
    ctaArrow: { color: theme.colors.bg, fontSize: 16, fontWeight: '700' },
  }), [theme]);

  const goBack = (): void => { navigation.goBack(); };
  const filled = 2;
  const total = 5;

  return (
    <SafeAreaView style={themedStyles.flex}>
      <View style={themedStyles.glow} />
      <View style={themedStyles.header}>
        <View style={themedStyles.topRow}>
          <Pressable onPress={goBack} style={themedStyles.back} hitSlop={12}>
            <Ionicons color={theme.colors.text} name="chevron-back" size={24} />
          </Pressable>
          <View style={themedStyles.progress}>
            {Array.from({ length: total }).map((_, i) => (
              <View key={i} style={[themedStyles.segment, i < filled && { backgroundColor: theme.colors.accent }]} />
            ))}
          </View>
        </View>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0} style={themedStyles.flex}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
        <Text style={themedStyles.title}>Tell us about yourself</Text>
        <Text style={themedStyles.subtitle}>We use this to compute your daily calorie needs.</Text>
        <View style={themedStyles.card}>
          <View style={themedStyles.row}>
            <View style={themedStyles.iconCircle}><Ionicons name="calendar-outline" size={18} color={theme.colors.muted} /></View>
            <Text style={themedStyles.rowLabel}>Age</Text>
            <TextInput style={themedStyles.input} placeholder="18" placeholderTextColor={theme.colors.muted} keyboardType="numeric" value={age} onChangeText={setAge} />
          </View>
          <View style={[themedStyles.row, themedStyles.rowLast]}>
            <View style={themedStyles.iconCircle}><Ionicons name="resize-outline" size={18} color={theme.colors.muted} /></View>
            <Text style={themedStyles.rowLabel}>Height (cm)</Text>
            <TextInput style={themedStyles.input} placeholder="170" placeholderTextColor={theme.colors.muted} keyboardType="numeric" value={height} onChangeText={setHeight} />
          </View>
          <View style={[themedStyles.row, themedStyles.rowLast]}>
            <View style={themedStyles.iconCircle}><Ionicons name="scale-outline" size={18} color={theme.colors.muted} /></View>
            <Text style={themedStyles.rowLabel}>Weight (kg)</Text>
            <TextInput style={themedStyles.input} placeholder="70" placeholderTextColor={theme.colors.muted} keyboardType="numeric" value={weight} onChangeText={setWeight} />
          </View>
        </View>
        {error !== null && <Text style={themedStyles.error}>{error}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={themedStyles.footer}>
        <Pressable onPress={handleContinue} style={themedStyles.cta}>
          <Text style={themedStyles.ctaText}>Continue</Text>
          <Text style={themedStyles.ctaArrow}>→</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 100, paddingHorizontal: 20, paddingTop: 40 },
});
