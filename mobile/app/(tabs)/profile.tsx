import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, clearToken, hasToken } from '../../lib/api';
import { colors } from '../../theme';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<{
  name: string;
  email: string;
  role: 'admin' | 'owner' | 'customer';
  is_approved: boolean;
} | null>(null);

  const [loading, setLoading] = useState(true);

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
              role?: 'admin' | 'owner' | 'customer';
              is_approved?: boolean;
            };

            setUser({
              name: data.name,
              email: data.email,
              role: data.role ?? 'customer',
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

  const handleLogout = async () => {
    try {
      await auth.logout();
    } catch {}
    await clearToken();
    setUser(null);
    router.replace('/(tabs)');
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
        <Ionicons name="person-circle-outline" size={80} color={colors.textMuted} />
        <Text style={styles.guestTitle}>You're browsing as a guest</Text>
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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>
      {/* Owner section */}
{user.role === 'owner' && user.is_approved && (
  <TouchableOpacity
    style={styles.manageButton}
    onPress={() => router.push('/owner')}
  >
    <View style={styles.manageButtonContent}>
      <Ionicons name="briefcase-outline" size={20} color="#fff" />
      <Text style={styles.manageButtonText}>Manage my business</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color="#fff" />
  </TouchableOpacity>
)}

{/* Admin section */}
{user.role === 'admin' && (
  <TouchableOpacity
    style={styles.manageButton}
    onPress={() => router.push('/admin')}
  >
    <View style={styles.manageButtonContent}>
      <Ionicons name="shield-outline" size={20} color="#fff" />
      <Text style={styles.manageButtonText}>Admin panel</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color="#fff" />
  </TouchableOpacity>
)}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#dc2626" />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  profileHeader: { alignItems: 'center', gap: 8, marginBottom: 32 },
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
  },
  logoutText: { color: '#dc2626', fontSize: 15, fontWeight: '700' },
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
  secondaryButtonText: { color: colors.gearupGreen, fontSize: 15, fontWeight: '700' },

  manageButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: colors.gearupGreen,
  paddingVertical: 16,
  paddingHorizontal: 20,
  borderRadius: 14,
  marginBottom: 12,
},
manageButtonContent: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
},
manageButtonText: {
  color: '#fff',
  fontSize: 15,
  fontWeight: '700',
},
});