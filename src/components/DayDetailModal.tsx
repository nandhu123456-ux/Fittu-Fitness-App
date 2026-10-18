import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { getLogsForDate, deleteDayLog, type DayLog } from '../services/dayDetails';

interface Props {
  visible: boolean;
  date: string | null;
  onClose: () => void;
}

export function DayDetailModal({ visible, date, onClose }: Props) {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
const [logs, setLogs] = useState<DayLog[]>([]);
const [loading, setLoading] = useState(false);
const [page, setPage] = useState(0);

  const load = async () => {
    if (!user || !date) return;
    setLoading(true);
    const data = await getLogsForDate(user.uid, date);
    setLogs(data);
setPage(0);
    setLoading(false);
  };

  useEffect(() => {
    if (visible && date) void load();
  }, [visible, date]);

  const handleDelete = (log: DayLog) => {
    if (!user) return;
    Alert.alert('Delete Log?', `Are you sure you want to remove this ${log.type}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteDayLog(user.uid, log);
          void load(); // refresh modal
        } 
      }
    ]);
  };

  const themed = useMemo(() => StyleSheet.create({
    overlay: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end' },
    sheet: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
    closeBtn: { padding: 4 },
    empty: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { color: theme.colors.muted, fontSize: 14, marginTop: 12 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.surfaceHi, padding: 14, borderRadius: 12, marginBottom: 8 },
    rowTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
    rowSub: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },
    deleteBtn: { padding: 8 },
  }), [theme]);

  const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : '';

const PAGE_SIZE = 5;
const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
const pageLogs = logs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={themed.overlay} onPress={onClose}>
        <View style={themed.sheet}>
          <View style={themed.headerRow}>
            <Text style={themed.title}>{formattedDate}</Text>
            <Pressable onPress={onClose} style={themed.closeBtn}>
              <Ionicons name="close" size={24} color={theme.colors.muted} />
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator color={theme.colors.accent} style={{ marginTop: 20 }} />
          ) : logs.length === 0 ? (
            <View style={themed.empty}>
              <Ionicons name="calendar-outline" size={48} color={theme.colors.muted} />
              <Text style={themed.emptyText}>You didn't log anything on this day.</Text>
            </View>
          ) : (
            <>
              {pageLogs.map((log) => (
                <View key={log.id} style={themed.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={themed.rowTitle}>
                      {log.type === 'food' ? log.name : log.type === 'water' ? 'Water Intake' : 'Sleep Record'}
                    </Text>
                    <Text style={themed.rowSub}>
                      {log.type === 'food' && `${log.cal} kcal · P:${log.protein}g C:${log.carbs}g F:${log.fat}g`}
                      {log.type === 'water' && `${log.ml} ml`}
                      {log.type === 'sleep' && `${Math.floor((log.sleepMin || 0)/60)}h ${(log.sleepMin||0)%60}m`}
                    </Text>
                  </View>
                  <Pressable onPress={() => handleDelete(log)} style={themed.deleteBtn}>
                    <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
                  </Pressable>
                </View>
              ))}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <Pressable onPress={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                  <Text style={{ color: page === 0 ? theme.colors.muted : theme.colors.accent }}>Prev</Text>
                </Pressable>
                <Text style={{ color: theme.colors.muted }}>{page + 1}/{totalPages}</Text>
                <Pressable onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                  <Text style={{ color: page >= totalPages - 1 ? theme.colors.muted : theme.colors.accent }}>Next</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}
