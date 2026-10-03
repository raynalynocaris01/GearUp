import { View, StyleSheet } from 'react-native';
import { OwnerHeader } from '../../../components/owner/OwnerHeader';
import { CampsiteForm } from '../../../components/owner/CampsiteForm';

export default function NewCampsiteScreen() {
  return (
    <View style={styles.container}>
      <OwnerHeader title="Post a Campsite" />
      <CampsiteForm mode="create" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
});