import { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { owner } from '../../../../lib/api';
import type { GearItem } from '@gearup/shared';
import { OwnerHeader } from '../../../../components/owner/OwnerHeader';
import { GearForm } from '../../../../components/owner/GearForm';
import { colors } from '../../../../theme';

export default function EditGearScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [item, setItem] = useState<GearItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await owner.getGear(id);
        setItem(res.data);
      } catch {
        Alert.alert('Error', 'Could not load this gear item.');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <View style={styles.container}>
      <OwnerHeader title="Edit Gear" />
      {loading || !item ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.gearupGreen} />
        </View>
      ) : (
        <GearForm mode="edit" initial={item} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});