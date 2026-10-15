import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { InsightCard } from '../components/InsightCard';
import { MacroRing } from '../components/MacroRing';
import { MomentumRing } from '../components/MomentumRing';
import { MoodPicker } from '../components/MoodPicker';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { WeightCard } from '../components/WeightCard';
import { WaterModal } from '../components/WaterModal';
import { StatCard } from '../components/StatCard';
import { DashboardHero } from '../components/DashboardHero';
import { TodaysMealsCard } from '../components/TodaysMealsCard';
import { BodyStatsCard } from '../components/BodyStatsCard';
import { QuickLogRow } from '../components/QuickLogRow';
import { setMood } from '../services/moodLogs';
import { addWater } from '../services/waterLogs';
import { refreshStreak } from '../services/streakService';
import { useHealthData } from '../hooks/useHealthData';
import { useRecentWeights, useTodayFoodLogs, useTodayMood, useTodayWater, useUserDoc, type PerMealFlags } from '../hooks/useRealtime';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme';
import type { RootTabParamList } from '../types/navigation';
import { calculateMomentum } from '../utils/momentum';
import { formatCalories, formatWeight } from '../utils/format';
import { predictGoalDate } from '../utils/predictWeight';

type Navigation = BottomTabNavigationProp<RootTabParamList, 'Dashboard'>;

