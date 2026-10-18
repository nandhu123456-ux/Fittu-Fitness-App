import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { getWaterUnit, getWeightUnit, setWaterUnit, setWeightUnit } from '../services/preferences';
import { useTheme, useThemeStore } from '../theme';
import type { RootTabParamList } from '../types/navigation';

type Navigation = BottomTabNavigationProp<RootTabParamList, 'Profile'>;

export default function PreferencesScreen() {
  const theme = useTheme();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const navigation = useNavigation<Navigation>();
  const [weightUnit, setWeightUnitState] = useState<'kg' | 'lb'>(getWeightUnit());
  const [waterUnit, setWaterUnitState] = useState<'ml' | 'oz'>(getWaterUnit());

  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        screen: { backgroundColor: theme.colors.bg, flex: 1 },
        header: {
          alignItems: 'center',
          flexDirection: 'row',
          paddingHorizontal: 20,
          paddingTop: 20,
        },
        headerTitle: {
          color: theme.colors.text,
          fontSize: 20,
          fontWeight: '600',
          marginLeft: 12,
        },
        section: {
          color: theme.colors.muted,
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 1.4,
          marginTop: 20,
          paddingHorizontal: 20,
        },
        card: {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: 20,
          borderWidth: 1,
          marginHorizontal: 20,
          marginTop: 8,
          padding: 14,
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 8,
        },
        rowText: { color: theme.colors.text, fontSize: 16 },
        checkOn: {
          alignItems: 'center',
          backgroundColor: theme.colors.accent,
          borderRadius: 999,
          height: 22,
          justifyContent: 'center',
          width: 22,
        },
        checkOff: {
          alignItems: 'center',
          borderColor: theme.colors.borderStrong,
          borderRadius: 999,
          borderWidth: 2,
          height: 22,
          justifyContent: 'center',
          width: 22,
        },
        checkMark: { color: theme.colors.accentText, fontSize: 12, fontWeight: '700' },
        subtitle: {
          color: theme.colors.muted,
          fontSize: 13,
          marginTop: 20,
          paddingHorizontal: 20,
        },
        segmented: { flexDirection: 'row', gap: 8 },
        unit: {
          alignItems: 'center',
          borderRadius: 12,
          flex: 1,
          minWidth: 0,
          paddingHorizontal: 14,
          paddingVertical: 8,
        },
        activeUnit: { backgroundColor: theme.colors.accent },
        unitText: { color: theme.colors.muted, fontSize: 16, fontWeight: '700' },
        activeUnitText: { color: theme.colors.bg },
        divider: { backgroundColor: theme.colors.border, height: 1, marginVertical: 10 },
      }),
    [theme]
  );

  return (
    <ScrollView style={themedStyles.screen} contentContainerStyle={styles.content}>
      <View style={themedStyles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons color={theme.colors.text} name="chevron-back" size={24} />
        </Pressable>
        <Text style={themedStyles.headerTitle}>Preferences</Text>
      </View>

      <Text style={themedStyles.section}>APPEARANCE</Text>
      <View style={themedStyles.card}>
        {(['system', 'light', 'dark'] as const).map((value) => (
          <Pressable key={value} onPress={() => setMode(value)} style={styles.optionRow}>
            <Text style={themedStyles.rowText}>{value[0].toUpperCase() + value.slice(1)}</Text>
            <View style={mode === value ? themedStyles.checkOn : themedStyles.checkOff}>
              {mode === value ? <Text style={themedStyles.checkMark}>?</Text> : null}
            </View>
          </Pressable>
        ))}
      </View>

      <Text style={themedStyles.section}>UNITS</Text>
      <View style={themedStyles.card}>
        <View style={styles.field}>
          <Text style={themedStyles.rowText}>Weight unit</Text>
          <View style={themedStyles.segmented}>
            {(['kg', 'lb'] as const).map((value) => (
              <Pressable
                key={value}
                onPress={() => {
                  setWeightUnit(value);
                  setWeightUnitState(value);
                }}
                style={[themedStyles.unit, weightUnit === value && themedStyles.activeUnit]}
              >
                <Text style={[themedStyles.unitText, weightUnit === value && themedStyles.activeUnitText]} numberOfLines={1}>
                  {value.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={themedStyles.divider} />
        <View style={styles.field}>
          <Text style={themedStyles.rowText}>Water unit</Text>
          <View style={themedStyles.segmented}>
            {(['ml', 'oz'] as const).map((value) => (
              <Pressable
                key={value}
                onPress={() => {
                  setWaterUnit(value);
                  setWaterUnitState(value);
                }}
                style={[themedStyles.unit, waterUnit === value && themedStyles.activeUnit]}
              >
                <Text style={[themedStyles.unitText, waterUnit === value && themedStyles.activeUnitText]} numberOfLines={1}>
                  {value.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <Text style={themedStyles.section}>ABOUT</Text>
      <View style={themedStyles.card}>
        <View style={styles.row}>
          <Text style={themedStyles.rowText}>App version</Text>
          <Text style={themedStyles.rowText}>{String(Constants.expoConfig?.version ?? '1.0.0')}</Text>
        </View>
        <View style={themedStyles.divider} />
        <Pressable onPress={() => Linking.openURL('https://example.com/privacy')} style={styles.row}>
          <Text style={themedStyles.rowText}>Privacy Policy</Text>
          <Ionicons color={theme.colors.muted} name="chevron-forward" size={18} />
        </Pressable>
        <View style={themedStyles.divider} />
        <Pressable onPress={() => Linking.openURL('https://example.com/terms')} style={styles.row}>
          <Text style={themedStyles.rowText}>Terms of Service</Text>
          <Ionicons color={theme.colors.muted} name="chevron-forward" size={18} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  optionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  field: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
});
