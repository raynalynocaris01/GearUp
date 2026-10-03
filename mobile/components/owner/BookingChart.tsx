import { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polyline, Line, Text as SvgText } from 'react-native-svg';
import { colors } from '../../theme';

export type BookingChartData = {
  labels: string[];
  total: number[];
  confirmed: number[];
  pending: number[];
};

type Props = {
  data: BookingChartData | null;
  days?: number;
};

const CHART_HEIGHT = 160;
const PADDING_LEFT = 28;
const PADDING_RIGHT = 8;
const PADDING_TOP = 10;
const PADDING_BOTTOM = 22;

export function BookingChart({ data, days = 30 }: Props) {
  const screenWidth = Dimensions.get('window').width;
  // Container has 16px padding on each side, plus card padding 16px each side
  const chartWidth = screenWidth - 32 - 32;
  const innerWidth = chartWidth - PADDING_LEFT - PADDING_RIGHT;
  const innerHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const hasAnyData =
    !!data &&
    (data.total.some((v) => v > 0) ||
      data.confirmed.some((v) => v > 0) ||
      data.pending.some((v) => v > 0));

  const { points, maxValue, xLabels } = useMemo(() => {
    if (!data || data.labels.length === 0) {
      return { points: null, maxValue: 0, xLabels: [] as string[] };
    }

    const count = data.labels.length;
    const peak = Math.max(
      1,
      ...data.total,
      ...data.confirmed,
      ...data.pending,
    );

    const xAt = (i: number) => {
      if (count === 1) return PADDING_LEFT + innerWidth / 2;
      return PADDING_LEFT + (innerWidth * i) / (count - 1);
    };
    const yAt = (v: number) =>
      PADDING_TOP + innerHeight - (innerHeight * v) / peak;

    const toPoints = (values: number[]) =>
      values.map((v, i) => `${xAt(i)},${yAt(v)}`).join(' ');

    const labelIndexes = [0, Math.floor((count - 1) / 2), count - 1];
    const labels = labelIndexes.map((i) => data.labels[i]);

    return {
      points: {
        total: toPoints(data.total),
        confirmed: toPoints(data.confirmed),
        pending: toPoints(data.pending),
      },
      maxValue: peak,
      xLabels: labels,
    };
  }, [data, innerWidth, innerHeight]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Booking Overview</Text>
      <Text style={styles.subtitle}>
        Bookings created over the last {days} days
      </Text>

      {!hasAnyData || !points ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            No booking activity in this period yet.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.chartWrap}>
            <Svg width={chartWidth} height={CHART_HEIGHT}>
              {/* Horizontal gridlines */}
              {[0, 0.5, 1].map((frac) => {
                const y = PADDING_TOP + innerHeight * frac;
                return (
                  <Line
                    key={`grid-${frac}`}
                    x1={PADDING_LEFT}
                    y1={y}
                    x2={PADDING_LEFT + innerWidth}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth={1}
                  />
                );
              })}

              {/* Y-axis labels (max, mid, 0) */}
              <SvgText
                x={PADDING_LEFT - 6}
                y={PADDING_TOP + 4}
                fontSize={9}
                fill="#9ca3af"
                textAnchor="end"
              >
                {maxValue}
              </SvgText>
              <SvgText
                x={PADDING_LEFT - 6}
                y={PADDING_TOP + innerHeight / 2 + 4}
                fontSize={9}
                fill="#9ca3af"
                textAnchor="end"
              >
                {Math.round(maxValue / 2)}
              </SvgText>
              <SvgText
                x={PADDING_LEFT - 6}
                y={PADDING_TOP + innerHeight + 4}
                fontSize={9}
                fill="#9ca3af"
                textAnchor="end"
              >
                0
              </SvgText>

              {/* Series: pending (amber), confirmed (green), total (blue) */}
              <Polyline
                points={points.pending}
                fill="none"
                stroke="#d97706"
                strokeWidth={2}
              />
              <Polyline
                points={points.confirmed}
                fill="none"
                stroke="#16a34a"
                strokeWidth={2}
              />
              <Polyline
                points={points.total}
                fill="none"
                stroke="#2563eb"
                strokeWidth={2}
              />

              {/* X-axis labels: start, middle, end */}
              <SvgText
                x={PADDING_LEFT}
                y={CHART_HEIGHT - 6}
                fontSize={9}
                fill="#9ca3af"
                textAnchor="start"
              >
                {xLabels[0]}
              </SvgText>
              <SvgText
                x={PADDING_LEFT + innerWidth / 2}
                y={CHART_HEIGHT - 6}
                fontSize={9}
                fill="#9ca3af"
                textAnchor="middle"
              >
                {xLabels[1]}
              </SvgText>
              <SvgText
                x={PADDING_LEFT + innerWidth}
                y={CHART_HEIGHT - 6}
                fontSize={9}
                fill="#9ca3af"
                textAnchor="end"
              >
                {xLabels[2]}
              </SvgText>
            </Svg>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <LegendDot color="#2563eb" label="Total" />
            <LegendDot color="#16a34a" label="Confirmed" />
            <LegendDot color="#d97706" label="Pending" />
          </View>
        </>
      )}
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 24,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 12,
  },
  chartWrap: {
    alignItems: 'center',
  },
  emptyBox: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
  },
});