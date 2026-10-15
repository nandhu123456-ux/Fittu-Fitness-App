import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { useTheme } from '../theme';
import type { RootTabParamList } from '../types/navigation';

interface LogMenuModalProps {
  visible: boolean;
  onClose: () => void;
}

type Navigation = BottomTabNavigationProp<RootTabParamList>;
type QuickRoute = 'PhotoLog' | 'VoiceLog' | 'Barcode' | 'MenuScan';

const OPTIONS: { icon: keyof typeof Ionicons.glyphMap; label: string; route: QuickRoute }[] = [
  { icon: 'camera-outline', label: 'Photo', route: 'PhotoLog' },
  { icon: 'mic-outline', label: 'Voice', route: 'VoiceLog' },
  { icon: 'barcode-outline', label: 'Barcode', route: 'Barcode' },
  { icon: 'scan-outline', label: 'Menu scan', route: 'MenuScan' },
];

export function LogMenuModal({ visible, onClose }: LogMenuModalProps) {
  const theme = useTheme();
  const navigation = useNavigation<Navigation>();

  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          backgroundColor: theme.colors.overlay,
          flex: 1,
          justifyContent: 'flex-end',
        },
        sheet: {
          backgroundColor: theme.colors.surface,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingBottom: 28,
          padding: 16,
        },
        title: {
          color: theme.colors.muted,
          fontSize: 11,
          letterSpacing: 1.4,
          marginBottom: 8,
          marginLeft: 4,
          textTransform: 'uppercase',
        },
        row: {
          alignItems: 'center',
          borderRadius: 12,
          flexDirection: 'row',
          gap: 14,
          height: 52,
          paddingHorizontal: 8,
        },
        rowPressed: {
          backgroundColor: theme.colors.surfaceHi,
        },
        rowLabel: {
          color: theme.colors.text,
          fontSize: 15,
          fontWeight: '600',
        },
      }),
    [theme],
  );

  const goTo = (route: QuickRoute) => {
    onClose();
    navigation.navigate(route, {});
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={themedStyles.overlay} onPress={onClose}>
        <Pressable style={themedStyles.sheet} onPress={(event) => event.stopPropagation()}>
          <Text style={themedStyles.title}>Quick log</Text>
          {OPTIONS.map((option) => (
            <Pressable
              key={option.route}
              onPress={() => goTo(option.route)}
              style={({ pressed }) => [
                themedStyles.row,
                pressed ? themedStyles.rowPressed : undefined,
              ]}
            >
              <Ionicons name={option.icon} size={22} color={theme.colors.accent} />
              <Text style={themedStyles.rowLabel}>{option.label}</Text>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
