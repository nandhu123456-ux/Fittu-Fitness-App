import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';

interface QuickLogItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

interface QuickLogRowProps {
  items: QuickLogItem[];
}

export function QuickLogRow({ items }: QuickLogRowProps) {
  const theme = useTheme();

  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        title: {
          color: theme.colors.muted,
          fontSize: 11,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          marginBottom: 10,
        },
        row: {
          flexDirection: 'row',
          gap: 10,
        },
        btn: {
          alignItems: 'center',
          backgroundColor: theme.colors.surface,
          borderRadius: 14,
          justifyContent: 'center',
          minHeight: 72,
          padding: 12,
        },
        label: {
          color: theme.colors.muted,
          fontSize: 10,
        },
      }),
    [theme],
  );

  return (
    <View>
      <Text style={themedStyles.title}>QUICK LOG</Text>
      <View style={themedStyles.row}>
        {items.map((item) => (
          <Pressable
            key={item.label}
            onPress={item.onPress}
            style={({ pressed }) => [
              themedStyles.btn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons
              name={item.icon}
              size={22}
              color={theme.colors.accent}
              style={styles.iconSpacing}
            />
            <Text style={themedStyles.label}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  iconSpacing: {
    marginBottom: 6,
  },
});
