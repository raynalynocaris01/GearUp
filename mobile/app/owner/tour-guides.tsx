import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { owner } from '../../lib/api';
import type { TourGuide } from '@gearup/shared';
import { OwnerHeader } from '../../components/owner/OwnerHeader';
import { MyTourGuidesClient } from '../../components/owner/MyTourGuidesClient';
import { colors } from '../../theme';

export default function OwnerTourGuidesScreen() {
  const [guides, setGuides] = useState<TourGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await owner.listAllMyGuides();
      setGuides(res.data ?? []);
    } catch {
      setGuides([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(guides.length === 0);
    }, [load, guides.length]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <OwnerHeader title="Tour Guides" />

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.gearupGreen} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.gearupGreen}
            />
          }
        >
          <View style={styles.headerBlock}>
            <Text style={styles.headerTitle}>Tour Guides</Text>
            <Text style={styles.headerSubtitle}>
              Manage all your guides - attached to campsites or independent.
            </Text>
          </View>

          <MyTourGuidesClient
            initialGuides={guides}
            onRefresh={() => load()}
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerBlock: { marginBottom: 16 },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
});