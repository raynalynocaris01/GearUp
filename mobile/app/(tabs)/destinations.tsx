import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme';

export default function DestinationsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Destinations</Text>
      <Text style={styles.subtitle}>Browse all camping locations — coming soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
});