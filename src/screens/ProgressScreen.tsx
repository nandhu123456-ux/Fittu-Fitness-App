import { useMemo, useState } from 'react';
import { 
  Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, ActivityIndicator, useWindowDimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme';
import { useRecentWeights, useFoodHistory, useActivityHistory, useUserDoc } from '../hooks/useRealtime';
import { calculateBodyStats } from '../utils/bodyStats';
import { shiftDate, todayLocalISO } from '../utils/streak';
import { ProgressGraphCard } from '../components/ProgressGraphCard';
import { addWeight, deleteWeight } from '../services/weightLogs';

const RANGES = [
  { label: '7D', val: 7 },
  { label: '2W', val: 14 },
  { label: '1M', val: 30 },
  { label: '2M', val: 60 },
] as const;

type Tab = 'weight' | 'calories' | 'macros' | 'activity';

export default function ProgressScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const { user, profile } = useAuthStore();
  const uid = user?.uid;

  const [activeTab, setActiveTab] = useState<Tab>('weight');
  const [rangeDays, setRangeDays] = useState<7 | 14 | 30 | 60>(7);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);

  const { entries: rawWeights } = useRecentWeights(uid, 60);
  const { days: rawFoodDays } = useFoodHistory(uid);
  const { days: rawActivityDays } = useActivityHistory(uid);

  useUserDoc(uid);

  const safeWeights = rawWeights || [];
  const safeFood = rawFoodDays || [];
  const safeActivity = rawActivityDays || [];

  const cutoffDate = shiftDate(todayLocalISO(), -rangeDays);
  
  const filteredWeights = safeWeights.filter((w) => w.date >= cutoffDate);
  
  // --- 1. FIND THE LATEST WEIGHT BY TIMESTAMP ---
  const sortedAllWeights = useMemo(() => {
    return [...safeWeights].sort((a, b) => {
      const aTime = a.createdAt || 0;
      const bTime = b.createdAt || 0;
      if (aTime !== bTime) return bTime - aTime;
      return b.id.localeCompare(a.id);
    });
  }, [safeWeights]);

  const latestWeight = sortedAllWeights[0]?.weight ?? profile?.profile?.weightKg ?? 0;
  
  const displayWeights = useMemo(() => {
    const sorted = [...filteredWeights].sort((a, b) => {
      const aTime = a.createdAt || 0;
      const bTime = b.createdAt || 0;
      if (aTime !== bTime) return aTime - bTime;
      return a.id.localeCompare(b.id);
    });
    if (sorted.length === 1 && profile?.profile?.weightKg) {
      return [{ id: 'start', date: 'Start', weight: profile.profile.weightKg }, ...sorted];
    }
    return sorted;
  }, [filteredWeights, profile]);

  const filteredFood = safeFood.slice(-rangeDays);
  const filteredActivity = safeActivity.slice(-rangeDays);

  const oldestWeight = displayWeights[0]?.weight ?? latestWeight;
  const weightDelta = latestWeight - oldestWeight;

  const goalType = profile?.goal?.type || 'lose';
  const targetWeight = profile?.goal?.targetWeightKg || 0;
  const kgToGoal = Math.abs(latestWeight - targetWeight);
  
  // --- MOTIVATION LOGIC ---
  let motivationMessage = '';
  let motivationColor = theme.colors.success;

  if (displayWeights.length >= 2) {
    if (goalType === 'lose') {
      if (weightDelta > 0) {
        motivationColor = theme.colors.warn;
        motivationMessage = `You gained ${weightDelta.toFixed(1)}kg this period. Don't stress, focus on today. ${kgToGoal.toFixed(1)}kg left to goal.`;
      } else {
        motivationMessage = `You lost ${Math.abs(weightDelta).toFixed(1)}kg this period. ${kgToGoal.toFixed(1)}kg left to reach ${targetWeight}kg!`;
      }
    } else if (goalType === 'gain') {
      if (weightDelta < 0) {
        motivationColor = theme.colors.warn;
        motivationMessage = `You lost ${Math.abs(weightDelta).toFixed(1)}kg this period. Try to eat a bit more. ${kgToGoal.toFixed(1)}kg left to goal.`;
      } else {
        motivationMessage = `You gained ${weightDelta.toFixed(1)}kg this period. ${kgToGoal.toFixed(1)}kg left to reach ${targetWeight}kg!`;
      }
    } else {
      motivationMessage = `You're maintaining steadily. Great job!`;
    }
  }

  const stats = calculateBodyStats({
    weightKg: latestWeight, 
    heightCm: profile?.profile?.heightCm ?? 0,
    age: profile?.profile?.age ?? 0,
    gender: profile?.profile?.gender ?? 'male',
  });

  const isMale = profile?.profile?.gender === 'male';
  let bfStatus = { text: '', color: '' };
  let mmStatus = { text: '', color: '' };

  if (stats) {
    const healthyBfMax = isMale ? 20 : 28;
    const bfDelta = stats.bodyFatPct - healthyBfMax;
    if (bfDelta > 0) {
      bfStatus = { text: `↓ ${bfDelta.toFixed(1)}% to healthy`, color: theme.colors.warn };
    } else {
      bfStatus = { text: `✅ Healthy range`, color: theme.colors.success };
    }

    const targetBf = isMale ? 15 : 22; 
    const targetLeanMass = targetWeight * (1 - targetBf / 100);
    const mmDelta = targetLeanMass - stats.leanMassKg;
    if (mmDelta > 0) {
      mmStatus = { text: `↑ ${mmDelta.toFixed(1)} kg to target`, color: theme.colors.accent };
    } else {
      mmStatus = { text: `✅ Target reached`, color: theme.colors.success };
    }
  }

  const chartWidth = width - 64; 
  const chartHeight = 140;
  const weightLine = useMemo(() => {
    if (displayWeights.length < 2) return '';
    const values = displayWeights.map((w) => w.weight);
    const min = Math.min(...values);
    const span = Math.max(...values) - min || 1;

    const points = values.map((val, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * chartWidth;
      const y = 120 - ((val - min) / span) * 100;
      return { x, y };
    });

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }, [displayWeights, chartWidth]);

  const saveWeight = async () => {
    const val = Number(newWeight);
    if (!uid || !Number.isFinite(val) || val <= 0) return;
    setSaving(true);
    try {
      await addWeight(uid, val, newNote.trim() || undefined);
      setNewWeight(''); setNewNote(''); setModalVisible(false);
    } catch { Alert.alert('Error', 'Could not save weight.'); } finally { setSaving(false); }
  };

  const removeWeight = (id: string, weight: number, date: string) => {
    if (!uid) return;
    Alert.alert('Delete Entry?', `${weight.toFixed(1)} kg from ${date}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void deleteWeight(uid, id) }
    ]);
  };

  const themed = useMemo(() => StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.bg },
    content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    backBtn: { marginRight: 12, padding: 4 },
    title: { fontSize: 22, fontWeight: '700', color: theme.colors.text },
    
    heroCard: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 16, marginBottom: 16 },
    heroLabel: { fontSize: 11, fontWeight: '600', color: theme.colors.muted, textTransform: 'uppercase' },
    heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
    heroValue: { fontSize: 32, fontWeight: '700', color: theme.colors.text },
    deltaPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: theme.colors.surfaceHi },
    deltaText: { fontSize: 14, fontWeight: '600' },
    
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    statCard: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: 16, padding: 14 },
    statLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    statLabel: { fontSize: 11, fontWeight: '600', color: theme.colors.muted, textTransform: 'uppercase' },
    estimatedTag: { fontSize: 9, color: theme.colors.muted, fontStyle: 'italic', backgroundColor: theme.colors.surfaceHi, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
    statValue: { fontSize: 22, fontWeight: '700', color: theme.colors.text, marginTop: 6 },
    statSuggestion: { fontSize: 11, fontWeight: '600', marginTop: 4 },
    
    rangeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    rangeBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: theme.colors.surface },
    rangeBtnActive: { backgroundColor: theme.colors.accent },
    rangeText: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
    rangeTextActive: { color: theme.colors.bg },
    
    tabsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 12 },
    tabActive: { backgroundColor: theme.colors.accent },
    tabText: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
    tabTextActive: { color: theme.colors.bg },
    
    chartCard: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 16, marginBottom: 16, overflow: 'hidden' },
    chartLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.muted, marginBottom: 16 },
    emptyChart: { height: 120, alignItems: 'center', justifyContent: 'center' },
    emptyText: { color: theme.colors.muted, fontSize: 13 },
    motivationBox: { padding: 12, borderRadius: 12, marginTop: 16, alignItems: 'center' },
    motivationText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
    
    historyTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 12, marginTop: 4 },
    historyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.surface, padding: 14, borderRadius: 12, marginBottom: 8 },
    historyWeight: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
    historyDate: { fontSize: 13, color: theme.colors.muted, marginTop: 2 },
    
    fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center', elevation: 6 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.text, marginBottom: 16 },
    input: { backgroundColor: theme.colors.surfaceHi, color: theme.colors.text, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12 },
    saveBtn: { backgroundColor: theme.colors.accent, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
    saveBtnText: { color: theme.colors.bg, fontSize: 16, fontWeight: '700' },
  }), [theme]);

  return (
    <SafeAreaView style={themed.screen} edges={['top']}>
      <ScrollView contentContainerStyle={themed.content} showsVerticalScrollIndicator={false}>
        <View style={themed.header}>
          <Pressable onPress={() => navigation.goBack()} style={themed.backBtn}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={themed.title}>My Progress</Text>
        </View>

        <View style={themed.heroCard}>
          <Text style={themed.heroLabel}>Current Weight (Goal: {targetWeight}kg)</Text>
          <View style={themed.heroRow}>
            <Text style={themed.heroValue}>{latestWeight.toFixed(1)} kg</Text>
            <View style={[themed.deltaPill, { backgroundColor: weightDelta <= 0 ? theme.colors.success + '20' : theme.colors.danger + '20' }]}>
              <Text style={[themed.deltaText, { color: weightDelta <= 0 ? theme.colors.success : theme.colors.danger }]}>
                {weightDelta > 0 ? '+' : ''}{weightDelta.toFixed(1)} kg
              </Text>
            </View>
          </View>
          <Text style={[themed.statLabel, { color: theme.colors.muted, marginTop: 8 }]}>
            vs last {rangeDays === 7 ? 'week' : rangeDays === 14 ? '2 weeks' : rangeDays === 30 ? 'month' : '2 months'}
          </Text>
        </View>

        {stats && (
          <View style={themed.statsRow}>
            <View style={themed.statCard}>
              <View style={themed.statLabelRow}>
                <Text style={themed.statLabel}>Body Fat</Text>
                <Text style={themed.estimatedTag}>Estimated</Text>
              </View>
              <Text style={themed.statValue}>{stats.bodyFatPct}%</Text>
              <Text style={[themed.statSuggestion, { color: bfStatus.color }]}>
                {bfStatus.text}
              </Text>
            </View>
            <View style={themed.statCard}>
              <View style={themed.statLabelRow}>
                <Text style={themed.statLabel}>Muscle Mass</Text>
                <Text style={themed.estimatedTag}>Estimated</Text>
              </View>
              <Text style={themed.statValue}>{stats.leanMassKg} kg</Text>
              <Text style={[themed.statSuggestion, { color: mmStatus.color }]}>
                {mmStatus.text}
              </Text>
            </View>
          </View>
        )}

        <View style={themed.rangeRow}>
          {RANGES.map((r) => (
            <Pressable key={r.val} onPress={() => setRangeDays(r.val)} style={[themed.rangeBtn, rangeDays === r.val && themed.rangeBtnActive]}>
              <Text style={[themed.rangeText, rangeDays === r.val && themed.rangeTextActive]}>{r.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={themed.tabsRow}>
          {(['weight', 'calories', 'macros', 'activity'] as Tab[]).map((t) => (
            <Pressable key={t} onPress={() => setActiveTab(t)} style={[themed.tab, activeTab === t && themed.tabActive]}>
              <Text style={[themed.tabText, activeTab === t && themed.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
            </Pressable>
          ))}
        </View>

        {activeTab === 'weight' && (
          <>
            <View style={themed.chartCard}>
              <Text style={themed.chartLabel}>WEIGHT TREND</Text>
              
              {displayWeights.length >= 2 ? (
                <>
                  <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                    <Defs>
                      <LinearGradient id="wGrad" x1="0" y1="0" x2="1" y2="0">
                        <Stop offset="0" stopColor={theme.colors.accentAlt} />
                        <Stop offset="1" stopColor={theme.colors.accent} />
                      </LinearGradient>
                    </Defs>
                    <Path d={weightLine} fill="none" stroke="url(#wGrad)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>

                  <View style={[themed.motivationBox, { backgroundColor: motivationColor + '15' }]}>
                    <Text style={[themed.motivationText, { color: motivationColor }]}>
                      {motivationMessage}
                    </Text>
                  </View>
                </>
              ) : (
                <View style={themed.emptyChart}><Text style={themed.emptyText}>Log your weight to see the trend</Text></View>
              )}
            </View>

            <Text style={themed.historyTitle}>History</Text>
            {filteredWeights.length === 0 ? (
              <Text style={{ color: theme.colors.muted, textAlign: 'center', marginTop: 10 }}>No entries yet. Tap + to log.</Text>
            ) : (
              filteredWeights.map((w) => (
                <View key={w.id} style={themed.historyRow}>
                  <View>
                    <Text style={themed.historyWeight}>{w.weight.toFixed(1)} kg</Text>
                    <Text style={themed.historyDate}>{w.date} {w.note ? `· ${w.note}` : ''}</Text>
                  </View>
                  <Pressable onPress={() => removeWeight(w.id, w.weight, w.date)} hitSlop={10}>
                    <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
                  </Pressable>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === 'calories' && (
          <>
            <ProgressGraphCard 
              title="Calories Eaten" 
              icon="🍽️" 
              data={filteredFood.map(d => ({ label: d.date.slice(5), value: d.cal || 0 }))} 
              goal={profile?.targets?.calories ?? 2000} 
              unit="kcal" 
              color={theme.colors.accent} 
            />
            
            {/* FIXED: Read totalKcal from Firestore instead of just activeKcal */}
            <ProgressGraphCard 
              title="Calories Burned" 
              icon="🔥" 
              data={filteredActivity.map(d => ({ label: d.date?.slice(5) || '', value: (d as any).totalKcal || (d as any).activeKcal || 0 }))} 
              goal={2200} 
              unit="kcal" 
              color="#FF6B6B" 
            />
          </>
        )}

        {activeTab === 'macros' && (
          <>
            <ProgressGraphCard 
              title="Protein" 
              icon="🥩" 
              data={filteredFood.map(d => ({ label: d.date.slice(5), value: d.protein || 0 }))} 
              goal={profile?.targets?.protein ?? 150} 
              unit="g" 
              color={theme.colors.protein} 
            />
            <ProgressGraphCard 
              title="Carbs" 
              icon="🍞" 
              data={filteredFood.map(d => ({ label: d.date.slice(5), value: d.carbs || 0 }))} 
              goal={profile?.targets?.carbs ?? 200} 
              unit="g" 
              color={theme.colors.carbs} 
            />
            <ProgressGraphCard 
              title="Fat" 
              icon="🥑" 
              data={filteredFood.map(d => ({ label: d.date.slice(5), value: d.fat || 0 }))} 
              goal={profile?.targets?.fat ?? 60} 
              unit="g" 
              color={theme.colors.fat} 
            />
          </>
        )}

        {activeTab === 'activity' && (
          <>
            <ProgressGraphCard 
              title="Steps" 
              icon="👟" 
              data={filteredActivity.map(d => ({ label: d.date?.slice(5) || '', value: d.steps || 0 }))} 
              goal={10000} 
              unit="steps" 
              color={theme.colors.water} 
            />
            <ProgressGraphCard 
              title="Sleep" 
              icon="🌙" 
              data={filteredActivity.map(d => ({ 
                label: d.date?.slice(5) || '', 
                value: (d as any).sleepMin || 0 
              }))} 
              goal={480} 
              unit="mins" 
              color="#a855f7" 
            />
          </>
        )}
      </ScrollView>

      <Pressable style={themed.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={32} color={theme.colors.bg} />
      </Pressable>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior="padding" style={themed.modalOverlay}>
          <Pressable style={{ flex: 1 }} onPress={() => setModalVisible(false)} />
          <View style={themed.modalContent}>
            <Text style={themed.modalTitle}>Log Weight</Text>
            <TextInput style={themed.input} placeholder="Weight in kg" placeholderTextColor={theme.colors.muted} keyboardType="decimal-pad" value={newWeight} onChangeText={setNewWeight} autoFocus />
            <TextInput style={themed.input} placeholder="Optional note" placeholderTextColor={theme.colors.muted} value={newNote} onChangeText={setNewNote} />
            <Pressable style={themed.saveBtn} onPress={saveWeight} disabled={saving}>
              {saving ? <ActivityIndicator color={theme.colors.bg} /> : <Text style={themed.saveBtnText}>Save Entry</Text>}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}