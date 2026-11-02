import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { admin } from '../../../../lib/api';
import type { GuideApplication } from '@gearup/shared';
import { AdminHeader } from '../../../../components/admin/AdminHeader';
import { colors } from '../../../../theme';

const STATUS_STYLE: Record<
  GuideApplication['status'],
  { bg: string; color: string; label: string }
> = {
  pending: { bg: '#fef3c7', color: '#92400e', label: 'PENDING' },
  under_review: { bg: '#dbeafe', color: '#1e40af', label: 'UNDER REVIEW' },
  approved: { bg: '#dcfce7', color: '#15803d', label: 'APPROVED' },
  rejected: { bg: '#fee2e2', color: '#b91c1c', label: 'REJECTED' },
  auto_approved: { bg: '#ccfbf1', color: '#0f766e', label: 'AUTO-APPROVED' },
};

const SOURCE_LABEL: Record<GuideApplication['submission_source'], string> = {
  self_signup: 'Self-signup',
  customer_upgrade: 'Customer upgrade',
  owner_created: 'Owner-created',
  admin_created: 'Admin-created',
};

export default function AdminGuideApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [application, setApplication] = useState<GuideApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await admin.guideApplications.get(id);
      setApplication(res.data);
    } catch {
      Alert.alert('Error', 'Could not load application.');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openResume = async () => {
    setDownloading(true);
    try {
      const SecureStore = await import('expo-secure-store');
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) {
        Alert.alert('Error', 'Not authenticated.');
        return;
      }

      const url = admin.guideApplications.resumeUrl(id);
      // eslint-disable-next-line no-console
      console.log('[resume] fetching', url);

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // eslint-disable-next-line no-console
      console.log('[resume] status', response.status);

      if (!response.ok) {
        Alert.alert('Error', `Download failed (${response.status})`);
        return;
      }

      // Read the PDF as an array buffer, then convert to base64 manually.
      // React Native has no FileReader, so we can't use readAsDataURL.
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }

      // Use the new File API (SDK 54+). It accepts Uint8Array directly,
      // no base64 conversion needed.
      const dir =
        FileSystem.Paths.cache ?? FileSystem.Paths.document;
      const file = new FileSystem.File(dir, `resume-${id}.pdf`);
      file.write(bytes);
      const fileUri = file.uri;

      // eslint-disable-next-line no-console
      console.log('[resume] saved to', fileUri);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Resume',
        });
      } else {
        Alert.alert('Downloaded', `Saved to ${fileUri}`);
      }
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('[resume] exception', err);
      Alert.alert('Error', err?.message ?? 'Could not open resume.');
    } finally {
      setDownloading(false);
    }
  };

  const handleApprove = () => {
    Alert.alert(
      'Approve this application?',
      'The guide will become bookable on GearUp.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setSubmitting(true);
            try {
              await admin.guideApplications.approve(id);
              Alert.alert('Approved', 'Guide application approved.');
              router.back();
            } catch (err: any) {
              Alert.alert(
                'Error',
                err?.response?.data?.message ?? 'Could not approve.',
              );
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Reason required', 'Please enter a reason for rejection.');
      return;
    }
    setSubmitting(true);
    try {
      await admin.guideApplications.reject(id, rejectReason.trim());
      Alert.alert('Rejected', 'Application rejected.');
      router.back();
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.response?.data?.message ?? 'Could not reject.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !application) {
    return (
      <View style={styles.container}>
        <AdminHeader title="Application" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.gearupGreen} />
        </View>
      </View>
    );
  }

  const status = STATUS_STYLE[application.status];
  const canAct =
    application.status === 'pending' || application.status === 'under_review';

  return (
    <View style={styles.container}>
      <AdminHeader title="Application" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(application.applicant?.name ?? '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>
            {application.applicant?.name ?? 'Unknown'}
          </Text>
          <Text style={styles.email}>{application.applicant?.email ?? ''}</Text>
          <View style={[styles.badge, { backgroundColor: status.bg }]}>
            <Text style={[styles.badgeText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Application ID</Text>
            <Text style={styles.rowValue}>#{application.id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Source</Text>
            <Text style={styles.rowValue}>
              {SOURCE_LABEL[application.submission_source]}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Submitted</Text>
            <Text style={styles.rowValue}>
              {new Date(application.created_at).toLocaleString()}
            </Text>
          </View>
          {application.resume_uploaded_at && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Resume uploaded</Text>
              <Text style={styles.rowValue}>
                {new Date(application.resume_uploaded_at).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {application.resume_url ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resume</Text>
            <TouchableOpacity
              style={styles.resumeButton}
              onPress={openResume}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator size="small" color={colors.gearupGreen} />
              ) : (
                <>
                  <Ionicons
                    name="document-outline"
                    size={20}
                    color={colors.gearupGreen}
                  />
                  <Text style={styles.resumeButtonText}>Open resume PDF</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resume</Text>
            <Text style={styles.noResumeText}>
              No resume attached to this application.
            </Text>
          </View>
        )}

        {application.status === 'rejected' && application.rejection_reason && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rejection reason</Text>
            <Text style={styles.rejectionText}>
              {application.rejection_reason}
            </Text>
          </View>
        )}

        {canAct && !rejectMode && (
          <View style={styles.actionsCard}>
            <TouchableOpacity
              style={styles.approveButton}
              onPress={handleApprove}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.approveText}>Approve application</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => setRejectMode(true)}
              disabled={submitting}
            >
              <Text style={styles.rejectText}>Reject application</Text>
            </TouchableOpacity>
          </View>
        )}

        {canAct && rejectMode && (
          <View style={styles.actionsCard}>
            <Text style={styles.cardTitle}>Reason for rejection</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Explain why this application is being rejected."
              placeholderTextColor="#9ca3af"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={4}
            />
            <View style={styles.rejectActionsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setRejectMode(false);
                  setRejectReason('');
                }}
                disabled={submitting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmRejectBtn}
                onPress={handleReject}
                disabled={submitting || !rejectReason.trim()}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmRejectText}>Confirm rejection</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function base64Encode(str: string): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  for (let i = 0; i < str.length; i += 3) {
    const c1 = str.charCodeAt(i);
    const c2 = str.charCodeAt(i + 1);
    const c3 = str.charCodeAt(i + 2);
    output += chars[c1 >> 2];
    output += chars[((c1 & 0x03) << 4) | (c2 >> 4)];
    output += i + 1 < str.length ? chars[((c2 & 0x0f) << 2) | (c3 >> 6)] : '=';
    output += i + 2 < str.length ? chars[c3 & 0x3f] : '=';
  }
  return output;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 6,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.gearupGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '800', color: '#111827', marginTop: 4 },
  email: { fontSize: 13, color: colors.textMuted },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
  },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLabel: { fontSize: 13, color: colors.textMuted },
  rowValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.gearupGreen,
    borderRadius: 10,
    paddingVertical: 14,
  },
  resumeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gearupGreen,
  },
  noResumeText: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
  rejectionText: { fontSize: 13, color: '#b91c1c' },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 16,
    gap: 12,
  },
  approveButton: {
    backgroundColor: colors.gearupGreen,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  approveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  rejectButton: {
    borderWidth: 1.5,
    borderColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  rejectText: { color: '#dc2626', fontWeight: '700', fontSize: 14 },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  rejectActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelBtnText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  confirmRejectBtn: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmRejectText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});