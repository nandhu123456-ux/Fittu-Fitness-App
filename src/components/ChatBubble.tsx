import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../constants/colors';
import type { CoachMessage } from '../services/coachChat';

interface Props {
  message: CoachMessage;
}

const formatTime = (ts: CoachMessage['ts']): string => {
  if (ts === null || ts === undefined) return '';
  const date = ts.toDate();
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

export function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.content, isUser ? styles.contentUser : styles.contentAssistant]}>
          {message.content}
        </Text>
      </View>
      <Text style={[styles.time, isUser ? styles.timeUser : styles.timeAssistant]}>
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
  bubbleUser: { backgroundColor: colors.accent },
  bubbleAssistant: { backgroundColor: colors.surfaceHi },
  content: { fontSize: 15, lineHeight: 21 },
  contentUser: { color: colors.bg },
  contentAssistant: { color: colors.text },
  time: { fontSize: 11, marginTop: 3 },
  timeUser: { color: colors.muted, textAlign: 'right' },
  timeAssistant: { color: colors.muted, textAlign: 'left' },
});
