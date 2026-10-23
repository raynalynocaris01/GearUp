import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { GearForm } from '../../../../components/owner/GearForm';
import { owner } from '../../../../lib/api';

export default function EditGearScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await owner.getGear(id);
        setItem(res.data);
      } catch {
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#15803d" />
            <Text style={styles.loadingText}>Loading gear...</Text>
          </View>
        ) : item ? (
          <GearForm mode="edit" initial={item} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#6b7280', fontSize: 14 },
});