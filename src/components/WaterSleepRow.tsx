import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface Props {
  waterMl: number;
  sleepMin: number;
  onAddWater: () => void;
  onLogSleep: () => void;
}

export function WaterSleepRow({ waterMl, sleepMin, onAddWater, onLogSleep }: Props) {
  const theme = useTheme();
  
  const waterL = (waterMl / 1000).toFixed(1);
  const sleepStr = sleepMin > 0 ? `${Math.floor(sleepMin / 60)}h ${Math.round(sleepMin % 60)}m` : '—';
  
  const glasses = Math.min(5, Math.round(waterMl / 500));

  const SLEEP_TARGET_MIN = 420; // 7 hours
  const sleepPct = Math.min(1, sleepMin / SLEEP_TARGET_MIN);
  const sleepGood = sleepMin >= SLEEP_TARGET_MIN;

  const themed = useMemo(() => StyleSheet.create({
    row: { flexDirection: 'row', gap: 10, marginTop: 10 },
    // Reduced padding and set flex: 1 so they split the row evenly
    card: { flex: 1, borderRadius: 16, padding: 12, overflow: 'hidden', borderWidth: 1 },
    
    waterCard: { backgroundColor: '#0A141B', borderColor: '#1B3A4A' },
    waterBgIcon: { position: 'absolute', bottom: -20, right: -20, opacity: 0.05 },
    
    sleepCard: { backgroundColor: '#120C1C', borderColor: '#2B1B42' },
    sleepBgIcon: { position: 'absolute', top: -10, right: -10, opacity: 0.05 },

    // Smaller icon for the header
    iconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    label: { fontSize: 11, color: theme.colors.muted, fontWeight: '500' },
    value: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginTop: 1 },
    unit: { fontSize: 10, color: theme.colors.muted, fontWeight: '500' },
    
    // Tighter margins for glasses
    glassesRow: { flexDirection: 'row', gap: 4, marginTop: 8, marginBottom: 12, alignItems: 'center' },
    
    // Shorter buttons
    btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
    waterBtn: { borderColor: theme.colors.water + '60' },
    sleepBtn: { borderColor: theme.colors.info + '60' },
    btnText: { fontSize: 12, fontWeight: '600' },
    
    // Tighter timeline
    timelineWrap: { marginTop: 8, marginBottom: 12 },
    timelineBar: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 6, overflow: 'hidden' },
    timelineFill: { height: 4, borderRadius: 2, backgroundColor: theme.colors.info },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusText: { fontSize: 10, fontWeight: '500', color: theme.colors.muted },
    statusGood: { fontSize: 10, fontWeight: '700', color: theme.colors.success },
  }), [theme]);

  return (
    <View style={themed.row}>
      {/* WATER CARD */}
      <View style={[themed.card, themed.waterCard]}>
        <Ionicons name="water" size={100} color={theme.colors.water} style={themed.waterBgIcon} />
        
        {/* Header Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[themed.iconWrap, { backgroundColor: theme.colors.water + '20' }]}>
            <Ionicons name="water" size={16} color={theme.colors.water} />
          </View>
          <View>
            <Text style={themed.label}>Water Intake</Text>
            <Text style={themed.value}>{waterL} L <Text style={themed.unit}>/ 2.5 L</Text></Text>
          </View>
        </View>
        
        {/* Glasses Row */}
        <View style={themed.glassesRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            i <= glasses ? (
              <MaterialCommunityIcons key={i} name="cup-water" size={18} color={theme.colors.water} />
            ) : (
              <MaterialCommunityIcons key={i} name="cup-outline" size={18} color={theme.colors.border} />
            )
          ))}
        </View>

        <Pressable onPress={onAddWater} style={[themed.btn, themed.waterBtn]}>
          <Ionicons name="add" size={14} color={theme.colors.water} />
          <Text style={[themed.btnText, { color: theme.colors.water }]}>Add Water</Text>
        </Pressable>
      </View>

      {/* SLEEP CARD */}
      <View style={[themed.card, themed.sleepCard]}>
        <Ionicons name="moon" size={100} color={theme.colors.info} style={themed.sleepBgIcon} />

        {/* Header Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[themed.iconWrap, { backgroundColor: theme.colors.info + '20' }]}>
            <Ionicons name="moon" size={16} color={theme.colors.info} />
          </View>
          <View>
            <Text style={themed.label}>Sleep Duration</Text>
            <Text style={themed.value}>{sleepStr} <Text style={themed.unit}>/ 8h</Text></Text>
          </View>
        </View>
        
        {/* Timeline Row */}
        <View style={themed.timelineWrap}>
          <View style={themed.timelineBar}>
            <View style={[themed.timelineFill, { width: `${Math.round(sleepPct * 100)}%` }]} />
          </View>
          <View style={themed.statusRow}>
            <Text style={themed.statusText}>{sleepMin > 0 ? `${sleepMin} min` : 'No data'}</Text>
            {sleepGood ? <Text style={themed.statusGood}>✓ Good sleep</Text> : null}
          </View>
        </View>

        <Pressable onPress={onLogSleep} style={[themed.btn, themed.sleepBtn]}>
          <Ionicons name="add" size={14} color={theme.colors.info} />
          <Text style={[themed.btnText, { color: theme.colors.info }]}>Log Sleep</Text>
        </Pressable>
      </View>
    </View>
  );
}