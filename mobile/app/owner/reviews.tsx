import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { OwnerHeader } from '../../components/owner/OwnerHeader';
import { colors } from '../../theme';

export default function OwnerReviewsScreen() {
  return (
    <View style={styles.container}>
      <OwnerHeader title="Reviews" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          See what campers are saying about your campsites.
        </Text>

        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>⭐</Text>
          <Text style={styles.emptyTitle}>Coming soon</Text>
          <Text style={styles.emptyText}>
            Review management will be available in a future update.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 20,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#e5e7eb',
    padding: 40,
    alignItems: 'center',
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
});