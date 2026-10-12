import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ChatBubble } from '../components/ChatBubble';
import { colors } from '../constants/colors';
import {
  getAssistantReply,
  getChatHistory,
  saveAssistantMessage,
  sendMessage,
  type CoachMessage,
} from '../services/coachChat';
import { useAuthStore } from '../store/authStore';

export default function CoachScreen() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList<CoachMessage>>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let active = true;
    void (async () => {
      const history = await getChatHistory(user.uid, 50);
      if (active) {
        setMessages(history);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending || !user) return;
    const optimistic: CoachMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content,
      ts: null as unknown as CoachMessage['ts'],
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput('');
    setSending(true);
    void sendMessage(user.uid, content);
    try {
      const reply = await getAssistantReply(user.uid, content);
      void saveAssistantMessage(user.uid, reply);
      setMessages((prev) => [
        ...prev,
        { id: `local-${Date.now()}`, role: 'assistant', content: reply, ts: null as unknown as CoachMessage['ts'] },
      ]);
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <View style={[styles.fill, styles.center]}>
        <Text style={styles.signIn}>Please sign in</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Coach</Text>
          <Text style={styles.subtitle}>Your nutrition assistant</Text>
        </View>
        <View style={styles.avatar}>
          <Ionicons color={colors.accent} name="sparkles" size={20} />
        </View>
      </View>

      {loading ? (
        <View style={[styles.fill, styles.center]}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : messages.length === 0 ? (
        <View style={[styles.fill, styles.center, styles.padded]}>
          <View style={styles.emptyCard}>
            <Ionicons color={colors.accent} name="sparkles" size={40} />
            <Text style={styles.emptyTitle}>Say hi to your coach</Text>
            <Text style={styles.emptySubtitle}>Ask anything about your goals, meals, or progress.</Text>
          </View>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={[...messages].reverse()}
          inverted
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <ChatBubble message={item} />}
          ListFooterComponent={sending ? <LoadingBubble /> : null}
          onContentSizeChange={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
        />
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask your coach..."
          placeholderTextColor={colors.muted}
          multiline
        />
        <Pressable
          disabled={!input.trim() || sending}
          onPress={() => void handleSend()}
          style={[styles.send, (!input.trim() || sending) && styles.sendDisabled]}
        >
          <Ionicons color={colors.bg} name="arrow-up" size={22} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function LoadingBubble() {
  return (
    <View style={styles.loadingRow}>
      <View style={styles.loadingBubble}>
        <Text style={styles.loadingDots}>• • •</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  padded: { paddingHorizontal: 32 },
  signIn: { color: colors.muted, fontSize: 15 },
  header: { alignItems: 'center', flexDirection: 'row', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerText: { flex: 1 },
  title: { color: colors.text, fontSize: 22, fontWeight: '600' },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 2 },
  avatar: { alignItems: 'center', backgroundColor: colors.surfaceHi, borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  list: { paddingHorizontal: 16, paddingVertical: 12 },
  emptyCard: { alignItems: 'center', backgroundColor: colors.surfaceHi, borderRadius: 20, gap: 10, maxWidth: 320, padding: 28 },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '700', marginTop: 6 },
  emptySubtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  loadingRow: { alignItems: 'flex-start', marginVertical: 4 },
  loadingBubble: { backgroundColor: colors.surfaceHi, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  loadingDots: { color: colors.muted, fontSize: 15, letterSpacing: 2 },
  inputBar: { alignItems: 'center', backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', gap: 8, padding: 12 },
  input: { backgroundColor: colors.surfaceHi, borderRadius: 20, color: colors.text, flex: 1, fontSize: 15, maxHeight: 100, paddingHorizontal: 16, paddingVertical: 12 },
  send: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  sendDisabled: { backgroundColor: colors.muted },
});

