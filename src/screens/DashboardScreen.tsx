import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { InsightCard } from '../components/InsightCard';
import { MacroRing } from '../components/MacroRing';
import { MomentumRing } from '../components/MomentumRing';
import { MoodPicker } from '../components/MoodPicker';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { WeightCard } from '../components/WeightCard';
import { WaterModal } from '../components/WaterModal';
import { colors } from '../constants/colors';
import { getTodaysTotals, type TodayTotals } from '../services/foodLogs';
import { getTodayMood, setMood } from '../services/moodLogs';
import { addWater, getTodaysWater } from '../services/waterLogs';
import { getRecentWeights, type WeightEntry } from '../services/weightLogs';
import { useAuthStore } from '../store/authStore';
import type { RootTabParamList } from '../types/navigation';
import { calculateMomentum } from '../utils/momentum';
import { predictGoalDate } from '../utils/predictWeight';

const emptyTotals: TodayTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, perMeal: {} };
type Navigation = BottomTabNavigationProp<RootTabParamList, 'Dashboard'>;

export default function DashboardScreen() {
  const { user, profile } = useAuthStore();
  const navigation = useNavigation<Navigation>();
  const [totals, setTotals] = useState<TodayTotals>(emptyTotals);
  const [water, setWater] = useState(0);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [mood, setMoodValue] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(new Date());
  const [waterModalVisible, setWaterModalVisible] = useState(false);
  const [moodModalVisible, setMoodModalVisible] = useState(false);
  const targets = profile?.targets;
  const calories = targets?.calories ?? 0;

  const refresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    const [food, waterResult, weight, moodResult] = await Promise.allSettled([getTodaysTotals(user.uid), getTodaysWater(user.uid), getRecentWeights(user.uid, 14), getTodayMood(user.uid)]);
    if (food.status === 'fulfilled') setTotals(food.value);
    if (waterResult.status === 'fulfilled') setWater(waterResult.value);
    if (weight.status === 'fulfilled') setWeights(weight.value);
    if (moodResult.status === 'fulfilled') setMoodValue(moodResult.value);
    setRefreshing(false);
  }, [user]);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(timer); }, []);

  const goal = profile?.goal?.type ?? 'maintain';
  const trend = weights.length < 2 ? 'flat' : (goal === 'lose' ? weights[0].weight <= weights[1].weight : goal === 'gain' ? weights[0].weight >= weights[1].weight : Math.abs(weights[0].weight - weights[1].weight) < 0.2) ? 'desired' : 'opposite';
  const momentum = calculateMomentum({ calories: totals.calories, targetCalories: calories, protein: totals.protein, targetProtein: targets?.protein ?? 0, streakDays: profile?.streakDays ?? 0, weightTrend: trend, goal });
  const remaining = Math.max(0, calories - totals.calories);
  const cta = useMemo(() => getCta(now.getHours(), totals.perMeal, calories, remaining), [calories, now, remaining, totals.perMeal]);
  const prediction = profile?.goal ? predictGoalDate({ currentKg: weights[0]?.weight ?? profile.profile?.weightKg ?? profile.goal.targetWeightKg, targetKg: profile.goal.targetWeightKg, history: weights }) : null;

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.accent} />}>
    <View style={styles.header}><TouchableOpacity><Ionicons name="menu-outline" size={28} color={colors.text} /></TouchableOpacity><View style={styles.headerText}><Text style={styles.date}>{now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} · {now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text><Text style={styles.greeting}>Good {now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening'}, {profile?.displayName ?? 'there'}</Text></View>{profile?.streakDays ? <View style={styles.streak}><Ionicons name="flame" size={15} color={colors.warn} /><Text style={styles.streakText}>{profile.streakDays}</Text></View> : <View style={styles.avatar}><Text style={styles.avatarText}>{(profile?.displayName ?? 'B').slice(0, 1).toUpperCase()}</Text></View>}</View>
    <InsightCard />
    <View style={styles.card}><MomentumRing score={momentum.score} label={momentum.label} /><Text style={styles.summary}>{totals.calories} eaten · {remaining} left · {calories} goal</Text></View>
    <View style={styles.macros}><MacroRing label="Protein" current={totals.protein} target={targets?.protein ?? 0} color={colors.protein} unit="g" /><MacroRing label="Carbs" current={totals.carbs} target={targets?.carbs ?? 0} color={colors.carbs} unit="g" /><MacroRing label="Fat" current={totals.fat} target={targets?.fat ?? 0} color={colors.fat} unit="g" /><TouchableOpacity onPress={() => setWaterModalVisible(true)} style={styles.waterRing}><MacroRing label="Water" current={water} target={2500} color={colors.water} unit="L" /></TouchableOpacity></View>
    <PrimaryCTA {...cta} onPress={() => navigation.navigate('Log', cta.mealType ? { mealType: cta.mealType } : undefined)} />
    <WeightCard entries={weights} goal={goal} targetKg={profile?.goal?.targetWeightKg ?? 0} prediction={prediction} />
    <MoodPicker value={mood} onOpen={() => setMoodModalVisible(true)} onSave={async (value) => { if (!user) return; setMoodValue(value); await setMood(user.uid, value); }} />
    <TouchableOpacity style={styles.settings} onPress={() => navigation.navigate('Settings')}><Text style={styles.settingsText}>Settings</Text></TouchableOpacity>
    <WaterModal visible={waterModalVisible} onClose={() => setWaterModalVisible(false)} onAdd={async (ml) => { if (!user) return; await addWater(user.uid, ml); setWater((current) => current + ml); }} />
    <Modal visible={moodModalVisible} transparent animationType="fade" onRequestClose={() => setMoodModalVisible(false)}><View style={styles.moodOverlay}><View style={styles.moodModal}><MoodPicker value={mood} onSave={async (value) => { if (!user) return; setMoodValue(value); await setMood(user.uid, value); setMoodModalVisible(false); }} /></View></View></Modal>
  </ScrollView>;
}

function getCta(hour: number, perMeal: TodayTotals['perMeal'], target: number, remaining: number) {
  if (hour < 10 && !perMeal.breakfast) return { mealType: 'breakfast' as const, icon: 'sunny-outline' as const, title: 'Log breakfast', subtitle: `~${Math.round(target * 0.25)} kcal to stay on track` };
  if (hour < 14 && !perMeal.lunch) return { mealType: 'lunch' as const, icon: 'restaurant-outline' as const, title: 'Log lunch', subtitle: `~${Math.round(target * 0.3)} kcal budget` };
  if (hour < 17 && !perMeal.snack) return { mealType: 'snack' as const, icon: 'nutrition-outline' as const, title: 'Log a snack', subtitle: `Keep hunger down ~${Math.round(target * 0.1)} kcal` };
  if (hour < 21 && !perMeal.dinner) return { mealType: 'dinner' as const, icon: 'moon-outline' as const, title: 'Log dinner', subtitle: `~${remaining} kcal remaining` };
  return { icon: 'checkmark-circle-outline' as const, title: 'Review today', subtitle: 'See how you did' };
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg }, content: { gap: 16, padding: 20, paddingBottom: 36 }, header: { alignItems: 'center', flexDirection: 'row', marginBottom: 12 }, headerText: { flex: 1, marginLeft: 12 }, date: { color: colors.muted, fontSize: 13 }, greeting: { color: colors.text, fontSize: 22, fontWeight: '600', letterSpacing: -0.3, marginTop: 3 }, streak: { alignItems: 'center', backgroundColor: colors.surfaceHi, borderRadius: 16, flexDirection: 'row', gap: 4, paddingHorizontal: 10, paddingVertical: 6 }, streakText: { color: colors.text, fontSize: 13, fontWeight: '700' }, avatar: { alignItems: 'center', backgroundColor: colors.accentAlt, borderRadius: 18, height: 36, justifyContent: 'center', width: 36 }, avatarText: { color: colors.bg, fontWeight: '700' }, card: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, padding: 20 }, summary: { color: colors.muted, fontSize: 12, marginTop: 4 }, macros: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, flexDirection: 'row', paddingVertical: 16 }, waterRing: { flex: 1 }, settings: { borderTopColor: 'rgba(255,255,255,0.04)', borderTopWidth: 1, paddingTop: 20 }, settingsText: { color: colors.muted, fontSize: 13, textAlign: 'center', textDecorationLine: 'underline' }, moodOverlay: { backgroundColor: 'rgba(0,0,0,0.68)', flex: 1, justifyContent: 'flex-end' }, moodModal: { backgroundColor: colors.surfaceHi, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28 },
});
