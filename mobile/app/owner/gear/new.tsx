import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GearForm } from '../../../components/owner/GearForm';

export default function NewGearScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={{ flex: 1 }}>
        <GearForm mode="create" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
});