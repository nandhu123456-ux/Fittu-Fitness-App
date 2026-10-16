import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { InsightCard } from '../components/InsightCard';
import { WeekStrip } from '../components/WeekStrip';
import { CaloriesMacrosCard } from '../components/CaloriesMacrosCard';
import { StatCardsRow } from '../components/StatCardsRow';
import { WaterModal } from '../components/WaterModal';
import { addWater } from '../services/waterLogs';
import { refreshStreak } from '../services/streakService';
import { useHealthData } from '../hooks/useHealthData';
import { useRecentWeights, useTodayFoodLogs, useTodayMood, useTodayWater, useUserDoc } from '../hooks/useRealtime';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme';
import type { RootTabParamList } from '../types/navigation';

type Navigation = BottomTabNavigationProp<RootTabParamList, 'Dashboard'>;

export default function DashboardScreen() {
  const theme = useTheme();
  const { user, profile } = useAuthStore();
  const navigation = useNavigation<Navigation>();
  const uid = user?.uid;

  const { totals } = useTodayFoodLogs(uid);
  const { ml: water } = useTodayWater(uid);
  const { entries: weights } = useRecentWeights(uid, 14);
  const { mood } = useTodayMood(uid);
  useUserDoc(uid);

  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(new Date());
  const [waterModalVisible, setWaterModalVisible] = useState(false);
  const targets = profile?.targets;
  const calories = targets?.calories ?? 0;
  const health = useHealthData(true);

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

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const displayName = profile?.displayName ?? 'there';
  const avatarLetter = displayName.slice(0, 1).toUpperCase();

  const themedStyles = useMemo(() => StyleSheet.create({
    screen: { backgroundColor: theme.colors.bg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20 },
    greetingLine1: { color: theme.colors.muted, fontSize: 13 },
    greetingLine2: { color: theme.colors.text, fontSize: 24, fontWeight: '700', marginTop: 2 },
    greetingLine3: { color: theme.colors.muted, fontSize: 13, marginTop: 4 },
    avatar: { alignItems: 'center', backgroundColor: theme.colors.accentAlt, borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
    avatarText: { color: theme.colors.bg, fontSize: 18, fontWeight: '700' },
  }), [theme]);

  return (
    <ScrollView style={themedStyles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={theme.colors.accent} />}>
      <View style={themedStyles.header}>
        <View style={styles.leftColumn}>
          <Text style={themedStyles.greetingLine1}>{greeting}</Text>
          <Text style={themedStyles.greetingLine2}>{displayName}</Text>
          <Text style={themedStyles.greetingLine3}>Small steps make big changes.</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={themedStyles.avatar}>
          <Text style={themedStyles.avatarText}>{avatarLetter}</Text>
        </TouchableOpacity>
      </View>

      <WeekStrip />

      <CaloriesMacrosCard
        eaten={totals.calories}
        target={calories}
        protein={totals.protein}
        carbs={totals.carbs}
        fat={totals.fat}
      />

      <StatCardsRow health={health} waterMl={water} onWaterPress={() => setWaterModalVisible(true)} />

      <InsightCard
        remaining={Math.max(0, calories - totals.calories)}
        target={calories}
        eaten={totals.calories}
        protein={totals.protein}
        targetProtein={targets?.protein ?? 0}
      />

      <WaterModal visible={waterModalVisible} onClose={() => setWaterModalVisible(false)} onAdd={async (ml) => { if (!user) return; await addWater(user.uid, ml); }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 0, padding: 0, paddingBottom: 40 },
  leftColumn: { flex: 1 },
});