import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../constants/colors';

interface Props { visible: boolean; onClose: () => void; onAdd: (ml: number) => Promise<void>; }

export function WaterModal({ visible, onClose, onAdd }: Props) {
  const add = async (ml: number) => { await onAdd(ml); onClose(); };
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><Pressable onPress={onClose} style={styles.overlay}><Pressable onPress={(event) => event.stopPropagation()} style={styles.card}><Ionicons name="water" color={colors.water} size={30} /><Text style={styles.title}>Hydrate your day</Text><Text style={styles.copy}>Add water to today’s progress.</Text><View style={styles.actions}><Pressable onPress={() => void add(250)} style={styles.secondary}><Text style={styles.secondaryText}>+250 ml</Text></Pressable><Pressable onPress={() => void add(500)} style={styles.primary}><Text style={styles.primaryText}>+500 ml</Text></Pressable></View></Pressable></Pressable></Modal>;
}

const styles = StyleSheet.create({
  overlay: { backgroundColor: 'rgba(0,0,0,0.68)', flex: 1, justifyContent: 'flex-end' }, card: { alignItems: 'center', backgroundColor: colors.surfaceHi, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28 }, title: { color: colors.text, fontSize: 21, fontWeight: '700', marginTop: 12 }, copy: { color: colors.muted, fontSize: 14, marginTop: 6 }, actions: { flexDirection: 'row', gap: 12, marginTop: 26, width: '100%' }, secondary: { alignItems: 'center', borderColor: colors.border, borderRadius: 14, borderWidth: 1, flex: 1, padding: 15 }, secondaryText: { color: colors.text, fontWeight: '600' }, primary: { alignItems: 'center', backgroundColor: colors.water, borderRadius: 14, flex: 1, padding: 15 }, primaryText: { color: colors.bg, fontWeight: '700' },
});
