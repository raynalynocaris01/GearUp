import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { admin } from '../../lib/api';
import { colors } from '../../theme';

interface Props {
  campsiteId: number;
  name: string;
  isFeatured: boolean;
  onSuccess?: () => void;
}

export function CampsiteActions({
  campsiteId,
  name,
  isFeatured,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState<'feature' | 'delete' | null>(null);

  const toggleFeatured = async () => {
    setLoading('feature');
    try {
      await admin.toggleFeatured(campsiteId);
      onSuccess?.();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message ?? 'Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete this campsite?',
      `Delete "${name}"? This will also remove all tour guides. Bookings will be preserved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading('delete');
            try {
              await admin.deleteCampsite(campsiteId);
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

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[
          styles.featureButton,
          isFeatured && styles.featureButtonActive,
        ]}
        onPress={toggleFeatured}
        disabled={loading !== null}
      >
        {loading === 'feature' ? (
          <ActivityIndicator
            size="small"
            color={isFeatured ? '#b45309' : '#374151'}
          />
        ) : (
          <Text
            style={[
              styles.featureText,
              isFeatured && styles.featureTextActive,
            ]}
          >
            {isFeatured ? '★ Unfeature' : '☆ Feature'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDelete}
        disabled={loading !== null}
      >
        {loading === 'delete' ? (
          <ActivityIndicator size="small" color="#dc2626" />
        ) : (
          <Text style={styles.deleteText}>Delete</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  featureButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  featureButtonActive: {
    borderColor: '#fcd34d',
    backgroundColor: '#fef3c7',
  },
  featureText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  featureTextActive: { color: '#b45309' },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteText: { fontSize: 11, fontWeight: '700', color: '#dc2626' },
});