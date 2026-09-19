import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="compass-outline" size={64} color={colors.gearupGreen} />
      <Text style={styles.title}>Explore</Text>
      <Text style={styles.subtitle}>
        Discover campsites, gear rentals, and tour guides — coming soon.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 24 },
});