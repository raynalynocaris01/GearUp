import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { owner } from '../../../../lib/api';
import type { Campsite, TourGuide } from '@gearup/shared';
import { TourGuidesManager } from '../../../../components/owner/TourGuidesManager';
import { colors } from '../../../../theme';

export default function TourGuidesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [campsite, setCampsite] = useState<Campsite | null>(null);
  const [guides, setGuides] = useState<TourGuide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await owner.getCampsite(id);
        setCampsite(res.data);
        setGuides(res.data.tour_guides ?? []);
      } catch {
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tour Guides</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.gearupGreen} />
        </View>
      ) : campsite ? (
        <>
          <View style={styles.subtitle}>
            <Text style={styles.subtitleText}>
              Managing guides for{' '}
              <Text style={{ fontWeight: '800' }}>{campsite.name}</Text>
            </Text>
          </View>
          <TourGuidesManager
            campsiteId={campsite.id}
            initialGuides={guides}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 55,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  subtitle: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f0fdf4',
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
  },
  subtitleText: { fontSize: 13, color: '#166534' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});