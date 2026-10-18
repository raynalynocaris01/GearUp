import { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { owner } from '../../../../lib/api';
import type { Campsite } from '@gearup/shared';
import { OwnerHeader } from '../../../../components/owner/OwnerHeader';
import { CampsiteForm } from '../../../../components/owner/CampsiteForm';
import { colors } from '../../../../theme';

export default function EditCampsiteScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [campsite, setCampsite] = useState<Campsite | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        console.log('[DEBUG] edit screen id param:', id, typeof id);
        const res = await owner.getCampsite(id);
        console.log('[DEBUG] campsite loaded:', {
          id: res.data.id,
          name: res.data.name,
          parent_campsite_id: res.data.parent_campsite_id,
        });
        setCampsite(res.data);
      } catch (err) {
        console.log('[DEBUG] fetch error:', err);
        Alert.alert('Error', 'Could not load this campsite.');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <View style={styles.container}>
      <OwnerHeader
        title={campsite?.parent_campsite_id ? 'Edit Room' : 'Edit Campsite'}
      />
      {loading || !campsite ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.gearupGreen} />
        </View>
      ) : (
        <CampsiteForm mode="edit" initial={campsite} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});