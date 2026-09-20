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
  status: 'pending' | 'confirmed' | 'cancelled';
  onSuccess?: () => void;
}

export function BookingActions({ bookingId, status, onSuccess }: Props) {
  const [loading, setLoading] = useState<'confirm' | 'cancel' | null>(null);

  const handleConfirm = async () => {
    setLoading('confirm');
    try {
      await owner.confirmBooking(bookingId);
      onSuccess?.();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message ?? 'Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel this booking?',
      'The customer will see the booking as cancelled.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel booking',
          style: 'destructive',
          onPress: async () => {
            setLoading('cancel');
            try {
              await owner.cancelBooking(bookingId);
              onSuccess?.();
            } catch (err: any) {
              Alert.alert(
                'Error',
                err.response?.data?.message ?? 'Please try again.',
              );
            } finally {
              setLoading(null);
            }
          },
        },
      ],
    );
  };

  if (status === 'cancelled') {
    return (
      <View style={styles.statusPill}>
        <Text style={styles.statusText}>CANCELLED</Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {status === 'pending' && (
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
          disabled={loading !== null}
        >
          {loading === 'confirm' ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.confirmText}>Confirm</Text>
          )}
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={handleCancel}
        disabled={loading !== null}
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
  row: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  confirmButton: {
    backgroundColor: colors.gearupGreen,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  confirmText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  cancelText: { color: '#dc2626', fontSize: 12, fontWeight: '700' },
  statusPill: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#b91c1c',
  },
});