export default function DashboardScreen() {
  const theme = useTheme();
  const { user, profile } = useAuthStore();
  const navigation = useNavigation<Navigation>();
  const uid = user?.uid;

  // Real-time Firestore listeners: any write from any screen updates these.
  const { totals, perMeal, perMealFlags } = useTodayFoodLogs(uid);
  const { ml: water } = useTodayWater(uid);
  const { entries: weights } = useRecentWeights(uid, 14);
  const { mood } = useTodayMood(uid);
  // Pushes users/{uid} into the auth store so profile-driven UI stays current.
  useUserDoc(uid);

  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(new Date());
  const [waterModalVisible, setWaterModalVisible] = useState(false);
  const [moodModalVisible, setMoodModalVisible] = useState(false);
  const targets = profile?.targets;
  const calories = targets?.calories ?? 0;
  const health = useHealthData(true);
  const waterTarget = 2500;

  // Pull-to-refresh only recomputes the streak — every other value is live.
  const refresh = useCallback(async () => {
    if (!uid) return;
    setRefreshing(true);
    const streak = await refreshStreak(uid).catch(() => null);
    if (streak !== null && streak !== useAuthStore.getState().profile?.streakDays) {
      const current = useAuthStore.getState().profile;
      if (current) useAuthStore.getState().setProfile({ ...current, streakDays: streak });
    }
    setRefreshing(false);
  }, [uid]);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(timer); }, []);

  const goal = profile?.goal?.type ?? 'maintain';
  const trend = weights.length < 2 ? 'flat' : (goal === 'lose' ? weights[0].weight <= weights[1].weight : goal === 'gain' ? weights[0].weight >= weights[1].weight : Math.abs(weights[0].weight - weights[1].weight) < 0.2) ? 'desired' : 'opposite';
  const momentum = calculateMomentum({ calories: totals.calories, targetCalories: calories, protein: totals.protein, targetProtein: targets?.protein ?? 0, streakDays: profile?.streakDays ?? 0, weightTrend: trend, goal });
  const remaining = Math.max(0, calories - totals.calories);
  const burned = health.data ? health.data.caloriesBurned : 0;
  // Ring fill = share of the calorie goal consumed.
  const caloriePct = calories > 0 ? Math.min(100, Math.round((totals.calories / calories) * 100)) : 0;
  const waterLiters = (water / 1000).toFixed(1);
  const waterTargetLiters = (waterTarget / 1000).toFixed(1);
  const currentWeight = profile?.profile?.weightKg ?? 0;
  const weightValue = currentWeight > 0 ? formatWeight(currentWeight) : '—';
  const cta = useMemo(() => getCta(now.getHours(), perMealFlags, calories, remaining), [calories, now, remaining, perMealFlags]);
  const prediction = profile?.goal ? predictGoalDate({ currentKg: weights[0]?.weight ?? profile.profile?.weightKg ?? profile.goal.targetWeightKg, targetKg: profile.goal.targetWeightKg, history: weights }) : null;

  const themedStyles = useMemo(() => StyleSheet.create({
    screen: { backgroundColor: theme.colors.bg },
    date: { color: theme.colors.muted, fontSize: 13 },
    greeting: { color: theme.colors.text, fontSize: 22, fontWeight: '600', letterSpacing: -0.3, marginTop: 3 },
    streak: { alignItems: 'center', backgroundColor: theme.colors.surfaceHi, borderRadius: 16, flexDirection: 'row', gap: 4, paddingHorizontal: 10, paddingVertical: 6 },
    streakText: { color: theme.colors.text, fontSize: 13, fontWeight: '700' },
    avatar: { alignItems: 'center', backgroundColor: theme.colors.accentAlt, borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
    avatarText: { color: theme.colors.bg, fontWeight: '700' },
    card: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 20, borderWidth: 1, padding: 20 },
    summary: { color: theme.colors.muted, fontSize: 12, marginTop: 4 },
    macros: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 20, borderWidth: 1, flexDirection: 'row', paddingVertical: 16 },
    settings: { borderTopColor: theme.colors.border, borderTopWidth: 1, paddingTop: 20 },
    settingsText: { color: theme.colors.muted, fontSize: 13, textAlign: 'center', textDecorationLine: 'underline' },
    ringCard: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 20, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 16 },
    bulletList: { borderLeftColor: theme.colors.border, borderLeftWidth: 1, flex: 1, justifyContent: 'center', paddingLeft: 12 },
    bullet: { color: theme.colors.muted, fontSize: 12, marginBottom: 4 },
    detailsPill: { alignSelf: 'flex-start', borderColor: theme.colors.border, borderRadius: 999, borderWidth: 1, marginTop: 10, paddingHorizontal: 12, paddingVertical: 6 },
    detailsPillText: { color: theme.colors.accent, fontSize: 12, fontWeight: '600' },
    moodCard: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 16 },
    statRow: { flexDirection: 'row', gap: 8 },
    streakBox: { flex: 1, gap: 8 },
    moodOverlay: { backgroundColor: theme.colors.overlay, flex: 1, justifyContent: 'flex-end' },
    moodModal: { backgroundColor: theme.colors.surfaceHi, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28 },
  }), [theme]);
  return <ScrollView style={themedStyles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={theme.colors.accent} />}>
          <DashboardHero
        avatarLetter={(profile?.displayName ?? 'B').slice(0, 1).toUpperCase()}
        displayName={profile?.displayName ?? 'there'}
        onMenuPress={() => navigation.navigate('Settings')}
      />
    <InsightCard
        remaining={remaining}
        target={calories}
        eaten={totals.calories}
        protein={totals.protein}
        targetProtein={targets?.protein ?? 0}
      />
    <View style={themedStyles.statRow}>
      <StatCard
        icon='footsteps-outline'
        iconColor={health.data ? theme.colors.accent : theme.colors.muted}
        label='Steps'
        value={health.data ? health.data.steps.toLocaleString() : '—'}
        subtitle={health.data ? `${Math.round((health.data.steps / 10000) * 100)}% of 10k goal` : (health.loading ? 'Loading…' : 'Connect')}
        subtitleColor={health.data ? theme.colors.muted : theme.colors.accent}
        onPress={health.data ? undefined : () => navigation.navigate('Settings')}
      />
      <StatCard
        icon='water-outline'
        iconColor={theme.colors.water}
        label='Water'
        value={`${waterLiters}L`}
        subtitle={`of ${waterTargetLiters}L`}
      />
      <StatCard
        icon='bed-outline'
        iconColor={theme.colors.muted}
        label='Sleep'
        value='—'
        subtitle='Connect'
        subtitleColor={theme.colors.accent}
        onPress={() => navigation.navigate('Settings')}
      />
      <StatCard
        icon='scale-outline'
        iconColor={theme.colors.accent}
        label='Weight'
        value={weightValue}
        subtitle={currentWeight > 0 ? 'kg' : 'Log weight'}
        subtitleColor={currentWeight > 0 ? theme.colors.muted : theme.colors.accent}
        onPress={currentWeight > 0 ? undefined : () => navigation.navigate('Progress')}
      />
    </View>
    {/* Streak + momentum kept as small stat cards now that the hero no longer shows them. */}
    <View style={themedStyles.statRow}>
      <StatCard
        icon='star-outline'
        iconColor={theme.colors.warn}
        label='Day streak'
        subtitle=''
        value={`${profile?.streakDays ?? 0}`}
      />
      <StatCard
        icon='trending-up-outline'
        iconColor={theme.colors.accent}
        label='Momentum'
        subtitle={momentum.label}
        value={`${momentum.score}`}
      />
    </View>
