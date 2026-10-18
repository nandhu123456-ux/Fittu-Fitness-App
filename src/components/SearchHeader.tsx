import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';

export interface SearchHeaderAction {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** When true the AI estimate input row is shown under the search bar. */
  aiOpen: boolean;
  onToggleAi: () => void;
  aiQuery: string;
  onAiQueryChange: (text: string) => void;
  onRunEstimate: () => void;
  aiLoading: boolean;
  /** Quick-capture buttons (Voice / Photo / Barcode / Menu) rendered in a row. */
  actions: SearchHeaderAction[];
}

/**
 * Always-visible search bar with an "AI" pill that toggles the AI estimate input,
 * plus a row of quick-capture icon buttons underneath.
 */
export function SearchHeader({
  value,
  onChangeText,
  placeholder = 'Search food (e.g. chicken, rice, egg)',
  aiOpen,
  onToggleAi,
  aiQuery,
  onAiQueryChange,
  onRunEstimate,
  aiLoading,
  actions,
}: Props) {
  const theme = useTheme();

  const themedStyles = useMemo(() => StyleSheet.create({
    searchBar: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.lg, borderWidth: 1, flexDirection: 'row', gap: 8, paddingHorizontal: 14 },
    input: { color: theme.colors.text, flex: 1, fontSize: 15, paddingVertical: 14 },
    pill: { backgroundColor: theme.colors.success, borderColor: 'rgba(255,255,255,0.6)', borderRadius: theme.radius.pill, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
    pillText: { color: '#000000', fontSize: 12, fontWeight: '700' },
    aiRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    aiInput: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md, borderWidth: 1, color: '#000000', flex: 1, fontSize: 14, paddingHorizontal: 12, paddingVertical: 10 },
    estimateBtn: { alignItems: 'center', backgroundColor: theme.colors.carbs + '33', borderRadius: theme.radius.md, justifyContent: 'center', paddingHorizontal: 16 },
    iconRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    iconBtn: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md, borderWidth: 1, flex: 1, gap: 4, paddingVertical: 10 },
    estimateText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  }), [theme]);

  return (
    <View>
      <View style={themedStyles.searchBar}>
        <Ionicons color={theme.colors.muted} name="search" size={20} />
        <TextInput
          autoCapitalize="none"
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.muted}
          style={themedStyles.input}
          value={value}
        />
        <Pressable hitSlop={8} onPress={onToggleAi} style={themedStyles.pill}>
          <Text style={themedStyles.pillText}>AI</Text>
        </Pressable>
      </View>

      {aiOpen ? (
        <View style={themedStyles.aiRow}>
          <TextInput
            autoFocus
            onChangeText={onAiQueryChange}
            onSubmitEditing={onRunEstimate}
            placeholder="Type any food name…"
            placeholderTextColor={theme.colors.muted}
            returnKeyType="search"
            style={themedStyles.aiInput}
            value={aiQuery}
          />
          <Pressable disabled={aiLoading} onPress={onRunEstimate} style={themedStyles.estimateBtn}>
            {aiLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={themedStyles.estimateText}>Estimate</Text>}
          </Pressable>
        </View>
      ) : null}

      <View style={themedStyles.iconRow}>
        {actions.map((action) => (
          <Pressable key={action.label} onPress={action.onPress} style={themedStyles.iconBtn}>
            <Ionicons color={theme.colors.accent} name={action.icon} size={20} />
            <Text style={themedStyles.iconLabel}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
