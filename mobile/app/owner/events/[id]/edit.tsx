import { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { owner } from '../../../../lib/api';
import type { EventItem } from '@gearup/shared';
import { OwnerHeader } from '../../../../components/owner/OwnerHeader';
import { EventForm } from '../../../../components/owner/EventForm';
import { colors } from '../../../../theme';

export default function EditEventScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await owner.getEvent(id);
        setEvent(res.data);
      } catch {
        Alert.alert('Error', 'Could not load this event.');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <View style={styles.container}>
      <OwnerHeader title="Edit Event" />

      {loading || !event ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.gearupGreen} />
        </View>
      ) : (
        <EventForm
          mode="edit"
          initial={{
            ...event,
            region: event.region ?? '',
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});