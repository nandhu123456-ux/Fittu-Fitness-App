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
  
  // 5 glasses, 1 glass = 500ml
  const glasses = Math.min(5, Math.round(waterMl / 500));

  const themed = useMemo(() => StyleSheet.create({
    row: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 12 },
    card: { flex: 0.6, borderRadius: 24, paddingVertical: 6, paddingHorizontal: 10, overflow: 'hidden', borderWidth: 1 },
    
    // WATER CARD STYLING (Dark Teal with Water Ripple Watermark)
    waterCard: { backgroundColor: '#0A141B', borderColor: '#1B3A4A' },
    waterBgIcon: { position: 'absolute', bottom: -20, right: -20, opacity: 0.05 },
    
    // SLEEP CARD STYLING (Dark Purple with Moon Watermark)
    sleepCard: { backgroundColor: '#120C1C', borderColor: '#2B1B42' },
    sleepBgIcon: { position: 'absolute', top: -10, right: -10, opacity: 0.05 },

    iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    label: { fontSize: 13, color: theme.colors.muted, fontWeight: '500' },
    value: { fontSize: 20, fontWeight: '700', color: theme.colors.text, marginTop: 2 },
    unit: { fontSize: 12, color: theme.colors.muted, fontWeight: '500' },
    
    // WATER GLASSES ROW
    glassesRow: { flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 16, alignItems: 'flex-end' },
    
    // BUTTONS
    btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
    waterBtn: { borderColor: theme.colors.water + '60' },
    sleepBtn: { borderColor: theme.colors.info + '60' },
    btnText: { fontSize: 13, fontWeight: '600' },
    
    // SLEEP TIMELINE
    timelineWrap: { marginTop: 20, marginBottom: 20 },
    timelineBar: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 8, overflow: 'hidden' },
    timelineFill: { height: 6, borderRadius: 3, backgroundColor: theme.colors.info, width: '75%' },
    timelineLabels: { flexDirection: 'row', justifyContent: 'space-between' },
    timelineText: { fontSize: 9, color: theme.colors.muted },
  }), [theme]);

  return (
    <View style={themed.row}>
      {/* WATER CARD */}
      <View style={[themed.card, themed.waterCard]}>
        <Ionicons name="water" size={140} color={theme.colors.water} style={themed.waterBgIcon} />
        
<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <View style={[themed.iconWrap, { marginBottom: 0, backgroundColor: theme.colors.water + '20' }]}>
            <Ionicons name="water" size={20} color={theme.colors.water} />
          </View>
          <View>
            <Text style={themed.label}>Water Intake</Text>
            <Text style={themed.value}>{waterL} L <Text style={themed.unit}>/ 2.5 L</Text></Text>
          </View>
        </View>
        
        <View style={themed.glassesRow}>
          {/* Using MaterialCommunityIcons for actual glass shapes */}
          {[1, 2, 3, 4, 5].map((i) => (
            i <= glasses ? (
              <MaterialCommunityIcons key={i} name="cup-water" size={22} color={theme.colors.water} />
            ) : (
              <MaterialCommunityIcons key={i} name="cup-outline" size={22} color={theme.colors.border} />
            )
          ))}
        </View>

        <Pressable onPress={onAddWater} style={[themed.btn, themed.waterBtn]}>
          <Ionicons name="add" size={16} color={theme.colors.water} />
          <Text style={[themed.btnText, { color: theme.colors.water }]}>Add Water</Text>
        </Pressable>
      </View>

      {/* SLEEP CARD */}
      <View style={[themed.card, themed.sleepCard]}>
        <Ionicons name="moon" size={140} color={theme.colors.info} style={themed.sleepBgIcon} />

<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <View style={[themed.iconWrap, { marginBottom: 0, backgroundColor: theme.colors.info + '20' }]}>
            <Ionicons name="moon" size={20} color={theme.colors.info} />
          </View>
          <View>
            <Text style={themed.label}>Sleep Duration</Text>
            <Text style={themed.value}>{sleepStr} <Text style={themed.unit}>/ 8h</Text></Text>
          </View>
        </View>
        
        <View style={themed.timelineWrap}>
          <View style={themed.timelineBar}>
            <View style={themed.timelineFill} />
          </View>
          <View style={themed.timelineLabels}>
            <Text style={themed.timelineText}>10 PM</Text>
            <Text style={themed.timelineText}>2 AM</Text>
            <Text style={themed.timelineText}>6 AM</Text>
          </View>
        </View>

        <Pressable onPress={onLogSleep} style={[themed.btn, themed.sleepBtn]}>
          <Ionicons name="add" size={16} color={theme.colors.info} />
          <Text style={[themed.btnText, { color: theme.colors.info }]}>Log Sleep</Text>
        </Pressable>
      </View>
    </View>
  );
}