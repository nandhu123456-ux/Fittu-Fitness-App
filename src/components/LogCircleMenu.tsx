import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef } from 'react';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../theme';
import type { RootTabParamList } from '../types/navigation';

type Navigation = BottomTabNavigationProp<RootTabParamList>;

type LogOption = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: LogRoute;
};

type LogRoute = 'PhotoLog' | 'VoiceLog' | 'Barcode' | 'MenuScan' | 'Log' | 'AddCustomFood';

const OPTIONS: LogOption[] = [
  { icon: 'camera-outline', label: 'Photo', route: 'PhotoLog' },
  { icon: 'mic-outline', label: 'Voice', route: 'VoiceLog' },
  { icon: 'barcode-outline', label: 'Barcode', route: 'Barcode' },
  { icon: 'scan-outline', label: 'Menu scan', route: 'MenuScan' },
  { icon: 'search-outline', label: 'Search', route: 'Log' },
  { icon: 'add-circle-outline', label: 'Custom', route: 'AddCustomFood' },
];

const BUTTON_SIZE = 56;
const RING_RADIUS = 110;

interface LogCircleMenuProps {
  visible: boolean;
  onClose: () => void;
}

export function LogCircleMenu({ visible, onClose }: LogCircleMenuProps) {
  const theme = useTheme();
  const navigation = useNavigation<Navigation>();
  const openRef = useRef(false);

  const scale = useRef(new Animated.Value(visible ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(scale, { toValue: visible ? 1 : 0, duration: 220, useNativeDriver: true }).start();
  }, [scale, visible]);

  const toggle = () => {
    const next = !openRef.current;
    openRef.current = next;
    Animated.timing(scale, { toValue: next ? 1 : 0, duration: 220, useNativeDriver: true }).start();
  };

  const goTo = (route: LogRoute) => {
    Animated.timing(scale, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    onClose();
    navigation.navigate(route, {});
  };

  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        overlay: { backgroundColor: 'rgba(0,0,0,0.7)', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
        fab: {
          alignItems: 'center',
          backgroundColor: theme.colors.accent,
          borderColor: theme.colors.bg,
          borderRadius: BUTTON_SIZE / 2,
          borderWidth: 3,
          height: BUTTON_SIZE,
          justifyContent: 'center',
          width: BUTTON_SIZE,
        },
        ring: {
          alignItems: 'center',
          borderRadius: RING_RADIUS,
          height: RING_RADIUS * 2,
          justifyContent: 'center',
          position: 'absolute',
          top: -RING_RADIUS,
          left: -RING_RADIUS,
          width: RING_RADIUS * 2,
        },
        option: {
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.08)',
          borderColor: 'rgba(255,255,255,0.18)',
          borderRadius: 32,
          height: 64,
          width: 64,
        },
        optionIcon: { color: theme.colors.text, fontSize: 22 },
        optionLabel: {
          color: theme.colors.textSecondary,
          fontSize: 10,
          fontWeight: '600',
          marginTop: 4,
          textAlign: 'center',
          width: 64,
        },
      }),
    [theme]
  );

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={themedStyles.overlay} onPress={onClose} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 130, paddingHorizontal: 20 }}>
        <Animated.View style={{ opacity: scale, transform: [{ scale: scale }] }}>
          <View style={{ position: 'relative' }}>
            <View style={themedStyles.ring}>
              {OPTIONS.map((option, index) => {
                const angle = (index / OPTIONS.length) * Math.PI * 2 - Math.PI / 2;
                const x = Math.round(Math.cos(angle) * RING_RADIUS);
                const y = Math.round(Math.sin(angle) * RING_RADIUS);
                return (
                  <Animated.View
                    key={option.route}
                    style={[
                      themedStyles.option,
                      { top: RING_RADIUS - 32 + y, left: RING_RADIUS - 32 + x, transform: [{ scale: scale }] },
                    ]}
                  >
                    <Pressable
                      accessibilityLabel={option.label}
                      onPress={() => goTo(option.route)}
                    >
                      <Ionicons name={option.icon} size={20} color={theme.colors.text} />
                    </Pressable>
                    <Text style={themedStyles.optionLabel}>{option.label}</Text>
                  </Animated.View>
                );
              })}
            </View>
            <Pressable
              accessibilityLabel="Log meal"
              onPress={toggle}
              style={themedStyles.fab}
            >
              <Ionicons name="add" size={28} color={theme.colors.bg} />
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
