import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';

interface Props { visible: boolean; onClose: () => void; onAdd: (ml: number) => Promise<void>; }

export function WaterModal({ visible, onClose, onAdd }: Props) {
  const theme = useTheme();
  const add = async (ml: number) => { await onAdd(ml); onClose(); };
  const themedStyles = useMemo(() => StyleSheet.create({
    overlay: { backgroundColor: theme.colors.overlay, flex: 1, justifyContent: 'flex-end' },
    card: { alignItems: 'center', backgroundColor: theme.colors.surfaceHi, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28 },
    title: { color: theme.colors.text, fontSize: 21, fontWeight: '700', marginTop: 12 },
    copy: { color: theme.colors.muted, fontSize: 14, marginTop: 6 },
    secondary: { alignItems: 'center', borderColor: theme.colors.border, borderRadius: 14, borderWidth: 1, flex: 1, padding: 15 },
    secondaryText: { color: theme.colors.text, fontWeight: '600' },
    primary: { alignItems: 'center', backgroundColor: theme.colors.water, borderRadius: 14, flex: 1, padding: 15 },
    primaryText: { color: theme.colors.bg, fontWeight: '700' },
  }), [theme]);
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><Pressable onPress={onClose} style={themedStyles.overlay}><Pressable onPress={(event) => event.stopPropagation()} style={themedStyles.card}><Ionicons name="water" color={theme.colors.water} size={30} /><Text style={themedStyles.title}>Hydrate your day</Text><Text style={themedStyles.copy}>Add water to today’s progress.</Text><View style={styles.actions}><Pressable onPress={() => void add(250)} style={themedStyles.secondary}><Text style={themedStyles.secondaryText}>+250 ml</Text></Pressable><Pressable onPress={() => void add(500)} style={themedStyles.primary}><Text style={themedStyles.primaryText}>+500 ml</Text></Pressable></View></Pressable></Pressable></Modal>;
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 12, marginTop: 26, width: '100%' },
});
