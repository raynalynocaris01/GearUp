import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import { imgSrc } from '../../lib/images';
import { auth, clearToken, hasToken } from '../../lib/api';
import { colors } from '../../theme';

type UserRole = 'admin' | 'owner' | 'customer' | 'guide';

type ProfileUser = {
  name: string;
  email: string;
  avatar_url: string | null;
  role: UserRole;
  is_approved: boolean;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const res = await auth.user();
    const data = res.data as typeof res.data & {
      role?: UserRole;
      is_approved?: boolean;
    };
    setUser({
      name: data.name,
      email: data.email,
      avatar_url: (data as any).avatar_url ?? null,
      role: (data.role ?? 'customer') as UserRole,
      is_approved: data.is_approved ?? false,
    });
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;

      (async () => {
        setLoading(true);
        const loggedIn = await hasToken();
        if (!loggedIn) {
          if (active) {
            setUser(null);
            setLoading(false);
          }
          return;
        }
        try {
          const res = await auth.user();
          if (active) {
            const data = res.data as typeof res.data & {
              role?: UserRole;
              is_approved?: boolean;
            };
            setUser({
              name: data.name,
              email: data.email,
              avatar_url: (data as any).avatar_url ?? null,
              role: (data.role ?? 'customer') as UserRole,
              is_approved: data.is_approved ?? false,
            });
          }
        } catch {
          await clearToken();
          if (active) setUser(null);
        } finally {
          if (active) setLoading(false);
        }
      })();

      return () => {
        active = false;
      };
    }, []),
  );

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarPress = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to update your avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() ?? 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      formData.append('image', { uri, name: filename, type } as any);

      await auth.uploadAvatar(formData);
      await fetchUser();
    } catch (err: any) {
      Alert.alert('Upload failed', err?.response?.data?.message ?? 'Could not upload avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.logout();
    } catch {}
    await clearToken();
    setUser(null);
    router.replace('/(tabs)');
  };

  const handleBecomeGuide = () => {
    Alert.alert(
      'Become a Tour Guide',
      'Your application will be reviewed by our team. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: async () => {
            try {
              await auth.becomeGuide();
              Alert.alert(
                'Application submitted',
                'Your guide application is pending admin approval.',
              );
              await fetchUser();
            } catch (err: any) {
              const msg =
                err?.response?.data?.message ??
                err?.message ??
                'Could not submit application.';
              Alert.alert('Error', msg);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.gearupGreen} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="person-circle-outline"
          size={80}
          color={colors.textMuted}
        />
        <Text style={styles.guestTitle}>You&apos;re browsing as a guest</Text>
        <Text style={styles.guestSubtitle}>
          Sign in to book campsites, rent gear, and save your favorite spots.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/signup')}
        >
          <Text style={styles.secondaryButtonText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.hostLink}
          onPress={() => router.push('/signup-business')}
        >
          <Text style={styles.hostLinkText}>
            Want to list your campsite? Become a host →
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCustomer = user.role === 'customer';
  const isOwner = user.role === 'owner' && user.is_approved;
  const isGuide = user.role === 'guide';
  const isAdmin = user.role === 'admin';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ──────────────────────────────────── */}
      <View style={styles.profileHeader}>
        <TouchableOpacity
          style={styles.avatarWrap}
          onPress={handleAvatarPress}
          activeOpacity={0.8}
          disabled={uploadingAvatar}
        >
          {user.avatar_url ? (
            <Image source={{ uri: imgSrc(user.avatar_url) }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.avatarEditBadge}>
            {uploadingAvatar ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera" size={14} color="#fff" />
            )}
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>
            {user.role === 'guide' && !user.is_approved
              ? 'Guide · Pending'
              : user.role === 'guide'
                ? 'Guide · Verified'
                : user.role === 'owner'
                  ? 'Owner'
                  : user.role === 'admin'
                    ? 'Admin'
                    : 'Customer'}
          </Text>
        </View>
      </View>

      {/* ── Primary role action (dashboard) ─────────── */}
      {isOwner && (
        <TouchableOpacity
          style={styles.dashboardButton}
          onPress={() => router.push('/owner' as any)}
        >
          <View style={styles.dashboardContent}>
            <Ionicons name="briefcase-outline" size={20} color="#fff" />
            <Text style={styles.dashboardText}>Manage my business</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </TouchableOpacity>
      )}

      {isAdmin && (
        <TouchableOpacity
          style={styles.dashboardButton}
          onPress={() => router.push('/admin' as any)}
        >
          <View style={styles.dashboardContent}>
            <Ionicons name="shield-outline" size={20} color="#fff" />
            <Text style={styles.dashboardText}>Admin panel</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </TouchableOpacity>
      )}

      {isGuide && (
        <TouchableOpacity
          style={styles.dashboardButton}
          onPress={() => router.push('/guide' as any)}
        >
          <View style={styles.dashboardContent}>
            <Ionicons name="compass-outline" size={20} color="#fff" />
            <Text style={styles.dashboardText}>
              {user.is_approved ? 'Guide dashboard' : 'Guide application pending'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </TouchableOpacity>
      )}

      {/* ── Account ─────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.sectionCard}>
        {(isCustomer || isGuide) && (
          <MenuRow
            icon="cube-outline"
            label="My gear listings"
            onPress={() => router.push('/my-gear' as any)}
          />
        )}
        {(isCustomer || isGuide) && (
          <MenuRow
            icon="bag-handle-outline"
            label="My gear rentals"
            onPress={() => router.push('/my-gear/bookings' as any)}
          />
        )}
        {isOwner && (
          <MenuRow
            icon="settings-outline"
            label="Business settings"
            onPress={() => router.push('/owner/settings' as any)}
          />
        )}
        {isGuide && (
          <MenuRow
            icon="person-outline"
            label="Guide profile"
            onPress={() => router.push('/guide/profile' as any)}
          />
        )}
        <MenuRow
          icon="calendar-outline"
          label="My bookings"
          onPress={() => router.push('/(tabs)/bookings' as any)}
          isLast={!(isCustomer || isGuide || isOwner)}
        />
      </View>

      {/* ── Activity ────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Activity</Text>
      <View style={styles.sectionCard}>
        <MenuRow
          icon="notifications-outline"
          label="Notifications"
          onPress={() => router.push('/notifications' as any)}
          isLast
        />
      </View>

      {/* ── Become a Guide CTA (customers only) ─────── */}
      {isCustomer && (
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleBecomeGuide}
        >
          <View style={styles.ctaContent}>
            <Ionicons name="compass-outline" size={20} color="#fff" />
            <Text style={styles.ctaText}>Become a tour guide</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </TouchableOpacity>
      )}

      {/* ── About ───────────────────────────────────── */}
      <Text style={styles.sectionTitle}>About</Text>
      <View style={styles.sectionCard}>
        <MenuRow
          icon="document-text-outline"
          label="Terms of service"
          onPress={() => router.push('/terms' as any)}
        />
        <MenuRow
          icon="shield-checkmark-outline"
          label="Privacy policy"
          onPress={() => router.push('/privacy' as any)}
          isLast
        />
      </View>

      {/* ── Log out ─────────────────────────────────── */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#dc2626" />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>GearUp v1.0</Text>
    </ScrollView>
  );
}

// ── Reusable menu row ─────────────────────────────────
function MenuRow({
  icon,
  label,
  onPress,
  isLast = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuRow, !isLast && styles.menuRowBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={22} color={colors.gearupGreen} />
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f9fafb',
  },
  profileHeader: { alignItems: 'center', gap: 6, marginBottom: 24 },
  avatarWrap: { position: 'relative', marginBottom: 8 },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.gearupGreen,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gearupGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '900' },
  name: { fontSize: 22, fontWeight: '800', color: '#111827' },
  email: { fontSize: 14, color: colors.textMuted },
  roleBadge: {
    marginTop: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  roleBadgeText: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6b7280',
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  dashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.gearupGreen,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginBottom: 8,
  },
  dashboardContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dashboardText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.gearupGreenLight ?? colors.gearupGreen,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginTop: 8,
  },
  ctaContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 32,
  },
  logoutText: { color: '#dc2626', fontSize: 15, fontWeight: '700' },
  versionText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  primaryButton: {
    backgroundColor: colors.gearupGreen,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.gearupGreen,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.gearupGreen,
    fontSize: 15,
    fontWeight: '700',
  },
  hostLink: { marginTop: 20, paddingVertical: 8 },
  hostLinkText: {
    color: colors.gearupGreen,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});