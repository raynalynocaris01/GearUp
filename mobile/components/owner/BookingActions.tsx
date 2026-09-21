import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { owner } from '../../lib/api';
import { colors } from '../../theme';

interface Props {
  bookingId: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  onSuccess?: () => void;
}

export function BookingActions({ bookingId, status, onSuccess }: Props) {
  const [loading, setLoading] = useState<
    'confirm' | 'cancel' | 'complete' | null
  >(null);

  const act = async (action: 'confirm' | 'cancel' | 'complete') => {
    setLoading(action);
    try {
      if (action === 'confirm') await owner.confirmBooking(bookingId);
      else if (action === 'cancel') await owner.cancelBooking(bookingId);
      else if (action === 'complete') await owner.completeBooking(bookingId);
      onSuccess?.();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message ?? 'Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const confirmCancel = () => {
    Alert.alert(
      'Cancel this booking?',
      'The customer will see the booking as cancelled.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel booking',
          style: 'destructive',
          onPress: () => act('cancel'),
        },
      ],
    );
  };

  const confirmComplete = () => {
    Alert.alert(
      'Mark as completed?',
      'Use this after the guest has checked out. This unlocks the review flow for the customer.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark completed',
          onPress: () => act('complete'),
        },
      ],
    );
  };

  if (status === 'cancelled') {
    return (
      <View style={[styles.pill, { backgroundColor: '#fee2e2' }]}>
        <Text style={[styles.pillText, { color: '#b91c1c' }]}>
          CANCELLED
        </Text>
      </View>
    );
  }

  if (status === 'completed') {
    return (
      <View style={[styles.pill, { backgroundColor: '#dbeafe' }]}>
        <Text style={[styles.pillText, { color: '#1e40af' }]}>
          COMPLETED
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {status === 'pending' && (
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => act('confirm')}
          disabled={loading !== null}
          activeOpacity={0.85}
        >
          {loading === 'confirm' ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.confirmText}>Confirm</Text>
          )}
        </TouchableOpacity>
      )}

      {status === 'confirmed' && (
        <TouchableOpacity
          style={styles.completeButton}
          onPress={confirmComplete}
          disabled={loading !== null}
          activeOpacity={0.85}
        >
          {loading === 'complete' ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.completeText}>Mark completed</Text>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={confirmCancel}
        disabled={loading !== null}
        activeOpacity={0.85}
      >
        {loading === 'cancel' ? (
          <ActivityIndicator color="#dc2626" size="small" />
        ) : (
          <Text style={styles.cancelText}>Cancel</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  confirmButton: {
    backgroundColor: colors.gearupGreen,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  confirmText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  completeButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  completeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  cancelText: { color: '#dc2626', fontSize: 12, fontWeight: '700' },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});