import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface Props {
  eaten: number;
  target: number;
  activeBurned: number;
  extraBurned: number;
  bmr: number;
  protein: number;
  proteinTarget: number;
  carbs: number;
  carbsTarget: number;
  fat: number;
  fatTarget: number;
  onEditBurn?: () => void;
  // NEW PROPS ADDED HERE
  totalFatKg: number;
  historicalDeficit: number;
}

const SIZE = 130;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = Math.PI * 2 * RADIUS;

function MacroRow({ color, icon, label, value, target }: { color: string; icon: keyof typeof Ionicons.glyphMap; label: string; value: number; target: number; }) {
  const theme = useTheme();
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  const safeValue = Number.isFinite(value) ? value.toFixed(1) : '0.0';

  return (
    <View style={{ gap: 6 }}>
      <View style={styles.macroTop}>
        <View style={[styles.iconCircle, { backgroundColor: color + '2E' }]}>
          <Ionicons name={icon} size={14} color={color} />
        </View>
        <Text style={[styles.macroLabel, { color: theme.colors.text }]}>{label}</Text>
        <View style={{ flex: 1 }} />
        <Text style={[styles.macroValue, { color: theme.colors.text }]}>
          {safeValue}g<Text style={[styles.macroValueMuted, { color: theme.colors.muted }]}>{' / '}{target}g</Text>
        </Text>
      </View>
      <View style={[styles.barTrack, { backgroundColor: theme.colors.border }]}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function CaloriesMacrosCard({ 
  eaten, 
  target, 
  activeBurned, 
  extraBurned, 
  bmr, 
  protein, 
  proteinTarget, 
  carbs, 
  carbsTarget, 
  fat, 
  fatTarget, 
  onEditBurn, 
  totalFatKg, 
  historicalDeficit 
}: Props) {
  const theme = useTheme();
  
  const safeEaten = Number(eaten) || 0;
  const safeTarget = Number(target) || 0;
  const safeActive = Number(activeBurned) || 0;
  const safeExtra = Number(extraBurned) || 0;
  const safeBmr = Number(bmr) || 0;

  const pct = safeTarget > 0 ? Math.min(100, (safeEaten / safeTarget) * 100) : 0;
  const dashOffset = CIRCUMFERENCE * (1 - pct / 100);
  const remaining = Math.max(0, safeTarget - safeEaten);
  
  const totalBurned = safeActive + safeExtra + safeBmr;
  
  // EXACT MATH: Intake - Total Burned = Net Calories
  const isDeficit = historicalDeficit < 0;
  const safeFatKg = Number(totalFatKg) || 0;

  const themed = useMemo(() => StyleSheet.create({
    card: { backgroundColor: theme.colors.surface, marginTop: 8, borderRadius: 20, padding: 12 },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    ringCol: { alignItems: 'center' },
    rightCol: { flex: 1, gap: 8, marginLeft: 2 },
    statCard: { borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
    statIconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    statTextCol: { flex: 1 },
    statLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    statLabel: { fontSize: 10, fontWeight: '600', color: theme.colors.muted },
    statValue: { fontSize: 14, fontWeight: '700', marginTop: 1 },
    statSubLabel: { fontSize: 8, fontWeight: '600', marginTop: 1, opacity: 0.8 },
    centerEaten: { color: theme.colors.text, fontSize: 22, fontWeight: '800' },
    centerTarget: { color: theme.colors.muted, fontSize: 10, marginTop: 1 },
    macrosWrap: { marginTop: 14, gap: 10 },
    addBtn: { backgroundColor: theme.colors.success + '25', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    addBtnText: { fontSize: 10, fontWeight: '800', color: theme.colors.success },
    
    fatFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
    fatLabel: { fontSize: 12, color: theme.colors.text, fontWeight: '700' },
    fatSub: { fontSize: 10, color: theme.colors.muted, fontWeight: '500', marginTop: 2 },
    fatValue: { fontSize: 16, fontWeight: '800' },
  }), [theme]);

  return (
    <View style={themed.card}>
      <View style={themed.topRow}>
        <View style={themed.ringCol}>
          <View style={styles.ringBox}>
            <Svg width={SIZE} height={SIZE}>
              <Defs>
                <LinearGradient id="calGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#FF512F" />
                  <Stop offset="1" stopColor="#F09819" />
                </LinearGradient>
              </Defs>
              <Circle cx={SIZE/2} cy={SIZE/2} r={RADIUS} stroke={theme.colors.border} strokeWidth={STROKE} fill="none" opacity={0.5} />
              <Circle cx={SIZE/2} cy={SIZE/2} r={RADIUS} stroke="url(#calGrad)" strokeWidth={STROKE} strokeLinecap="round" fill="none" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={dashOffset} rotation="-90" origin={`${SIZE/2}, ${SIZE/2}`} />
            </Svg>
            <View style={styles.centerOverlay}>
              <Ionicons name="flame" size={18} color="#F09819" style={{ marginBottom: 1 }} />
              <Text style={themed.centerEaten}>{Math.round(safeEaten)}</Text>
              <Text style={themed.centerTarget}>of {safeTarget}</Text>
            </View>
          </View>
        </View>

        <View style={themed.rightCol}>
          <View style={[themed.statCard, { backgroundColor: theme.colors.success + '15' }]}>
            <View style={[themed.statIconWrap, { backgroundColor: theme.colors.success + '25' }]}>
              <Ionicons name="flash" size={16} color={theme.colors.success} />
            </View>
            <View style={themed.statTextCol}>
              <View style={themed.statLabelRow}>
                <Text style={themed.statLabel}>Total Burned</Text>
                {onEditBurn && (
                  <Pressable onPress={onEditBurn} hitSlop={8} style={themed.addBtn}>
                    <Text style={themed.addBtnText}>+ Add</Text>
                  </Pressable>
                )}
              </View>
              <Text style={[themed.statValue, { color: theme.colors.success }]}>{Math.round(totalBurned)} kcal</Text>
              <Text style={[themed.statSubLabel, { color: theme.colors.success }]}>
                ({Math.round(safeActive)} act + {Math.round(safeExtra)} extra + {Math.round(safeBmr)} rest)
              </Text>
            </View>
          </View>

          <View style={[themed.statCard, { backgroundColor: theme.colors.accent + '15' }]}>
            <View style={[themed.statIconWrap, { backgroundColor: theme.colors.accent + '25' }]}>
              <Ionicons name="locate" size={16} color={theme.colors.accent} />
            </View>
            <View style={themed.statTextCol}>
              <Text style={themed.statLabel}>Remaining</Text>
              <Text style={[themed.statValue, { color: theme.colors.text }]}>{remaining} kcal</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={themed.macrosWrap}>
        <MacroRow color={theme.colors.protein} icon="barbell-outline" label="Protein" value={protein} target={proteinTarget} />
        <MacroRow color={theme.colors.carbs} icon="leaf-outline" label="Carbs" value={carbs} target={carbsTarget} />
        <MacroRow color={theme.colors.fat} icon="water-outline" label="Fat" value={fat} target={fatTarget} />
      </View>

      {/* HISTORICAL FAT ESTIMATE FOOTER */}
      <View style={themed.fatFooter}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[styles.iconCircle, { backgroundColor: isDeficit ? theme.colors.success + '20' : theme.colors.danger + '20' }]}>
            <Ionicons name={isDeficit ? "trending-down" : "trending-up"} size={16} color={isDeficit ? theme.colors.success : theme.colors.danger} />
          </View>
          <View>
            <Text style={themed.fatLabel}>Est. Total Fat {isDeficit ? 'Burned' : 'Gained'}</Text>
            <Text style={themed.fatSub}>
              {Math.abs(historicalDeficit).toLocaleString()} kcal {isDeficit ? 'deficit' : 'surplus'}
            </Text>
          </View>
        </View>
        <Text style={[themed.fatValue, { color: isDeficit ? theme.colors.success : theme.colors.danger }]}>
          {safeFatKg.toFixed(2)} kg
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ringBox: { position: 'relative', width: SIZE, height: SIZE },
  centerOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  macroTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  macroLabel: { fontSize: 13, fontWeight: '500' },
  macroValue: { fontSize: 12, fontWeight: '700' },
  macroValueMuted: { fontSize: 12, fontWeight: '500' },
  barTrack: { height: 5, borderRadius: 2.5, overflow: 'hidden' },
  barFill: { height: 5, borderRadius: 2.5 },
});