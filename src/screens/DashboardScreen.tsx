import { useMemo, useState, useEffect, useRef } from 'react';
import { Image, StyleSheet, Text, View, Pressable, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg'; 
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { WeekStrip } from '../components/WeekStrip';
import { CaloriesMacrosCard } from '../components/CaloriesMacrosCard';
import { StepsCard } from '../components/StepsCard';
import { WaterSleepRow } from '../components/WaterSleepRow';
import { WaterModal } from '../components/WaterModal';
import { SleepModal } from '../components/SleepModal';
import { DayDetailModal } from '../components/DayDetailModal';
import { LogCircleMenu } from '../components/LogCircleMenu';
import { WinPopup } from '../components/WinPopup';
import { addWater } from '../services/waterLogs';
// CORRECT IMPORTS HERE
import { logManualSleep, addActivityEntry, updateManualActiveCalories, updateTotalAndNetKcal } from '../services/activityLogs';
import { refreshStreak } from '../services/streakService';
import { useHealthData } from '../hooks/useHealthData';
import { HealthConnectBanner } from '../components/HealthConnectBanner';
import { useTodayFoodLogs, useTodayWater, useTodaySleep, useUserDoc, useTodayActivity, useActivityHistory } from '../hooks/useRealtime';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme';
import type { RootTabParamList } from '../types/navigation';

type Navigation = BottomTabNavigationProp<RootTabParamList, 'Dashboard'>;

const formatSleep = (mins: number) => {
  if (!mins || mins <= 0) return '0h';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export default function DashboardScreen() {
  const theme = useTheme();
  const { user, profile } = useAuthStore();
  const navigation = useNavigation<Navigation>();
  const uid = user?.uid;

  const { totals } = useTodayFoodLogs(uid);
  const { ml: water } = useTodayWater(uid);
  const { activity: todayActivity } = useTodayActivity(uid);
  const { days: activityHistory } = useActivityHistory(uid);

  useUserDoc(uid);
  const hc = useHealthData(user);

  const [waterModalVisible, setWaterModalVisible] = useState(false);
  const [sleepModalVisible, setSleepModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [logMenuVisible, setLogMenuVisible] = useState(false);
  
  const [editBurnModalVisible, setEditBurnModalVisible] = useState(false);
  const [manualBurnInput, setManualBurnInput] = useState('');

  const [popup, setPopup] = useState({ visible: false, title: '', message: '', icon: 'trophy' as any });
  const showWin = (title: string, message: string, icon: any) => setPopup({ visible: true, title, message, icon });
  const celebratedGoals = useRef<Record<string, boolean>>({});
  
  const targets = profile?.targets;
  const calories = targets?.calories ?? 0;
  const displayName = profile?.displayName ?? 'there';
  const streakDays = profile?.streakDays ?? 0;
  const isMale = profile?.profile?.gender === 'male';
  const consistencyTitle = isMale ? 'Mr. Consistent' : 'Ms. Consistent';

  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Good night';

  const manualSleepMin = useTodaySleep(uid);
  const displaySleepMin = manualSleepMin > 0 ? manualSleepMin : (hc.data?.sleepMinutes ?? 0);
  const displaySteps = todayActivity?.steps ?? hc.data?.steps ?? 0;

  const weight = profile?.profile?.weightKg ?? 0;
  const height = profile?.profile?.heightCm ?? 0;
  const age = profile?.profile?.age ?? 0;
  const gender = profile?.profile?.gender ?? 'male';
  
  let bmr = 0;
  if (weight > 0 && height > 0 && age > 0) {
    const base = 10 * weight + 6.25 * height - 5 * age;
    bmr = gender === 'male' ? base + 5 : base - 161;
  }

  const displayActiveBurned = todayActivity?.activeKcal ?? hc.data?.caloriesBurned ?? 0;
  const displayExtraBurned = todayActivity?.extraKcal ?? 0;
  
  const totalBurned = displayActiveBurned + displayExtraBurned + bmr;

  const { historicalDeficit, totalFatKg } = useMemo(() => {
    let deficit = 0;
    activityHistory.forEach((d) => {
      if (typeof d.netCalories === 'number') {
        deficit += d.netCalories;
      }
    });
    const fatKg = Math.abs(deficit) / 7.7 / 1000;
    return { historicalDeficit: deficit, totalFatKg: fatKg };
  }, [activityHistory]);

  const hcDataString = hc.data ? JSON.stringify(hc.data) : '';

  // FIXED: Calls updateTotalAndNetKcal
  useEffect(() => {
    if (uid && totals) {
      const net = totals.calories - totalBurned;
      void updateTotalAndNetKcal(uid, totalBurned, net).catch(console.error);
    }
  }, [uid, totals?.calories, totalBurned]);

  useEffect(() => {
    if (uid) {
      void refreshStreak(uid).catch((e) => console.error('[Dashboard] Streak update failed', e));
    }
  }, [uid, totals?.calories]); 

  useEffect(() => {
    if (uid && hc.status === 'granted' && hc.data) {
      void addActivityEntry(uid, {
        steps: hc.data.steps || 0,
        activeKcal: hc.data.caloriesBurned || 0,
        distanceKm: hc.data.distanceKm || 0,
      }).catch(console.error);
    }
  }, [uid, hc.status, hcDataString]);

  useEffect(() => {
    if (!targets || !totals) return;

    if (totals.calories >= targets.calories && targets.calories > 0 && !celebratedGoals.current.calories) {
      celebratedGoals.current.calories = true;
      showWin('Calorie Goal Reached! 🔥', "You hit your daily calorie target. Fueling your body right!", 'flame');
      return; 
    }
    if (totals.protein >= targets.protein && targets.protein > 0 && !celebratedGoals.current.protein) {
      celebratedGoals.current.protein = true;
      showWin('Protein Goal Crushed! 🥩', "Great job hitting your protein target. Muscle recovery initiated!", 'barbell');
      return;
    }
    if (totals.carbs >= targets.carbs && targets.carbs > 0 && !celebratedGoals.current.carbs) {
      celebratedGoals.current.carbs = true;
      showWin('Carbs Goal Hit! 🍞', "Energy levels topped up. You're ready to crush your workout!", 'flash');
      return;
    }
    if (totals.fat >= targets.fat && targets.fat > 0 && !celebratedGoals.current.fat) {
      celebratedGoals.current.fat = true;
      showWin('Fat Goal Reached! 🥑', "Healthy fats are essential. You nailed your target!", 'leaf');
    }
  }, [totals, targets]);

  const handleAddWater = async (ml: number) => {
    if (!user) return;
    await addWater(user.uid, ml);
    const newWaterTotal = water + ml;
    
    if (newWaterTotal >= 2500 && water < 2500) {
      showWin('Hydration Hero! 💧', "You crushed your water goal today. Your body thanks you!", 'water');
    } else {
      showWin('Nice!', `${ml}ml logged. Keep sipping!`, 'water');
    }
  };

  const handleLogSleep = async (mins: number) => {
    if (!user) return;
    const validMins = Number(mins);
    if (isNaN(validMins) || validMins <= 0) return;
    
    await logManualSleep(user.uid, validMins);
    showWin('Rest & Recover 😴', `Added ${formatSleep(validMins)} to your sleep. Recovery is where the magic happens!`, 'moon');
  };

  const handleSaveManualBurn = async () => {
    if (!uid) return;
    const kcal = Number(manualBurnInput) || 0;
    // FIXED: Calls updateManualActiveCalories with just extraKcal
    await updateManualActiveCalories(uid, kcal); 
    setEditBurnModalVisible(false);
    setManualBurnInput('');
  };

  const themed = useMemo(() => StyleSheet.create({
    screen: { backgroundColor: theme.colors.bg, flex: 1, paddingHorizontal: 16, paddingTop: 12 },
    headerCard: { marginBottom: 8, marginTop: 4, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
    headerGradientContainer: { padding: 16, backgroundColor: '#1E1B18' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerLeft: { flex: 1, zIndex: 2 },
    greeting: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    name: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginTop: 2 }, 
    headerRightIcons: { flexDirection: 'row', alignItems: 'center', gap: 12, zIndex: 2 },
    iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }, 
    notificationDot: { position: 'absolute', top: 9, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.danger, borderWidth: 1.5, borderColor: '#1E1B18' },
    avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },
    avatarImage: { height: '100%', resizeMode: 'cover', width: '100%' },
    tagsRow: { flexDirection: 'row', gap: 8, marginTop: 10, zIndex: 2 }, 
    pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, gap: 5 }, 
    pillText: { fontSize: 11, fontWeight: '600', color: '#FFFFFF' },
    weekStripWrapper: { marginVertical: 6 }, 
    sectionGap: { marginTop: 6 }, 
    logFab: { alignItems: 'center', backgroundColor: theme.colors.accent, borderColor: theme.colors.bg, borderRadius: 26, borderWidth: 3, height: 52, justifyContent: 'center', position: 'absolute', right: 16, bottom: 24, width: 52, zIndex: 100 },
  }), [theme]);

  return (
    <SafeAreaView style={themed.screen}>
      
      <View style={themed.headerCard}>
        <View style={themed.headerGradientContainer}>
          <Svg style={StyleSheet.absoluteFillObject}>
            <Defs>
              <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#26221F" />
                <Stop offset="1" stopColor="#0F0D0C" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
          </Svg>

          <View style={themed.headerRow}>
            <View style={themed.headerLeft}>
              <Text style={themed.greeting}>{greeting},</Text>
              <Text style={themed.name}>{displayName}</Text>
            </View>
            <View style={themed.headerRightIcons}>
              <Pressable onPress={() => navigation.navigate('Notifications')} style={themed.iconBtn}>
                <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
                <View style={themed.notificationDot} />
              </Pressable>
              <Pressable onPress={() => navigation.navigate('Profile')} style={themed.avatar}>
                <Image source={require('../../icons/icon.png')} style={themed.avatarImage} />
              </Pressable>
            </View>
          </View>
          
          <View style={themed.tagsRow}>
            <View style={themed.pill}>
              <Ionicons name="flame" size={14} color="#FF5722" />
              <Text style={themed.pillText}>{streakDays} day streak</Text>
            </View>
            {streakDays >= 3 && (
              <View style={themed.pill}>
                <Ionicons name="trophy" size={14} color="#FFD700" />
                <Text style={themed.pillText}>{consistencyTitle}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={themed.weekStripWrapper}>
        <WeekStrip onDayPress={(date) => setSelectedDate(date)} selectedDate={selectedDate} />
      </View>

      <HealthConnectBanner
        status={hc.status}
        loading={hc.loading}
        lastError={hc.lastError}
        onRequest={() => void hc.requestPermissions()}
      />
      
      <View style={themed.sectionGap}>
        <CaloriesMacrosCard
          eaten={totals?.calories ?? 0}
          target={Math.max(1, calories)}
          activeBurned={displayActiveBurned} 
          extraBurned={displayExtraBurned} 
          bmr={bmr}                          
          protein={totals?.protein ?? 0}
          proteinTarget={Math.max(1, targets?.protein ?? 0)}
          carbs={totals?.carbs ?? 0}
          carbsTarget={Math.max(1, targets?.carbs ?? 0)}
          fat={totals?.fat ?? 0}
          fatTarget={Math.max(1, targets?.fat ?? 0)}
          onEditBurn={() => {
            setManualBurnInput(String(Math.round(displayExtraBurned)));
            setEditBurnModalVisible(true);
          }}
          totalFatKg={totalFatKg}
          historicalDeficit={historicalDeficit}
        />
      </View>

      <View style={themed.sectionGap}>
         <StepsCard steps={displaySteps} onPress={() => {}} />
      </View>

      <View style={themed.sectionGap}>
        <WaterSleepRow
          waterMl={water ?? 0}
          sleepMin={displaySleepMin ?? 0}
          onAddWater={() => setWaterModalVisible(true)}
          onLogSleep={() => setSleepModalVisible(true)}
        />
      </View>

      <WaterModal visible={waterModalVisible} onClose={() => setWaterModalVisible(false)} onAdd={handleAddWater} />
      <SleepModal visible={sleepModalVisible} onClose={() => setSleepModalVisible(false)} onSave={handleLogSleep} />
      <DayDetailModal visible={selectedDate !== null} date={selectedDate} onClose={() => setSelectedDate(null)} />
      
      <Pressable onPress={() => setLogMenuVisible(true)} style={themed.logFab}>
        <Ionicons name="add" size={24} color={theme.colors.bg} />
      </Pressable>
      <LogCircleMenu visible={logMenuVisible} onClose={() => setLogMenuVisible(false)} />

      <WinPopup
        visible={popup.visible}
        title={popup.title}
        message={popup.message}
        icon={popup.icon}
        onClose={() => setPopup(p => ({ ...p, visible: false }))}
      />

      <Modal visible={editBurnModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.colors.surface, borderRadius: 20, padding: 20 }}>
            
            <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Add Extra Burn</Text>
            <Text style={{ color: theme.colors.muted, fontSize: 12, marginBottom: 16 }}>Add calories burned from workouts or gym. This is added on top of your daily steps and resting burn.</Text>
            
            <TextInput
              style={{ backgroundColor: theme.colors.surfaceHi, color: theme.colors.text, fontSize: 24, fontWeight: '700', textAlign: 'center', padding: 16, borderRadius: 12, marginBottom: 20 }}
              keyboardType="numeric"
              value={manualBurnInput}
              onChangeText={setManualBurnInput}
              placeholder="0"
              placeholderTextColor={theme.colors.muted}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: theme.colors.surfaceHi, alignItems: 'center' }} onPress={() => setEditBurnModalVisible(false)}>
                <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Cancel</Text>
              </Pressable>
              
              <Pressable style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: theme.colors.danger + '20', alignItems: 'center' }} onPress={() => { setManualBurnInput('0'); handleSaveManualBurn(); }}>
                <Text style={{ color: theme.colors.danger, fontWeight: '700' }}>Reset</Text>
              </Pressable>

              <Pressable style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: theme.colors.success, alignItems: 'center' }} onPress={handleSaveManualBurn}>
                <Text style={{ color: theme.colors.bg, fontWeight: '700' }}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}