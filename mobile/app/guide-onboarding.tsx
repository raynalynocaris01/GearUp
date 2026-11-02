import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { guide as guideApi } from '../lib/api';
import { colors } from '../theme';

type AppStatus = {
  has_application: boolean;
  application_id: number | null;
  status: string | null;
  resume_url: string | null;
  resume_uploaded_at: string | null;
  rejection_reason: string | null;
  reviewed_at: string | null;
};

export default function GuideOnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [status, setStatus] = useState<AppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pickedFile, setPickedFile] = useState<{
    uri: string;
    name: string;
    size?: number;
  } | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await guideApi.resume.get();
      setStatus(res.data as AppStatus);
    } catch (err: any) {
      Alert.alert(
        'Could not load',
        err?.response?.data?.message ?? 'Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }
      const asset = result.assets[0];
      if (asset.size && asset.size > 5 * 1024 * 1024) {
        Alert.alert('File too large', 'Resume must be 5 MB or smaller.');
        return;
      }
      setPickedFile({
        uri: asset.uri,
        name: asset.name ?? 'resume.pdf',
        size: asset.size ?? undefined,
      });
    } catch {
      Alert.alert('Error', 'Could not open the document picker.');
    }
  };

  const uploadResume = async () => {
    if (!pickedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      // React Native FormData expects { uri, name, type } for files
      formData.append('resume', {
        uri: pickedFile.uri,
        name: pickedFile.name,
        type: 'application/pdf',
      } as any);

      await guideApi.resume.upload(formData);
      setPickedFile(null);
      await fetchStatus();
      Alert.alert(
        'Resume uploaded',
        'Your application is now under review. You will be notified once it is processed.',
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Could not upload resume.';
      Alert.alert('Upload failed', msg);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.gearupGreen} />
      </View>
    );
  }

  if (!status?.has_application) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="alert-circle-outline"
          size={56}
          color={colors.textMuted}
          style={{ marginBottom: 16 }}
        />
        <Text style={styles.title}>No application found</Text>
        <Text style={styles.subtitle}>
          Apply to become a guide before uploading a resume.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace('/signup-guide')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Apply to become a guide</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isApproved =
    status.status === 'approved' || status.status === 'auto_approved';
  const isRejected = status.status === 'rejected';
  const isUnderReview = status.status === 'under_review';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: 20,
        paddingTop: insets.top + 20,
        paddingBottom: insets.bottom + 20,
      }}
    >
      <TouchableOpacity
        style={{ marginBottom: 16 }}
        onPress={() => router.back()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="chevron-back" size={26} color={colors.text} />
      </TouchableOpacity>

      <Text style={styles.heading}>Guide Application</Text>
      <Text style={styles.subtitle}>
        Upload a PDF resume so an admin can review your guide application.
      </Text>

      {/* Status banner */}
      {isApproved && (
        <View style={[styles.banner, styles.bannerSuccess]}>
          <Text style={styles.bannerTitle}>Approved</Text>
          <Text style={styles.bannerText}>
            Your guide application has been approved. Head to your profile to
            finish your listing details.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace('/guide/profile')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Go to guide profile</Text>
          </TouchableOpacity>
        </View>
      )}

      {isUnderReview && (
        <View style={[styles.banner, styles.bannerInfo]}>
          <Text style={styles.bannerTitle}>Under review</Text>
          <Text style={styles.bannerText}>
            Your resume is with our team. We will notify you once a decision is
            made. You can re-upload below if needed.
          </Text>
        </View>
      )}

      {isRejected && (
        <View style={[styles.banner, styles.bannerError]}>
          <Text style={styles.bannerTitle}>Application declined</Text>
          {status.rejection_reason && (
            <Text style={styles.bannerText}>
              Reason: {status.rejection_reason}
            </Text>
          )}
          <Text style={styles.bannerText}>
            You can pick and upload a new resume below to re-apply.
          </Text>
        </View>
      )}

      {!isApproved && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {status.resume_url ? 'Replace your resume' : 'Upload your resume'}
          </Text>

          {status.resume_url && (
            <Text style={styles.meta}>
              Current resume uploaded:{' '}
              {status.resume_uploaded_at
                ? new Date(status.resume_uploaded_at).toLocaleString()
                : 'unknown'}
            </Text>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={pickDocument}
            activeOpacity={0.85}
          >
            <Ionicons
              name="document-outline"
              size={18}
              color={colors.gearupGreen}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.secondaryButtonText}>
              {pickedFile ? 'Choose a different file' : 'Choose PDF file'}
            </Text>
          </TouchableOpacity>

          {pickedFile && (
            <Text style={styles.meta}>
              Selected: {pickedFile.name}
              {pickedFile.size
                ? ` (${Math.round(pickedFile.size / 1024)} KB)`
                : ''}
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!pickedFile || uploading) && { opacity: 0.5 },
            ]}
            onPress={uploadResume}
            disabled={!pickedFile || uploading}
            activeOpacity={0.85}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Upload resume</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 20,
  },
  banner: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  bannerSuccess: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  bannerInfo: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  bannerError: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  bannerText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    marginBottom: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  meta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: colors.gearupGreen,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.gearupGreen,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 8,
  },
  secondaryButtonText: {
    color: colors.gearupGreen,
    fontSize: 14,
    fontWeight: '700',
  },
});