import { View, StyleSheet } from 'react-native';
import { OwnerHeader } from '../../../components/owner/OwnerHeader';
import { EventForm } from '../../../components/owner/EventForm';

export default function NewEventScreen() {
  return (
    <View style={styles.container}>
      <OwnerHeader title="Create Event" />
      <EventForm mode="create" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
});