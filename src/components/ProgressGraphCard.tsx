import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarChart, Grid, YAxis } from 'react-native-svg-charts';
import type { ChartChildProps } from 'react-native-svg-charts';
import { G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../theme';

export interface GraphPoint {
  label: string;
  value: number;
}

export interface ProgressGraphCardProps {
  title: string;
  icon: string; // emoji or short text, e.g. '👟'
  data: GraphPoint[];
  goal: number;
  unit: string;
  color?: string; // defaults to theme.colors.accent
}

const chartHeight = 150;
const yAxisWidth = 38;

export function ProgressGraphCard({
  title,
  icon,
  data,
  goal,
  unit,
  color,
}: ProgressGraphCardProps) {
  const theme = useTheme();
  const accentColor = color ?? theme.colors.accent;

  if (data.length === 0) {
    return (
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          </View>
        </View>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.colors.muted }]}>
            No data yet — connect Health Connect or log manually.
          </Text>
        </View>
        <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
          <Text style={[styles.footerLeft, { color: theme.colors.text }]}>
            Goal: {goal} {unit}
          </Text>
          <Text style={[styles.footerRight, { color: theme.colors.muted }]}>Avg: 0 {unit}</Text>
        </View>
      </View>
    );
  }

  const values = data.map((d) => d.value);
  const daysMetGoal = data.filter((d) => d.value >= goal).length;
  const consistencyScore = data.length === 0 ? 0 : Math.round((daysMetGoal / data.length) * 100);
  const average = values.length === 0 ? 0 : values.reduce((sum, v) => sum + v, 0) / values.length;
  const roundedAverage = Math.round(average * 10) / 10;

  const domainMax = Math.max(...values, goal, 1);
  const contentInset = { top: 20, bottom: 20 };

  const labelStep = Math.ceil(data.length / 7);

  const RoundedBars = (props: ChartChildProps) => {
    const { data: chartData, x, y, bandwidth } = props;

    if (!chartData || !x || !y || bandwidth === undefined) {
      return null;
    }

    return (
      <G>
        {chartData.map((value, index) => {
          const barX = x(index);
          const barY = y(value);
          const zeroY = y(0);
          const barHeight = Math.max(0, zeroY - barY);
          const barWidth = Math.max(2, bandwidth - 4);
          const barXInset = barX + 2;

          return (
            <Rect
              key={index}
              x={barXInset}
              y={barY}
              width={barWidth}
              height={barHeight}
              rx={4}
              fill={accentColor}
            />
          );
        })}
      </G>
    );
  };

  const GoalLine = (props: ChartChildProps) => {
    const { x, y, width: chartWidth } = props;

    if (!x || !y || chartWidth === undefined || goal <= 0) {
      return null;
    }

    const goalY = y(goal);
    const zeroY = y(0);
    const domainMin = 0;

    if (goal > domainMax || goal < domainMin) {
      return null;
    }

    return (
      <Line
        x1={x(0)}
        y1={goalY}
        x2={chartWidth}
        y2={goalY}
        stroke={theme.colors.danger}
        strokeWidth={2}
        strokeDasharray="4 4"
      />
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: theme.colors.surfaceHi }]}>
          <Text style={[styles.scoreText, { color: accentColor }]}>
            {consistencyScore}% Consistent
          </Text>
        </View>
      </View>

      <View style={styles.chartRow}>
        <View style={styles.yAxisContainer}>
          <YAxis
            data={values}
            style={styles.yAxis}
            svg={{ fill: theme.colors.muted, fontSize: 10 }}
            contentInset={contentInset}
            numberOfTicks={4}
            formatLabel={(v) => String(Math.round(v))}
            min={0}
            max={domainMax}
          />
        </View>
        <View style={styles.chartContainer}>
          <BarChart
            data={values}
            style={styles.chart}
            svg={{ fill: 'transparent' }}
            contentInset={contentInset}
            numberOfTicks={4}
            yMin={0}
            yMax={domainMax}
            gridMin={0}
            gridMax={domainMax}
            spacingInner={0.3}
            spacingOuter={0.2}
          >
            <Grid svg={{ stroke: theme.colors.border, strokeWidth: 1 }} />
            <RoundedBars />
            <GoalLine />
          </BarChart>
        </View>
      </View>

      <View style={styles.xAxisLabels}>
        {data.map((point, index) => {
          if (index % labelStep !== 0 && index !== data.length - 1 && data.length > 7) {
            return null;
          }
          return (
            <Text
              key={index}
              style={[styles.xAxisLabel, { color: theme.colors.muted }]}
              numberOfLines={1}
            >
              {point.label}
            </Text>
          );
        })}
      </View>

      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <Text style={[styles.footerLeft, { color: theme.colors.text }]}>
          Goal: {goal} {unit}
        </Text>
        <Text style={[styles.footerRight, { color: theme.colors.muted }]}>
          Avg: {roundedAverage} {unit}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartRow: {
    flexDirection: 'row',
    height: chartHeight,
  },
  yAxisContainer: {
    width: yAxisWidth,
    height: chartHeight,
    marginRight: 4,
  },
  yAxis: {
    flex: 1,
  },
  chartContainer: {
    flex: 1,
    height: chartHeight,
    marginLeft: 4,
  },
  chart: {
    flex: 1,
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  xAxisLabel: {
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerLeft: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  footerRight: {
    fontSize: 13,
    color: '#8A8A94',
  },
  emptyState: {
    height: chartHeight,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
