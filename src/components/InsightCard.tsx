import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';

const insights = ['Small steps. Big change. Keep logging.', 'Consistency beats perfection every time.', 'Your future self is watching. Make them proud.', 'Protein today = strong tomorrow.', 'One meal at a time.'];

export function InsightCard() {
  const theme = useTheme();
  const message = insights[new Date().getDay() % insights.length];
  const themedStyles = useMemo(() => StyleSheet.create({
    card: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: 'rgba(46,229,157,0.15)', borderRadius: 20, borderWidth: 1, flexDirection: 'row', padding: 20 },
    text: { color: theme.colors.text, fontSize: 14, fontWeight: '500', lineHeight: 20 },
    tag: { alignSelf: 'flex-end', color: theme.colors.muted, fontSize: 10, marginTop: 8 },
  }), [theme]);
  return <View style={themedStyles.card}><Ionicons name="sparkles" size={22} color={theme.colors.accent} /><View style={styles.copy}><Text style={themedStyles.text}>{message}</Text><Text style={themedStyles.tag}>Powered by AI</Text></View></View>;
}

const styles = StyleSheet.create({
  copy: { flex: 1, marginLeft: 12 },
});
