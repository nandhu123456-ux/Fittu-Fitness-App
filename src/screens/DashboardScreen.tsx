import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { WeekStrip } from '../components/WeekStrip';
import { CaloriesMacrosCard } from '../components/CaloriesMacrosCard';
import { StepsCard } from '../components/StepsCard';
import { WaterSleepRow } from '../components/WaterSleepRow';
import { WaterModal } from '../components/WaterModal';
import { DayDetailModal } from '../components/DayDetailModal';
import { LogCircleMenu } from '../components/LogCircleMenu';
import { addWater } from '../services/waterLogs';
import { useHealthData } from '../hooks/useHealthData';
import { useTodayFoodLogs, useTodayWater, useUserDoc } from '../hooks/useRealtime';
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
  useUserDoc(uid);
  const health = useHealthData(true);

  const [refreshing, setRefreshing] = useState(false);
  const [waterModalVisible, setWaterModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [logMenuVisible, setLogMenuVisible] = useState(false);
  
  const targets = profile?.targets;
  const calories = targets?.calories ?? 0;
  const displayName = profile?.displayName ?? 'there';
  const avatarLetter = displayName.slice(0, 1).toUpperCase();
  const streakDays = profile?.streakDays ?? 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Determine if ANY meals are logged today
  const hasLoggedMeals = totals.calories > 0;

  const themed = useMemo(() => StyleSheet.create({
    screen: { backgroundColor: theme.colors.bg },
    content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 },
    header: { paddingHorizontal: 16, paddingTop: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerLeft: { flex: 1 },
    greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    greeting: { fontSize: 13, color: theme.colors.muted },
    name: { fontSize: 26, fontWeight: '700', color: theme.colors.text, marginTop: 2 },
    sub: { fontSize: 13, color: theme.colors.muted, marginTop: 4 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.accentAlt, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: theme.colors.bg, fontSize: 18, fontWeight: '700' },
    streakPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-end', marginTop: 10, gap: 6 },
    streakText: { fontSize: 12, fontWeight: '600', color: theme.colors.text },
    
    greenCard: { marginTop: 12, backgroundColor: '#0F2114', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#2E5C36' },
    greenText: { flex: 1, fontSize: 15, fontStyle: 'italic', color: theme.colors.text, lineHeight: 22 },
    
    insightCard: { marginTop: 12, backgroundColor: theme.colors.surface, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: theme.colors.accent + '40' },
    insightText: { flex: 1, fontSize: 13, color: theme.colors.text, lineHeight: 18 },
    logFab: {
      alignItems: 'center',
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.bg,
      borderRadius: 28,
      borderWidth: 3,
      height: 56,
      justifyContent: 'center',
      position: 'absolute',
      right: 20,
      bottom: 20,
      width: 56,
      zIndex: 100,
    },
  }), [theme]);

  return (
    <SafeAreaView style={[themed.screen, { flex: 1 }]}>
    <ScrollView 
      style={{ flex: 1 }}
      contentContainerStyle={themed.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} tintColor={theme.colors.accent} />}
    >
      <View style={themed.header}>
        <View style={themed.headerLeft}>
          <View style={themed.greetingRow}>
            <Text style={themed.greeting}>{greeting},</Text>
            <View style={themed.headerRight}>
              <Pressable onPress={() => navigation.navigate('Notifications')} style={themed.iconBtn}>
                <Ionicons name="notifications-outline" size={20} color={theme.colors.text} />
                <View style={{ position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.danger }} />
              </Pressable>
              <Pressable onPress={() => navigation.navigate('Profile')} style={themed.avatar}>
                <Text style={themed.avatarText}>{avatarLetter}</Text>
              </Pressable>
            </View>
          </View>
          <Text style={themed.name}>{displayName} 👋</Text>
          <Text style={themed.sub}>Small steps make big changes.</Text>
          
          <View style={themed.streakPill}>
            <Ionicons name="flame" size={14} color={theme.colors.warn} />
            <Text style={themed.streakText}>{streakDays} day streak</Text>
            <Ionicons name="chevron-forward" size={12} color={theme.colors.muted} />
          </View>
        </View>
      </View>

      {/* Clicking a date opens the modal */}
      <WeekStrip onDayPress={(date) => setSelectedDate(date)} selectedDate={selectedDate} />

      <CaloriesMacrosCard
        eaten={totals.calories}
        target={calories}
        burned={health.data?.caloriesBurned ?? 0}
        protein={totals.protein}
        proteinTarget={targets?.protein ?? 0}
        carbs={totals.carbs}
        carbsTarget={targets?.carbs ?? 0}
        fat={totals.fat}
        fatTarget={targets?.fat ?? 0}
      />

      <StepsCard 
        steps={health.data?.steps ?? 0} 
        onPress={() => {}} 
      />

      <WaterSleepRow
        waterMl={water}
        sleepMin={health.data?.sleepMinutes ?? 0}
        onAddWater={() => setWaterModalVisible(true)}
        onLogSleep={() => {}}
      />

      {/* CONDITIONAL LOGIC: Green Card vs Insight Card */}
      {!hasLoggedMeals ? (
        <View style={themed.greenCard}>
          <Ionicons name="leaf" size={28} color={theme.colors.success} />
          <Text style={themed.greenText}>Discipline today builds the stronger you tomorrow.</Text>
        </View>
      ) : (
        <View style={themed.insightCard}>
          <Ionicons name="sparkles" size={24} color={theme.colors.accent} />
          <Text style={themed.insightText}>Great job logging your meals! Keep your protein high to stay on track.</Text>
        </View>
      )}

      <WaterModal visible={waterModalVisible} onClose={() => setWaterModalVisible(false)} onAdd={async (ml) => { if (user) await addWater(user.uid, ml); }} />
      
      {/* The modal showing the logs for the clicked date */}
      <DayDetailModal 
        visible={selectedDate !== null} 
        date={selectedDate} 
        onClose={() => setSelectedDate(null)} 
      />
      </ScrollView>
      <Pressable onPress={() => setLogMenuVisible(true)} style={themed.logFab}>
        <Ionicons name="add" size={28} color={theme.colors.bg} />
      </Pressable>
      <LogCircleMenu visible={logMenuVisible} onClose={() => setLogMenuVisible(false)} />
    </SafeAreaView>
  );
}
