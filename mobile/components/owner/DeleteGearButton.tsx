import { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { owner } from '../../lib/api';
import { colors } from '../../theme';

interface Props {
  gearId: number;
  name: string;
  onSuccess?: () => void;
}

export function DeleteGearButton({ gearId, name, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  const confirmDelete = () => {
    Alert.alert(
      'Delete gear item?',
      `Delete "${name}"? This cannot be undone. Existing bookings will be preserved.`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: handleDelete,
        },
      ],
    );
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await owner.deleteGear(gearId);
      onSuccess?.();
    } catch (err: any) {
      Alert.alert(
        'Could not delete',
        err.response?.data?.message ?? 'Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={confirmDelete}
      disabled={loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color="#dc2626" size="small" />
      ) : (
        <Text style={styles.text}>Delete</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fef2f2',
  },
  text: { fontSize: 11, fontWeight: '700', color: '#dc2626' },
});