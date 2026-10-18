import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (minutes: number) => void;
}

export function SleepModal({ visible, onClose, onSave }: Props) {
  const theme = useTheme();
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');

  const themed = useMemo(() => StyleSheet.create({
    overlay: { backgroundColor: theme.colors.overlay, flex: 1, justifyContent: 'flex-end' },
    card: { backgroundColor: theme.colors.surfaceHi, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28 },
    title: { color: theme.colors.text, fontSize: 21, fontWeight: '700', marginTop: 12, textAlign: 'center' },
    copy: { color: theme.colors.muted, fontSize: 14, marginTop: 6, textAlign: 'center' },
    inputRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
    inputWrap: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: 14, padding: 16, alignItems: 'center' },
    inputLabel: { color: theme.colors.muted, fontSize: 12, marginBottom: 8, fontWeight: '600' },
    textInput: { color: theme.colors.text, fontSize: 24, fontWeight: '700', textAlign: 'center', paddingVertical: 0 },
    actions: { flexDirection: 'row', gap: 12, marginTop: 26, width: '100%' },
    secondary: { alignItems: 'center', borderColor: theme.colors.border, borderRadius: 14, borderWidth: 1, flex: 1, padding: 15 },
    secondaryText: { color: theme.colors.text, fontWeight: '600' },
    primary: { alignItems: 'center', backgroundColor: theme.colors.info, borderRadius: 14, flex: 1, padding: 15 },
    primaryText: { color: theme.colors.bg, fontWeight: '700' },
  }), [theme]);

  const handleSave = () => {
    const h = Math.max(0, Math.min(24, parseInt(hours || '0', 10)));
    const m = Math.max(0, Math.min(59, parseInt(minutes || '0', 10)));
    const total = h * 60 + m;
    onSave(total);
    setHours('');
    setMinutes('');
    onClose();
  };

  const handleCancel = () => {
    setHours('');
    setMinutes('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={themed.overlay} behavior="padding">
        <Pressable onPress={onClose} style={themed.overlay}>
          <Pressable onPress={(event) => event.stopPropagation()} style={themed.card}>
            <Ionicons name="moon" color={theme.colors.info} size={30} />
            <Text style={themed.title}>Log Sleep</Text>
            <Text style={themed.copy}>Enter your sleep duration below.</Text>

            <View style={themed.inputRow}>
              <View style={themed.inputWrap}>
                <Text style={themed.inputLabel}>HOURS</Text>
                <TextInput
                  style={themed.textInput}
                  value={hours}
                  onChangeText={setHours}
                  placeholder="0"
                  placeholderTextColor={theme.colors.muted}
                  maxLength={2}
                  returnKeyType="done"
                />
              </View>
              <View style={themed.inputWrap}>
                <Text style={themed.inputLabel}>MINUTES</Text>
                <TextInput
                  style={themed.textInput}
                  value={minutes}
                  onChangeText={setMinutes}
                  placeholder="0"
                  placeholderTextColor={theme.colors.muted}
                  maxLength={2}
                  returnKeyType="done"
                />
              </View>
            </View>

            <View style={themed.actions}>
              <Pressable onPress={handleCancel} style={themed.secondary}>
                <Text style={themed.secondaryText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSave} style={themed.primary}>
                <Text style={themed.primaryText}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({});