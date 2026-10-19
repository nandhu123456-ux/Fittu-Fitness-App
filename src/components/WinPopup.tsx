import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface WinPopupProps {
  visible: boolean;
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onClose: () => void;
}

export function WinPopup({
  visible,
  title,
  message,
  icon = 'trophy',
  onClose,
}: WinPopupProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  const [rendered, setRendered] = useState(visible);
  
  // Using standard React Native Animated for 100% stability
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      
      // Pop in animation
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true })
      ]).start();

      // Auto close after 2.5 seconds
      timeoutRef.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
          onClose();
        });
      }, 2500);
      
    } else if (rendered) {
      // Fade out if closed externally
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setRendered(false);
      });
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [visible, rendered, onClose, opacity, scale]);

  if (!rendered) return null;

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: colors.overlay || 'rgba(0,0,0,0.6)', opacity }]}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface || '#1E1E1E',
            borderColor: colors.accent || '#4CAF50',
            width: width * 0.8,
            transform: [{ scale }]
          },
        ]}
      >
        <View style={[styles.iconCircle, { backgroundColor: colors.accentGlow || 'rgba(76, 175, 80, 0.2)' }]}>
          <Ionicons name={icon} size={36} color={colors.accent || '#4CAF50'} />
        </View>
        <Text style={[styles.title, { color: colors.text || '#FFF' }]}>{title}</Text>
        <Text style={[styles.message, { color: colors.muted || '#AAA' }]}>{message}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  card: {
    borderRadius: 24,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});