import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { ChatBubble } from '../components/ChatBubble';
import {
  getAssistantReply,
  getChatHistory,
  saveAssistantMessage,
  sendMessage,
  type CoachMessage,
} from '../services/coachChat';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme';

interface Props {
  /** When provided, a close button appears in the header (used by the modal wrapper). */
  onClose?: () => void;
}

export default function CoachScreen({ onClose }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const listRef = useRef<FlatList<CoachMessage>>(null);
  const sendingRef = useRef(false);

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
    if (!content || !user) return;
    if (sendingRef.current) return;
    sendingRef.current = true;
    const optimistic: CoachMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content,
      ts: null as unknown as CoachMessage['ts'],
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput('');
    setSending(true);
    setError(null);
    void sendMessage(user.uid, content);
    try {
      const reply = await getAssistantReply(user.uid, content);
      void saveAssistantMessage(user.uid, reply);
      setMessages((prev) => [
        ...prev,
        { id: `local-${Date.now()}`, role: 'assistant', content: reply, ts: null as unknown as CoachMessage['ts'] },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not reach the coach.';
      setError(msg);
      setMessages((prev) => [
        ...prev,
        { id: `local-retry-${Date.now()}`, role: 'assistant', content: 'Sorry, that failed. Tap retry to try again.', ts: null as unknown as CoachMessage['ts'] },
      ]);
    } finally {
      setSending(false);
      sendingRef.current = false;
    }
  };

  const retryLast = (): void => {
    if (sendingRef.current || !user) return;
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;
    setInput(lastUser.content);
    setError(null);
    setRetryKey((k) => k + 1);
  };

  const themedStyles = useMemo(() => StyleSheet.create({
    fill: { flex: 1, backgroundColor: theme.colors.bg },
    signIn: { color: theme.colors.muted, fontSize: 15 },
    title: { color: theme.colors.text, fontSize: 22, fontWeight: '600' },
    subtitle: { color: theme.colors.muted, fontSize: 13, marginTop: 2 },
    avatar: { alignItems: 'center', backgroundColor: theme.colors.surfaceHi, borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
    
    // Increased padding and gap for empty state
    emptyCard: { alignItems: 'center', backgroundColor: theme.colors.surfaceHi, borderRadius: 24, gap: 14, maxWidth: 320, padding: 32 },
    emptyTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700', marginTop: 8 },
    emptySubtitle: { color: theme.colors.muted, fontSize: 14, lineHeight: 22, textAlign: 'center' },
    
    // Increased input bar padding and safe area handling
    inputBar: { 
      alignItems: 'center', 
      backgroundColor: theme.colors.surface, 
      borderTopColor: theme.colors.border, 
      borderTopWidth: 1, 
      flexDirection: 'row', 
      gap: 12, 
      paddingHorizontal: 16, 
      paddingTop: 12,
      paddingBottom: Math.max(insets.bottom, 16), 
    },
    input: { 
      backgroundColor: theme.colors.surfaceHi, 
      borderRadius: 24, 
      color: theme.colors.text, 
      flex: 1, 
      fontSize: 16, 
      maxHeight: 120, 
      paddingHorizontal: 20, 
      paddingVertical: 14 
    },
    send: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 24, height: 48, justifyContent: 'center', width: 48 },
    sendDisabled: { backgroundColor: theme.colors.muted },
  }), [theme, insets.bottom]);

  if (!user) {
    return (
      <View style={[themedStyles.fill, styles.center]}>
        <Text style={themedStyles.signIn}>Please sign in</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={themedStyles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Increased header padding */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 12 }]}>
        {onClose ? (
          <Pressable hitSlop={8} onPress={onClose} style={styles.close}>
            <Ionicons color={theme.colors.text} name="close" size={24} />
          </Pressable>
        ) : null}
        <View style={styles.headerText}>
          <Text style={themedStyles.title}>Coach</Text>
          <Text style={themedStyles.subtitle}>Your nutrition assistant</Text>
        </View>
        <View style={themedStyles.avatar}>
          <Ionicons color={theme.colors.accent} name="sparkles" size={20} />
        </View>
      </View>

      {loading ? (
        <View style={[themedStyles.fill, styles.center]}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      ) : messages.length === 0 ? (
        <View style={[themedStyles.fill, styles.center, styles.padded]}>
          <View style={themedStyles.emptyCard}>
            <Ionicons color={theme.colors.accent} name="sparkles" size={44} />
            <Text style={themedStyles.emptyTitle}>Say hi to your coach</Text>
            <Text style={themedStyles.emptySubtitle}>Ask anything about your goals, meals, or progress.</Text>
          </View>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={[...messages].reverse()}
          inverted
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={styles.list}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => <ChatBubble message={item} />}
          ListFooterComponent={sending ? <LoadingBubble /> : null}
          onContentSizeChange={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
        />
      )}

      <View style={themedStyles.inputBar}>
        <TextInput
          style={themedStyles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask your coach..."
          placeholderTextColor={theme.colors.muted}
          multiline
        />
        <Pressable
          disabled={!input.trim() || sending}
          onPress={() => void handleSend()}
          style={[themedStyles.send, (!input.trim() || sending) && themedStyles.sendDisabled]}
        >
          <Ionicons color={theme.colors.bg} name="arrow-up" size={24} />
        </Pressable>
      </View>
      
      {error ? (
        <Pressable onPress={retryLast} style={[styles.errorRow, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Ionicons color={theme.colors.danger} name="alert-circle" size={16} />
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
          <Text style={[styles.retryText, { color: theme.colors.accent }]}>Retry</Text>
        </Pressable>
      ) : null}
    </KeyboardAvoidingView>
  );
}

function LoadingBubble() {
  const theme = useTheme();
  const themedStyles = useMemo(() => StyleSheet.create({
    loadingBubble: { backgroundColor: theme.colors.surfaceHi, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12 },
    loadingDots: { color: theme.colors.muted, fontSize: 15, letterSpacing: 2 },
  }), [theme]);
  return (
    <View style={styles.loadingRow}>
      <View style={themedStyles.loadingBubble}>
        <Text style={themedStyles.loadingDots}>• • •</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  close: { padding: 4 },
  padded: { paddingHorizontal: 32 },
  // Increased horizontal and bottom padding
  header: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingBottom: 16 },
  headerText: { flex: 1 },
  // Increased list padding so bubbles don't touch the edges
  list: { paddingHorizontal: 20, paddingVertical: 16 },
  loadingRow: { alignItems: 'flex-start', marginVertical: 6 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  errorText: { flex: 1, fontSize: 13 },
  retryText: { fontSize: 13, fontWeight: '600' },
});