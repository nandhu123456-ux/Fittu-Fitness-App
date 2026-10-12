import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../constants/colors';

const insights = ['Small steps. Big change. Keep logging.', 'Consistency beats perfection every time.', 'Your future self is watching. Make them proud.', 'Protein today = strong tomorrow.', 'One meal at a time.'];

export function InsightCard() {
  const message = insights[new Date().getDay() % insights.length];
  return <View style={styles.card}><Ionicons name="sparkles" size={22} color={colors.accent} /><View style={styles.copy}><Text style={styles.text}>{message}</Text><Text style={styles.tag}>Powered by AI</Text></View></View>;
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', backgroundColor: colors.surface, borderColor: 'rgba(46,229,157,0.15)', borderRadius: 20, borderWidth: 1, flexDirection: 'row', padding: 20 },
  copy: { flex: 1, marginLeft: 12 }, text: { color: colors.text, fontSize: 14, fontWeight: '500', lineHeight: 20 }, tag: { alignSelf: 'flex-end', color: colors.muted, fontSize: 10, marginTop: 8 },
});
