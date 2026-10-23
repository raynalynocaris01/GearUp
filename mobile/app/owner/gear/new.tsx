import { View, StyleSheet } from 'react-native';
import { GearForm } from '../../../components/owner/GearForm';
import { OwnerHeader } from '../../../components/owner/OwnerHeader';

export default function NewGearScreen() {
  return (
    <View style={styles.container}>
      <OwnerHeader title="Add Gear" />
      <View style={{ flex: 1 }}>
        <GearForm mode="create" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
});