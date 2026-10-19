import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface Props {
  bmr: number;
}

export function RestingBurnCard({ bmr }: Props) {
  const theme = useTheme();

  if (bmr <= 0) return null; // Don't show if profile is incomplete

  const themed = useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.05)',
      // Subtle glow effect
      shadowColor: '#48DBFB',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(72, 219, 251, 0.1)', // Cyan tint
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    textCol: {
      flex: 1,
    },
    label: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 2,
    },
    subtitle: {
      color: theme.colors.muted,
      fontSize: 11,
      lineHeight: 16,
    },
    valueContainer: {
      alignItems: 'flex-end',
    },
    value: {
      color: '#48DBFB', // Cyan color matching the icon
      fontSize: 22,
      fontWeight: '800',
    },
    unit: {
      color: 'rgba(72, 219, 251, 0.5)',
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
    }
  }), [theme]);

  return (
    <View style={themed.card}>
      <View style={themed.iconWrap}>
        <Ionicons name="leaf" size={22} color="#48DBFB" />
      </View>
      <View style={themed.textCol}>
        <Text style={themed.label}>Resting Burn</Text>
        <Text style={themed.subtitle}>Calories your body burns just by existing.</Text>
      </View>
      <View style={themed.valueContainer}>
        <Text style={themed.value}>{bmr}</Text>
        <Text style={themed.unit}>KCAL/DAY</Text>
      </View>
    </View>
  );
}