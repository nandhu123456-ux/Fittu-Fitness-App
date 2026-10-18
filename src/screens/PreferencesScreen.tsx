import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { getWaterUnit, getWeightUnit, setWaterUnit, setWeightUnit } from '../services/preferences';
import { useTheme, useThemeStore } from '../theme';
import type { RootTabParamList } from '../types/navigation';

type Navigation = BottomTabNavigationProp<RootTabParamList, 'Profile'>;

// App currently only supports dark. When light/system are added later,
// just add them back to this array and the UI keeps working.
const APPEARANCE_OPTIONS = [{ value: 'dark' as const, label: 'Dark' }];

export default function PreferencesScreen() {
  const theme = useTheme();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();
  const [weightUnit, setWeightUnitState] = useState<'kg' | 'lb'>(getWeightUnit());
  const [waterUnit, setWaterUnitState] = useState<'ml' | 'oz'>(getWaterUnit());

  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        screen: { backgroundColor: theme.colors.bg, flex: 1 },
        content: { paddingBottom: 40 + insets.bottom },

        header: {
          paddingHorizontal: 20,
          paddingTop: insets.top + 16,
          paddingBottom: 4,
        },
        headerTitle: {
          color: theme.colors.text,
          fontSize: 28,
          fontWeight: '700',
        },

        section: {
          color: theme.colors.muted,
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 1.4,
          marginTop: 24,
          marginBottom: 8,
          paddingHorizontal: 20,
        },
        card: {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: 20,
          borderWidth: 1,
          marginHorizontal: 20,
          padding: 14,
        },

        optionRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 10,
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 10,
        },
        field: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 4,
        },

        rowText: { color: theme.colors.text, fontSize: 16 },

        checkOn: {
          alignItems: 'center',
          backgroundColor: theme.colors.accent,
          borderRadius: 999,
          height: 24,
          justifyContent: 'center',
          width: 24,
        },
        checkOff: {
          alignItems: 'center',
          borderColor: theme.colors.borderStrong,
          borderRadius: 999,
          borderWidth: 2,
          height: 24,
          justifyContent: 'center',
          width: 24,
        },
        checkMark: { color: theme.colors.accentText, fontSize: 14, fontWeight: '700' },

        segmented: { flexDirection: 'row', flex: 1, gap: 8, justifyContent: 'flex-end', marginLeft: 12 },
        unit: {
          alignItems: 'center',
          borderRadius: 12,
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: 8,
          paddingVertical: 8,
        },
        activeUnit: { backgroundColor: theme.colors.accent },
        unitText: { color: theme.colors.muted, fontSize: 16, fontWeight: '700' },
        activeUnitText: { color: theme.colors.bg },

        divider: { backgroundColor: theme.colors.border, height: 1, marginVertical: 10 },
      }),
    [theme, insets.top, insets.bottom]
  );

  return (
    <ScrollView style={themedStyles.screen} contentContainerStyle={themedStyles.content}>
      <View style={themedStyles.header}>
        <Text style={themedStyles.headerTitle}>Preferences</Text>
      </View>

      <Text style={themedStyles.section}>APPEARANCE</Text>
      <View style={themedStyles.card}>
        {APPEARANCE_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => setMode(opt.value)}
            style={themedStyles.optionRow}
          >
            <Text style={themedStyles.rowText}>{opt.label}</Text>
            <View style={mode === opt.value ? themedStyles.checkOn : themedStyles.checkOff}>
              {mode === opt.value ? <Text style={themedStyles.checkMark}>✓</Text> : null}
            </View>
          </Pressable>
        ))}
      </View>

      <Text style={themedStyles.section}>UNITS</Text>
      <View style={themedStyles.card}>
        <View style={themedStyles.field}>
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
                <Text
                  style={[themedStyles.unitText, weightUnit === value && themedStyles.activeUnitText]}
                  numberOfLines={1}
                >
                  {value.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={themedStyles.divider} />

        <View style={themedStyles.field}>
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
                <Text
                  style={[themedStyles.unitText, waterUnit === value && themedStyles.activeUnitText]}
                  numberOfLines={1}
                >
                  {value.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <Text style={themedStyles.section}>ABOUT</Text>
      <View style={themedStyles.card}>
        <View style={themedStyles.row}>
          <Text style={themedStyles.rowText}>App version</Text>
          <Text style={[themedStyles.rowText, { color: theme.colors.muted }]}>
            {String(Constants.expoConfig?.version ?? '1.0.0')}
          </Text>
        </View>

        <View style={themedStyles.divider} />

        <Pressable onPress={() => navigation.navigate('PrivacyPolicy')} style={themedStyles.row}>
          <Text style={themedStyles.rowText}>Privacy Policy</Text>
          <Ionicons color={theme.colors.muted} name="chevron-forward" size={18} />
        </Pressable>

        <View style={themedStyles.divider} />

        <Pressable onPress={() => navigation.navigate('TermsOfService')} style={themedStyles.row}>
          <Text style={themedStyles.rowText}>Terms of Service</Text>
          <Ionicons color={theme.colors.muted} name="chevron-forward" size={18} />
        </Pressable>
      </View>
    </ScrollView>
  );
}