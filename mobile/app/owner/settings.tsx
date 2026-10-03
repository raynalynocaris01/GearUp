import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { owner } from '../../lib/api';
import type { AuthUser } from '@gearup/shared';
import { OwnerHeader } from '../../components/owner/OwnerHeader';
import { colors } from '../../theme';

type Msg = { ok: boolean; text: string } | null;

export default function OwnerSettingsScreen() {
  const [loading, setLoading] = useState(true);

  // Profile
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<Msg>(null);

  // Password
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<Msg>(null);

  const load = async () => {
    try {
      const { auth } = await import('../../lib/api');
      const res = await auth.user();
      setName(res.data.name ?? '');
      setEmail(res.data.email ?? '');
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      await owner.updateProfile({ name: name.trim(), email: email.trim() });
      setProfileMsg({ ok: true, text: 'Profile updated.' });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.errors?.email?.[0] ??
        'Could not update profile.';
      setProfileMsg({ ok: false, text: msg });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwdSaving(true);
    setPwdMsg(null);
    try {
      await owner.updatePassword({
        current_password: current,
        password: next,
        password_confirmation: confirm,
      });
      setPwdMsg({ ok: true, text: 'Password updated.' });
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.errors?.current_password?.[0] ??
        err?.response?.data?.errors?.password?.[0] ??
        'Could not change password.';
      setPwdMsg({ ok: false, text: msg });
    } finally {
      setPwdSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <OwnerHeader title="Settings" />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.gearupGreen} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <OwnerHeader title="Settings" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>
          Manage your account and business preferences.
        </Text>

        {/* Profile section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={18} color={colors.gearupGreen} />
            <Text style={styles.cardTitle}>Profile</Text>
          </View>

          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor="#9ca3af"
            autoCapitalize="words"
            maxLength={255}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            maxLength={255}
          />

          <TouchableOpacity
            style={[styles.saveBtn, profileSaving && styles.saveBtnDisabled]}
            onPress={handleSaveProfile}
            disabled={profileSaving}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>
              {profileSaving ? 'Saving...' : 'Save changes'}
            </Text>
          </TouchableOpacity>

          {profileMsg && (
            <Text
              style={[
                styles.msg,
                { color: profileMsg.ok ? '#16a34a' : '#dc2626' },
              ]}
            >
              {profileMsg.text}
            </Text>
          )}
        </View>

        {/* Security section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.gearupGreen} />
            <Text style={styles.cardTitle}>Security</Text>
          </View>

          <Text style={styles.label}>Current password</Text>
          <TextInput
            value={current}
            onChangeText={setCurrent}
            style={styles.input}
            placeholder="Current password"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>New password</Text>
          <TextInput
            value={next}
            onChangeText={setNext}
            style={styles.input}
            placeholder="At least 8 characters"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Confirm new password</Text>
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            style={styles.input}
            placeholder="Re-type new password"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.saveBtn, pwdSaving && styles.saveBtnDisabled]}
            onPress={handleChangePassword}
            disabled={pwdSaving}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>
              {pwdSaving ? 'Updating...' : 'Update password'}
            </Text>
          </TouchableOpacity>

          {pwdMsg && (
            <Text
              style={[
                styles.msg,
                { color: pwdMsg.ok ? '#16a34a' : '#dc2626' },
              ]}
            >
              {pwdMsg.text}
            </Text>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  centerBox: { paddingVertical: 60, alignItems: 'center' },

  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 16,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fafafa',
  },

  saveBtn: {
    backgroundColor: colors.gearupGreen,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },

  msg: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
});