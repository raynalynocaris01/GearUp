import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface Props {
  status: BookingStatus;
  createdAt: string | null;
  confirmedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
}

function fmtShort(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return null;
  }
}

export function BookingStatusTracker({
  status,
  createdAt,
  confirmedAt,
  completedAt,
  cancelledAt,
}: Props) {
  // Cancelled is a distinct terminal state — no progress bar
  if (status === 'cancelled') {
    const cancelDate = fmtShort(cancelledAt);
    return (
      <View style={styles.cancelledCard}>
        <View style={styles.cancelledIconWrap}>
          <Ionicons name="close-circle-outline" size={20} color="#dc2626" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cancelledTitle}>Booking cancelled</Text>
          <Text style={styles.cancelledSub}>
            {cancelDate
              ? `Cancelled on ${cancelDate}`
              : 'This booking was cancelled.'}
          </Text>
        </View>
      </View>
    );
  }

  const stepReached: 1 | 2 | 3 =
    status === 'completed' ? 3 : status === 'confirmed' ? 2 : 1;

  const steps = [
    { key: 'placed', label: 'Placed', date: fmtShort(createdAt) },
    { key: 'confirmed', label: 'Confirmed', date: fmtShort(confirmedAt) },
    { key: 'completed', label: 'Completed', date: fmtShort(completedAt) },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Status</Text>

      <View style={styles.stepsRow}>
        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isDone = stepNum <= stepReached;
          const isCurrent = stepNum === stepReached;
          const isLast = idx === steps.length - 1;
          const nextIsDone = stepNum < stepReached;

          return (
            <View key={step.key} style={styles.stepCol}>
              {/* Connector line — right half */}
              {!isLast && (
                <View
                  style={[
                    styles.connector,
                    {
                      backgroundColor: nextIsDone
                        ? colors.gearupGreen
                        : '#e5e7eb',
                    },
                  ]}
                />
              )}

              {/* Circle */}
              <View
                style={[
                  styles.circle,
                  isDone ? styles.circleDone : styles.circleTodo,
                ]}
              >
                {isDone ? (
                  <Ionicons name="checkmark" size={18} color="#fff" />
                ) : (
                  <View style={styles.circleDot} />
                )}
              </View>

              {/* Label + date */}
              <Text
                style={[
                  styles.stepLabel,
                  isCurrent
                    ? styles.stepLabelCurrent
                    : isDone
                      ? styles.stepLabelDone
                      : styles.stepLabelTodo,
                ]}
              >
                {step.label}
              </Text>
              {step.date ? (
                <Text style={styles.stepDate}>{step.date}</Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 20,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 20,
  },

  stepsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepCol: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    top: 15,
    left: '50%',
    width: '100%',
    height: 2,
    zIndex: 0,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    zIndex: 1,
  },
  circleDone: {
    backgroundColor: colors.gearupGreen,
    borderColor: colors.gearupGreen,
  },
  circleTodo: {
    backgroundColor: '#fff',
    borderColor: '#d1d5db',
  },
  circleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
  },

  stepLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 8,
    textAlign: 'center',
  },
  stepLabelCurrent: { color: colors.gearupGreen },
  stepLabelDone: { color: '#111827' },
  stepLabelTodo: { color: '#9ca3af' },
  stepDate: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },

  cancelledCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cancelledIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelledTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7f1d1d',
  },
  cancelledSub: {
    fontSize: 12,
    color: '#991b1b',
    marginTop: 2,
  },
});