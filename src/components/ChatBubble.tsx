import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { CoachMessage } from '../services/coachChat';
import { useTheme } from '../theme';

interface Props {
  message: CoachMessage;
}

const formatTime = (ts: CoachMessage['ts']): string => {
  if (ts === null || ts === undefined) return '';
  const date = ts.toDate();
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

export function ChatBubble({ message }: Props) {
  const theme = useTheme();
  const isUser = message.role === 'user';
  const themedStyles = useMemo(() => StyleSheet.create({
    bubbleUser: { backgroundColor: theme.colors.protein + '33' },
    bubbleAssistant: { backgroundColor: theme.colors.carbs + '33' },
    contentUser: { color: '#FFFFFF' },
    contentAssistant: { color: theme.colors.text },
    timeUser: { color: theme.colors.muted, textAlign: 'right' },
    timeAssistant: { color: theme.colors.muted, textAlign: 'left' },
  }), [theme]);
  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View style={[styles.bubble, isUser ? themedStyles.bubbleUser : themedStyles.bubbleAssistant]}>
        <Text style={[styles.content, isUser ? themedStyles.contentUser : themedStyles.contentAssistant]}>
          {message.content}
        </Text>
      </View>
      <Text style={[styles.time, isUser ? themedStyles.timeUser : themedStyles.timeAssistant]}>
        {formatTime(message.ts)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginVertical: 4, maxWidth: '100%' },
  rowUser: { alignItems: 'flex-end' },
  rowAssistant: { alignItems: 'flex-start' },
  bubble: { borderRadius: 18, maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10 },
  content: { fontSize: 15, lineHeight: 21 },
  time: { fontSize: 11, marginTop: 3 },
});
