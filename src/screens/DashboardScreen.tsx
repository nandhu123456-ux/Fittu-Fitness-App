import { useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { WeekStrip } from '../components/WeekStrip';
import { CaloriesMacrosCard } from '../components/CaloriesMacrosCard';
import { StepsCard } from '../components/StepsCard';
import { WaterSleepRow } from '../components/WaterSleepRow';
import { WaterModal } from '../components/WaterModal';
import { SleepModal } from '../components/SleepModal';
import { DayDetailModal } from '../components/DayDetailModal';
import { LogCircleMenu } from '../components/LogCircleMenu';
import { addWater } from '../services/waterLogs';
import { logManualSleep } from '../services/activityLogs';
import { useHealthData } from '../hooks/useHealthData';
import { useTodayFoodLogs, useTodayWater, useTodaySleep, useUserDoc } from '../hooks/useRealtime';
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

  const [waterModalVisible, setWaterModalVisible] = useState(false);
  const [sleepModalVisible, setSleepModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [logMenuVisible, setLogMenuVisible] = useState(false);
  
  const targets = profile?.targets;
  const calories = targets?.calories ?? 0;
  const displayName = profile?.displayName ?? 'there';
  const streakDays = profile?.streakDays ?? 0;
  const isMale = profile?.profile?.gender === 'male';
  const consistencyTitle = isMale ? 'Mr. Consistent' : 'Ms. Consistent';

  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Good night';

  const manualSleepMin = useTodaySleep(uid);
  const displaySleepMin = manualSleepMin > 0 ? manualSleepMin : (health.data?.sleepMinutes ?? 0);

  const themed = useMemo(() => StyleSheet.create({
    // Removed ScrollView, using flex: 1 to strictly fit the screen
    screen: { backgroundColor: theme.colors.bg, flex: 1, paddingHorizontal: 16, paddingTop: 12 },
    
    // Header / User Card
    header: { marginBottom: 16, marginTop: 8 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerLeft: { flex: 1 },
    greeting: { fontSize: 15, color: theme.colors.muted, fontWeight: '500' },
    name: { fontSize: 28, fontWeight: '700', color: theme.colors.text, marginTop: 2 },
    
    headerRightIcons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' },
    notificationDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.danger },
    avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: theme.colors.accentAlt, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    avatarImage: { height: '100%', resizeMode: 'cover', width: '100%' },
    
    tagsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
    pillText: { fontSize: 12, fontWeight: '600', color: theme.colors.text },
    
    // Spacing to distribute the layout beautifully across the screen
    sectionGap: { marginTop: 14 },

    // FAB
    logFab: { alignItems: 'center', backgroundColor: theme.colors.accent, borderColor: theme.colors.bg, borderRadius: 26, borderWidth: 3, height: 52, justifyContent: 'center', position: 'absolute', right: 16, bottom: 24, width: 52, zIndex: 100 },
  }), [theme]);

  return (
    <SafeAreaView style={themed.screen}>
      {/* 1. Header */}
      <View style={themed.header}>
        <View style={themed.headerRow}>
          <View style={themed.headerLeft}>
            <Text style={themed.greeting}>{greeting},</Text>
            <Text style={themed.name}>{displayName}</Text>
          </View>
          <View style={themed.headerRightIcons}>
            <Pressable onPress={() => navigation.navigate('Notifications')} style={themed.iconBtn}>
              <Ionicons name="notifications-outline" size={22} color={theme.colors.text} />
              <View style={themed.notificationDot} />
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Profile')} style={themed.avatar}>
<Image source={require('../../icons/icon.png')} style={themed.avatarImage} />            </Pressable>
          </View>
        </View>
        
        <View style={themed.tagsRow}>
          <View style={themed.pill}>
            <Ionicons name="flame" size={14} color={theme.colors.warn} />
            <Text style={themed.pillText}>{streakDays} day streak</Text>
          </View>
          {streakDays >= 3 && (
            <View style={themed.pill}>
              <Ionicons name="trophy" size={14} color={theme.colors.warn} />
              <Text style={themed.pillText}>{consistencyTitle}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 2. Week Strip */}
      <WeekStrip onDayPress={(date) => setSelectedDate(date)} selectedDate={selectedDate} />

      {/* 3. Main Nutrition Card */}
      <View style={themed.sectionGap}>
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
      </View>

      {/* 4. Steps */}
      <View style={themed.sectionGap}>
        <StepsCard steps={health.data?.steps ?? 0} onPress={() => {}} />
      </View>

      {/* 5. Water & Sleep (Pushed slightly down to fill bottom space) */}
      <View style={themed.sectionGap}>
        <WaterSleepRow
          waterMl={water}
          sleepMin={displaySleepMin}
          onAddWater={() => setWaterModalVisible(true)}
          onLogSleep={() => setSleepModalVisible(true)}
        />
      </View>

      {/* Modals & FAB */}
      <WaterModal visible={waterModalVisible} onClose={() => setWaterModalVisible(false)} onAdd={async (ml) => { if (user) await addWater(user.uid, ml); }} />
      <SleepModal visible={sleepModalVisible} onClose={() => setSleepModalVisible(false)} onSave={async (mins) => { if (user) await logManualSleep(user.uid, mins); }} />
      <DayDetailModal visible={selectedDate !== null} date={selectedDate} onClose={() => setSelectedDate(null)} />
      
      <Pressable onPress={() => setLogMenuVisible(true)} style={themed.logFab}>
        <Ionicons name="add" size={24} color={theme.colors.bg} />
      </Pressable>
      <LogCircleMenu visible={logMenuVisible} onClose={() => setLogMenuVisible(false)} />
    </SafeAreaView>
  );
}