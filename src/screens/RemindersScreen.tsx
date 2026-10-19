import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View, Modal, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

import { DEFAULT_REMINDERS, getReminders, Reminder, saveAndScheduleReminders, requestPermissions } from '../services/reminderService';
import { useTheme } from '../theme';

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')); // 01 to 12
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')); // 00 to 59

function parse12h(time24: string) {
  const [h24, m] = time24.split(':').map(Number);
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return {
    hour: String(h12).padStart(2, '0'),
    minute: String(m).padStart(2, '0'),
    ampm
  };
}

function build24h(h12: string, m: string, ampm: string) {
  let h24 = parseInt(h12, 10);
  if (ampm === 'PM' && h24 !== 12) h24 += 12;
  if (ampm === 'AM' && h24 === 12) h24 = 0;
  return `${String(h24).padStart(2, '0')}:${m}`;
}

function RemindersScreenInner() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  const [reminders, setReminders] = useState<Reminder[]>(DEFAULT_REMINDERS);
  const [loading, setLoading] = useState(true);
  const [notifStatus, setNotifStatus] = useState<'checking' | 'granted' | 'denied' | 'undetermined'>('checking');

  const [modalVisible, setModalVisible] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getReminders();
        setReminders(data);
        
        const { status } = await Notifications.getPermissionsAsync();
        setNotifStatus(status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined');
      } catch (e) {
        console.error('[Reminders] load error', e);
      } finally {
        setLoading(false);
      }
    })();
    
    void requestPermissions().catch((e) => console.error('[Reminders] requestPermissions threw', e));
  }, []);

  const saveAll = async (updated: Reminder[]) => {
    setReminders(updated);
    try {
      await saveAndScheduleReminders(updated);
    } catch {
      Alert.alert('Failed to save reminders');
    }
  };

  const toggleEnabled = (id: string, enabled: boolean) => {
    const updated = reminders.map(r => r.id === id ? { ...r, enabled } : r);
    saveAll(updated);
  };

  const openEditor = (reminder: Reminder) => {
    setEditingReminder({ ...reminder });
    setModalVisible(true);
  };

  const addCustom = () => {
    if (reminders.length >= 10) {
      Alert.alert('Limit Reached', 'You can only have a maximum of 10 reminders.');
      return;
    }
    const newReminder: Reminder = {
      id: `custom_${Date.now()}`,
      title: 'Custom',
      enabled: true,
      time: '12:00',
      repeatCount: 1,
      everyDay: true,
    };
    setEditingReminder(newReminder);
    setModalVisible(true);
  };

  const saveEdit = () => {
    if (!editingReminder) return;
    const exists = reminders.find(r => r.id === editingReminder.id);
    const updated = exists 
      ? reminders.map(r => r.id === editingReminder.id ? editingReminder : r)
      : [...reminders, editingReminder];
    saveAll(updated);
    setModalVisible(false);
  };

  const deleteEdit = () => {
    if (!editingReminder) return;
    if (reminders.length <= 1) {
      Alert.alert('Required', 'You must have at least 1 reminder.');
      return;
    }
    const updated = reminders.filter(r => r.id !== editingReminder.id);
    saveAll(updated);
    setModalVisible(false);
  };

  const current12h = editingReminder ? parse12h(editingReminder.time) : { hour: '12', minute: '00', ampm: 'PM' };

  const setTimePart = (part: 'hour' | 'minute' | 'ampm', value: string) => {
    if (!editingReminder) return;
    const nextParts = { ...current12h, [part]: value };
    setEditingReminder({
      ...editingReminder,
      time: build24h(nextParts.hour, nextParts.minute, nextParts.ampm),
    });
  };

  const themed = useMemo(() => StyleSheet.create({
    screen: { backgroundColor: theme.colors.bg, flex: 1 },
    header: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      paddingHorizontal: 20, 
      paddingTop: insets.top + 24, 
      paddingBottom: 20, 
      justifyContent: 'space-between' 
    },
    headerTitle: { color: theme.colors.text, fontSize: 28, fontWeight: '800' },
    addBtn: { backgroundColor: theme.colors.accent, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
    addBtnText: { color: theme.colors.bg, fontWeight: '800', fontSize: 16 },
    
    scrollContent: { paddingHorizontal: 20, paddingBottom: 60 },
    card: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 16, borderWidth: 1, marginBottom: 14 },
    row: { alignItems: 'center', flexDirection: 'row', padding: 18 },
    rowLeft: { flex: 1 },
    rowTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
    rowSubtitle: { color: theme.colors.muted, fontSize: 14, marginTop: 6 },
    
    // Modal
    modalBackdrop: { backgroundColor: 'rgba(0,0,0,0.8)', flex: 1, justifyContent: 'flex-end' },
    modalCard: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: '70%', maxHeight: '90%' },
    modalTitle: { color: theme.colors.text, fontSize: 24, fontWeight: '800', marginBottom: 24 },
    
    label: { color: theme.colors.muted, fontSize: 14, fontWeight: '800', marginBottom: 10, marginTop: 20, letterSpacing: 0.5 },
    input: { backgroundColor: theme.colors.surfaceHi, borderRadius: 12, padding: 16, color: theme.colors.text, fontSize: 18, fontWeight: '600' },
    
    timeRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    timeBox: { backgroundColor: theme.colors.surfaceHi, borderRadius: 12, paddingVertical: 16, alignItems: 'center', minWidth: 70 },
    timeText: { color: theme.colors.text, fontSize: 24, fontWeight: '700' },
    
    actionRow: { flexDirection: 'row', gap: 12, marginTop: 32 },
    btn: { flex: 1, padding: 18, borderRadius: 14, alignItems: 'center' },
    btnSave: { backgroundColor: theme.colors.accent },
    btnCancel: { backgroundColor: theme.colors.surfaceHi },
    btnText: { fontWeight: '800', fontSize: 18 },
  }), [theme, insets.top]);

  if (loading) {
    return (
      <SafeAreaView style={themed.screen}>
        <ActivityIndicator size="large" color={theme.colors.accent} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <View style={themed.screen}>
      <View style={themed.header}>
        <Text style={themed.headerTitle}>Reminders</Text>
        <Pressable 
          style={[themed.addBtn, reminders.length >= 10 && { opacity: 0.5 }]} 
          onPress={addCustom}
        >
          <Text style={themed.addBtnText}>+ Add</Text>
        </Pressable>
      </View>

      {notifStatus !== 'granted' && notifStatus !== 'checking' && (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.accent, borderWidth: 1, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 16, gap: 12 }}>
          <Ionicons name="notifications-outline" size={26} color={theme.colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '700' }}>
              {notifStatus === 'denied' ? 'Notifications blocked' : 'Enable reminders'}
            </Text>
            <Text style={{ color: theme.colors.muted, fontSize: 13, marginTop: 4 }}>
              {notifStatus === 'denied' ? 'Open Settings to allow notifications' : 'Required to receive alerts'}
            </Text>
          </View>
          <Pressable
            onPress={async () => {
              try {
                if (notifStatus === 'denied') {
                  await Linking.openSettings();
                } else {
                  const { status } = await Notifications.requestPermissionsAsync();
                  setNotifStatus(status === 'granted' ? 'granted' : 'denied');
                }
              } catch (e) {
                console.error('[Reminders] permission action threw', e);
              }
            }}
            style={{ backgroundColor: theme.colors.accent, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 }}
          >
            <Text style={{ color: theme.colors.bg, fontSize: 14, fontWeight: '800' }}>
              {notifStatus === 'denied' ? 'Settings' : 'Enable'}
            </Text>
          </Pressable>
        </View>
      )}

      <ScrollView contentContainerStyle={themed.scrollContent}>
        {reminders.map(r => (
          <Pressable key={r.id} style={themed.card} onPress={() => openEditor(r)}>
            <View style={themed.row}>
              <View style={themed.rowLeft}>
                <Text style={themed.rowTitle}>{r.title}</Text>
                <Text style={themed.rowSubtitle}>
                  {parse12h(r.time).hour}:{parse12h(r.time).minute} {parse12h(r.time).ampm}
                  {r.repeatCount > 1 ? ` (${r.repeatCount} times)` : ''}
                </Text>
              </View>
              <Switch 
                value={r.enabled} 
                onValueChange={(v) => toggleEnabled(r.id, v)} 
                trackColor={{ false: theme.colors.muted, true: theme.colors.accent }} 
                thumbColor={theme.colors.accentText}
              />
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={themed.modalBackdrop}>
          <View style={themed.modalCard}>
            <Text style={themed.modalTitle}>Edit Reminder</Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={themed.label}>TITLE</Text>
              <TextInput 
                style={themed.input} 
                value={editingReminder?.title} 
                onChangeText={(t) => setEditingReminder(prev => prev ? { ...prev, title: t } : null)} 
              />

              <Text style={themed.label}>TIME (12-HOUR)</Text>
              <View style={themed.timeRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1, gap: 8 }}>
                  {HOURS.map(h => {
                    const selected = current12h.hour === h;
                    return (
                      <Pressable 
                        key={h} 
                        style={[themed.timeBox, { marginRight: 8 }, selected && { backgroundColor: theme.colors.accent }]}
                        onPress={() => setTimePart('hour', h)}
                      >
                        <Text style={[themed.timeText, selected && { color: theme.colors.bg }]}>{h}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                
                <Text style={{ color: theme.colors.text, fontSize: 28, fontWeight: '800', marginHorizontal: 2 }}>:</Text>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1, gap: 8 }}>
                  {MINUTES.map(m => {
                    const selected = current12h.minute === m;
                    return (
                      <Pressable 
                        key={m} 
                        style={[themed.timeBox, { marginLeft: 8 }, selected && { backgroundColor: theme.colors.accent }]}
                        onPress={() => setTimePart('minute', m)}
                      >
                        <Text style={[themed.timeText, selected && { color: theme.colors.bg }]}>{m}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                {['AM', 'PM'].map(ampm => {
                  const selected = current12h.ampm === ampm;
                  return (
                    <Pressable
                      key={ampm}
                      style={[themed.timeBox, { flex: 1 }, selected && { backgroundColor: theme.colors.accent }]}
                      onPress={() => setTimePart('ampm', ampm)}
                    >
                      <Text style={[themed.timeText, selected && { color: theme.colors.bg }]}>{ampm}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={themed.label}>REMIND ME HOW MANY TIMES? (MAX 4)</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {[1, 2, 3, 4].map(count => {
                  const selected = (editingReminder?.repeatCount || 1) === count;
                  return (
                    <Pressable
                      key={count}
                      style={[themed.timeBox, { flex: 1 }, selected && { backgroundColor: theme.colors.accent }]}
                      onPress={() => setEditingReminder(prev => prev ? { ...prev, repeatCount: count } : null)}
                    >
                      <Text style={[themed.timeText, selected && { color: theme.colors.bg }]}>{count}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={themed.label}>REPEAT</Text>
              <Pressable 
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}
                onPress={() => setEditingReminder(prev => prev ? { ...prev, everyDay: !prev.everyDay } : null)}
              >
                <Ionicons 
                  name={editingReminder?.everyDay ? "checkbox" : "square-outline"} 
                  size={28} 
                  color={theme.colors.accent} 
                />
                <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '600' }}>Every Day</Text>
              </Pressable>
            </ScrollView>

            <View style={themed.actionRow}>
              <Pressable style={[themed.btn, themed.btnCancel]} onPress={() => setModalVisible(false)}>
                <Text style={[themed.btnText, { color: theme.colors.text }]}>Cancel</Text>
              </Pressable>
              <Pressable style={[themed.btn, themed.btnSave]} onPress={saveEdit}>
                <Text style={[themed.btnText, { color: theme.colors.bg }]}>Save</Text>
              </Pressable>
            </View>
            {reminders.find(r => r.id === editingReminder?.id) && (
              <Pressable style={{ alignItems: 'center', marginTop: 20, padding: 10 }} onPress={deleteEdit}>
                <Text style={{ color: theme.colors.danger, fontWeight: '700', fontSize: 16 }}>Delete Reminder</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

class RemindersErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    console.error('[Reminders] render error:', error);
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Reminders] caught:', error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0D0C', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
            Reminders unavailable
          </Text>
          <Text style={{ color: '#888', fontSize: 14, textAlign: 'center' }}>
            {this.state.error?.message ?? 'Unknown error'}
          </Text>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

export default function RemindersScreen() {
  return (
    <RemindersErrorBoundary>
      <RemindersScreenInner />
    </RemindersErrorBoundary>
  );
}