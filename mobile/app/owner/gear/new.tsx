import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
import { GearForm } from '../../../components/owner/GearForm';
import { OwnerHeader } from '../../../components/owner/OwnerHeader';

export default function NewGearScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OwnerHeader title="Add Gear" />
      <View style={{ flex: 1 }}>
        <GearForm mode="create" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
});