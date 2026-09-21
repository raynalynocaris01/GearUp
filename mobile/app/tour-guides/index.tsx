import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { tourGuides } from '../../lib/api';
import type { TourGuide } from '@gearup/shared';
import { GuideCard } from '../../components/GuideCard';
import { colors } from '../../theme';

export default function TourGuidesScreen() {
  const router = useRouter();
  const [guides, setGuides] = useState<TourGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setError('');
    try {
      const res = await tourGuides.list();
      setGuides(res.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message ??
          err.message ??
          'Could not load guides.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load(guides.length === 0);
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const independent = guides.filter((g) => g.is_independent);
  const attached = guides.filter((g) => !g.is_independent);

  return (
    <View style={styles.container}>
      {/* Header */}
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

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroPill}>LOCAL GUIDES</Text>
        <Text style={styles.heroTitle}>
          Hire a guide for your next adventure.
        </Text>
        <Text style={styles.heroSubtitle}>
          Browse accredited local guides. Book one when you reserve a
          campsite, or hire them on their own.
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.gearupGreen} />
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Ionicons
            name="warning-outline"
            size={40}
            color={colors.textMuted}
          />
          <Text style={styles.centerText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => load(true)}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
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
          {guides.length === 0 ? (
            <View style={styles.centerBox}>
              <Text style={styles.emptyEmoji}>🧭</Text>
              <Text style={styles.centerText}>
                No tour guides available yet.
              </Text>
            </View>
          ) : (
            <>
              {/* Independent guides */}
              {independent.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Independent Guides
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Hire them for a day trip, trek, or custom outing.
                  </Text>
                  <View style={styles.list}>
                    {independent.map((g) => (
                      <GuideCard
                        key={g.id}
                        guide={g}
                        onPress={() =>
                          router.push(`/tour-guides/${g.id}`)
                        }
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Campsite-attached guides */}
              {attached.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Guides at Campsites
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Available when you book one of these campsites.
                  </Text>
                  <View style={styles.list}>
                    {attached.map((g) => (
                      <GuideCard
                        key={g.id}
                        guide={g}
                        onPress={() =>
                          router.push(`/tour-guides/${g.id}`)
                        }
                      />
                    ))}
                  </View>
                </View>
              )}
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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

  hero: {
    backgroundColor: '#0f3d20',
    padding: 20,
    paddingTop: 24,
    paddingBottom: 28,
  },
  heroPill: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#a7f3d0',
    marginBottom: 10,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginTop: 10,
    lineHeight: 18,
  },

  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  centerText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 6 },
  retryButton: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.gearupGreen,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: colors.gearupGreen,
    fontSize: 13,
    fontWeight: '700',
  },

  scrollContent: { padding: 16 },
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 14,
  },
  list: { gap: 12 },
});