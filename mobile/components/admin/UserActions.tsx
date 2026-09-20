import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { admin } from '../../lib/api';
import { colors } from '../../theme';

interface Props {
  userId: number;
  role: 'admin' | 'owner' | 'customer';
  isApproved: boolean;
  isSuspended: boolean;
  onSuccess?: () => void;
}

export function UserActions({
  userId,
  role,
  isApproved,
  isSuspended,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  const run = async (action: string, successMessage: string) => {
    setLoading(action);
    try {
      switch (action) {
        case 'approve':
          await admin.approveUser(userId);
          break;
        case 'reject':
          await admin.rejectUser(userId);
          break;
        case 'suspend':
          await admin.suspendUser(userId);
          break;
        case 'reinstate':
          await admin.reinstateUser(userId);
          break;
      }
      onSuccess?.();
    } catch (err: any) {
      Alert.alert(
        'Action failed',
        err.response?.data?.message ?? 'Please try again.',
      );
    } finally {
      setLoading(null);
    }
  };

  const confirmApprove = () => {
    Alert.alert(
      'Approve this owner?',
      'They will gain access to the owner dashboard and be able to post campsites.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => run('approve', 'Approved'),
        },
      ],
    );
  };

  const confirmReject = () => {
    Alert.alert(
      'Reject this owner?',
      'They will be downgraded to a regular customer.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => run('reject', 'Rejected'),
        },
      ],
    );
  };

  const confirmSuspend = () => {
    Alert.alert(
      'Suspend this user?',
      'They will be logged out and unable to log in until reinstated.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: () => run('suspend', 'Suspended'),
        },
      ],
    );
  };

  const confirmReinstate = () => {
    Alert.alert(
      'Reinstate this user?',
      'They will regain full access to their account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reinstate',
          onPress: () => run('reinstate', 'Reinstated'),
        },
      ],
    );
  };

  if (role === 'admin') {
    return (
      <Text style={styles.noAction}>—</Text>
    );
  }

  return (
    <View style={styles.row}>
      {role === 'owner' && !isApproved && (
        <>
          <TouchableOpacity
            style={styles.approveButton}
            onPress={confirmApprove}
            disabled={loading !== null}
          >
            {loading === 'approve' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.approveText}>Approve</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={confirmReject}
            disabled={loading !== null}
          >
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>
        </>
      )}

      {!isSuspended ? (
        <TouchableOpacity
          style={styles.suspendButton}
          onPress={confirmSuspend}
          disabled={loading !== null}
        >
          {loading === 'suspend' ? (
            <ActivityIndicator size="small" color="#dc2626" />
          ) : (
            <Text style={styles.suspendText}>Suspend</Text>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.reinstateButton}
          onPress={confirmReinstate}
          disabled={loading !== null}
        >
          {loading === 'reinstate' ? (
            <ActivityIndicator size="small" color={colors.gearupGreen} />
          ) : (
            <Text style={styles.reinstateText}>Reinstate</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  noAction: { fontSize: 14, color: '#9ca3af' },

  approveButton: {
    backgroundColor: colors.gearupGreen,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
  },
  approveText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  rejectButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
  },
  rejectText: { color: '#374151', fontSize: 11, fontWeight: '700' },

  suspendButton: {
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
  },
  suspendText: { color: '#dc2626', fontSize: 11, fontWeight: '700' },

  reinstateButton: {
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
  },
  reinstateText: { color: colors.gearupGreen, fontSize: 11, fontWeight: '700' },
});