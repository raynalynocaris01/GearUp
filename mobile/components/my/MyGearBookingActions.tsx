import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { myGear } from '../../lib/api';

interface Props {
  bookingId: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  onChanged: () => void;
}

export function MyGearBookingActions({ bookingId, status, onChanged }: Props) {
  const [loading, setLoading] = useState<
    'confirm' | 'cancel' | 'complete' | null
  >(null);

  const act = async (action: 'confirm' | 'cancel' | 'complete') => {
    setLoading(action);
    try {
      if (action === 'confirm') await myGear.confirmBooking(bookingId);
      else if (action === 'complete') await myGear.completeBooking(bookingId);
      else await myGear.cancelBooking(bookingId);
      onChanged();
    } catch (err: any) {
      Alert.alert(
        'Action failed',
        err?.response?.data?.message ?? 'Something went wrong.',
      );
    } finally {
      setLoading(null);
    }
  };

  const confirmCancel = () => {
    Alert.alert('Cancel this rental?', 'The customer will see the rental as cancelled.', [
      { text: 'Back', style: 'cancel' },
      { text: 'Cancel rental', style: 'destructive', onPress: () => act('cancel') },
    ]);
  };

  const confirmComplete = () => {
    Alert.alert(
      'Mark as completed?',
      'Use this after the customer has returned the gear.',
      [
        { text: 'Back', style: 'cancel' },
        { text: 'Mark completed', onPress: () => act('complete') },
      ],
    );
  };

  if (status === 'cancelled' || status === 'completed') {
    return null;
  }

  return (
    <View style={styles.row}>
      {status === 'pending' && (
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary, loading !== null && styles.disabled]}
          onPress={() => act('confirm')}
          disabled={loading !== null}
        >
          <Text style={styles.btnPrimaryText}>
            {loading === 'confirm' ? 'Confirming...' : 'Confirm'}
          </Text>
        </TouchableOpacity>
      )}

      {status === 'confirmed' && (
        <TouchableOpacity
          style={[styles.btn, styles.btnBlue, loading !== null && styles.disabled]}
          onPress={confirmComplete}
          disabled={loading !== null}
        >
          <Text style={styles.btnBlueText}>
            {loading === 'complete' ? 'Completing...' : 'Mark completed'}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.btn, styles.btnDanger, loading !== null && styles.disabled]}
        onPress={confirmCancel}
        disabled={loading !== null}
      >
        <Text style={styles.btnDangerText}>
          {loading === 'cancel' ? 'Cancelling...' : 'Cancel'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    justifyContent: 'flex-end',
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disabled: { opacity: 0.5 },
  btnPrimary: { backgroundColor: '#1e6b3a' },
  btnPrimaryText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  btnBlue: { backgroundColor: '#2563eb' },
  btnBlueText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  btnDanger: {
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  btnDangerText: { color: '#b91c1c', fontSize: 12, fontWeight: '800' },
});