<View style={{ flexDirection: 'row', gap: 12 }}>
  <View style={{ flex: 1.4 }}>
    <View style={themedStyles.ringCard}>
      <MomentumRing score={caloriePct} title="Calories" headline={formatCalories(remaining)} caption={`of ${formatCalories(calories)} kcal`} />
      <View style={themedStyles.bulletList}>
        <Text style={[themedStyles.bullet, { color: theme.colors.accent }]}>● {formatCalories(remaining)} Remaining</Text>
        <Text style={[themedStyles.bullet, { color: theme.colors.warn }]}>● {burned.toLocaleString()} Burned</Text>
        <Text style={[themedStyles.bullet, { color: theme.colors.muted }]}>● {formatCalories(totals.calories)} Consumed</Text>
      </View>
    </View>
    <TouchableOpacity style={themedStyles.detailsPill}>
      <Text style={themedStyles.detailsPillText}>View details →</Text>
    </TouchableOpacity>
  </View>
  <View style={{ flex: 1 }}>
    <TodaysMealsCard perMeal={perMeal} onMealPress={(m) => navigation.navigate('Log', { mealType: m })} />
  </View>
</View>
    <View style={themedStyles.macros}><MacroRing label="Protein" current={totals.protein} target={targets?.protein ?? 0} color={theme.colors.protein} unit="g" /><MacroRing label="Carbs" current={totals.carbs} target={targets?.carbs ?? 0} color={theme.colors.carbs} unit="g" /><MacroRing label="Fat" current={totals.fat} target={targets?.fat ?? 0} color={theme.colors.fat} unit="g" /><TouchableOpacity onPress={() => setWaterModalVisible(true)} style={styles.waterRing}><MacroRing label="Water" current={water} target={waterTarget} color={theme.colors.water} unit="L" /></TouchableOpacity></View>
    <PrimaryCTA {...cta} onPress={() => navigation.navigate('Log', cta.mealType ? { mealType: cta.mealType } : undefined)} />
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View style={{ flex: 1.2 }}>
        <WeightCard entries={weights} goal={goal} targetKg={profile?.goal?.targetWeightKg ?? 0} prediction={prediction} />
      </View>
      <View style={{ flex: 1 }}>
        <BodyStatsCard weightKg={profile?.profile?.weightKg ?? 0} heightCm={profile?.profile?.heightCm ?? 0} age={profile?.profile?.age ?? 0} gender={profile?.profile?.gender ?? 'male'} />
      </View>
    </View>
    <View style={themedStyles.moodCard}>
      <MoodPicker value={mood} onOpen={() => setMoodModalVisible(true)} onSave={async (value) => { if (!user) return; await setMood(user.uid, value); }} />
    </View>
    <QuickLogRow
      items={[
        { icon: 'barcode-outline', label: 'Scan', onPress: () => navigation.navigate('Barcode') },
        { icon: 'camera-outline', label: 'Snap', onPress: () => navigation.navigate('PhotoLog', {}) },
        { icon: 'mic-outline', label: 'Voice', onPress: () => navigation.navigate('VoiceLog', {}) },
        { icon: 'search-outline', label: 'Search', onPress: () => navigation.navigate('Log', {}) },
      ]}
    />
    <TouchableOpacity style={themedStyles.settings} onPress={() => navigation.navigate('Settings')}><Text style={themedStyles.settingsText}>Settings</Text></TouchableOpacity>
    <WaterModal visible={waterModalVisible} onClose={() => setWaterModalVisible(false)} onAdd={async (ml) => { if (!user) return; await addWater(user.uid, ml); }} />
    <Modal visible={moodModalVisible} transparent animationType="fade" onRequestClose={() => setMoodModalVisible(false)}><View style={themedStyles.moodOverlay}><View style={themedStyles.moodModal}><MoodPicker value={mood} onSave={async (value) => { if (!user) return; await setMood(user.uid, value); setMoodModalVisible(false); }} /></View></View></Modal>
  </ScrollView>;
}

function getCta(hour: number, perMeal: PerMealFlags, target: number, remaining: number) {
  if (hour < 10 && !perMeal.breakfast) return { mealType: 'breakfast' as const, icon: 'sunny-outline' as const, title: 'Log breakfast', subtitle: `~${Math.round(target * 0.25)} kcal to stay on track` };
  if (hour < 14 && !perMeal.lunch) return { mealType: 'lunch' as const, icon: 'restaurant-outline' as const, title: 'Log lunch', subtitle: `~${Math.round(target * 0.3)} kcal budget` };
  if (hour < 17 && !perMeal.snack) return { mealType: 'snack' as const, icon: 'nutrition-outline' as const, title: 'Log a snack', subtitle: `Keep hunger down ~${Math.round(target * 0.1)} kcal` };
  if (hour < 21 && !perMeal.dinner) return { mealType: 'dinner' as const, icon: 'moon-outline' as const, title: 'Log dinner', subtitle: `~${remaining} kcal remaining` };
  return { icon: 'checkmark-circle-outline' as const, title: 'Review today', subtitle: 'See how you did' };
}

const styles = StyleSheet.create({
  content: { gap: 16, padding: 20, paddingBottom: 36 },
  waterRing: { flex: 1 },
});


