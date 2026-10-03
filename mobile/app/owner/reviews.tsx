import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../../theme';

export default function OwnerReviewsScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Reviews</Text>
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: '900', color: '#111827' },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
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