import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text } from 'react-native';

const LOGO_SIZE = 180;

interface Props { onFinish: () => void; }

export default function AnimatedSplash({ onFinish }: Props) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const wordOpacity = useRef(new Animated.Value(0)).current;
  const wordY = useRef(new Animated.Value(16)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(logoScale, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(wordOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(wordY, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.timing(tagOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(600),
      Animated.timing(overlayOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => onFinish());
  }, [logoOpacity, logoScale, wordOpacity, wordY, tagOpacity, overlayOpacity, onFinish]);

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, styles.overlay, { opacity: overlayOpacity }]}>
      <Animated.Image
source={require('../../assets/icon.png')}        style={[styles.logo, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
        resizeMode="contain"
      />
      <Animated.Text style={[styles.word, { opacity: wordOpacity, transform: [{ translateY: wordY }] }]}>
        Fittu
      </Animated.Text>
      <Animated.Text style={[styles.tag, { opacity: tagOpacity }]}>
        Eat better. Live stronger.
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { alignItems: 'center', backgroundColor: '#0F0D0C', justifyContent: 'center', zIndex: 9999 },
  logo: { height: LOGO_SIZE, width: LOGO_SIZE, borderRadius: 24 },
  word: { color: '#F5F5F7', fontSize: 32, fontWeight: '700', letterSpacing: -0.5, marginTop: 24 },
  tag: { color: '#8A8A94', fontSize: 14, marginTop: 6 },
});
