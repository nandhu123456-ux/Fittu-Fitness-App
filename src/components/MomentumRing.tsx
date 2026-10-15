import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useEffect, useMemo, useRef } from 'react';

import { useTheme } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const size = 240;
const stroke = 16;
const radius = (size - stroke) / 2;
const circumference = Math.PI * 2 * radius;

interface Props {
  /** 0–100 — how far the ring fills. */
  score: number;
  /** Small uppercase label above the big number, e.g. "Calories". */
  title: string;
  /** Big centred value, e.g. "1,850". */
  headline: string;
  /** Muted line below the headline, e.g. "of 2,200 kcal". */
  caption: string;
}

export function MomentumRing({ score, title, headline, caption }: Props) {
  const theme = useTheme();
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, { toValue: score, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [progress, score]);
  const dashOffset = progress.interpolate({ inputRange: [0, 100], outputRange: [circumference, 0] });
  const themedStyles = useMemo(() => StyleSheet.create({
    title: { color: theme.colors.muted, fontSize: 11, letterSpacing: 2 },
    headline: { color: theme.colors.text, fontSize: 44, fontWeight: '700', letterSpacing: -1 },
    caption: { color: theme.colors.muted, fontSize: 13, fontWeight: '600' },
  }), [theme]);
  const headlineColor = score < 20 ? theme.colors.warn : theme.colors.accent;
  return <View style={styles.wrap}>
    <Svg width={size} height={size}>
      <Defs><LinearGradient id="momentum" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={theme.colors.accentAlt} /><Stop offset="1" stopColor={theme.colors.accent} /></LinearGradient></Defs>
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke={theme.colors.accent} strokeOpacity={0.12} strokeWidth={32} fill="none" />
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke={theme.colors.border} strokeWidth={stroke} fill="none" />
      <AnimatedCircle cx={size / 2} cy={size / 2} r={radius} stroke="url(#momentum)" strokeWidth={stroke} strokeLinecap="round" fill="none" strokeDasharray={circumference} strokeDashoffset={dashOffset} />
    </Svg>
    <View style={styles.center}><Text style={themedStyles.title}>{title.toUpperCase()}</Text><Text style={[themedStyles.headline, { color: headlineColor }]}>{headline}</Text><Text style={themedStyles.caption}>{caption}</Text></View>
  </View>;
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center' },
});
