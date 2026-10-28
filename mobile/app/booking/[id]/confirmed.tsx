
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { bookings } from '../../../lib/api';
import type { Booking } from '@gearup/shared';
import { colors } from '../../../theme';
import { imgSrc } from '../../../lib/images';

export default function ConfirmedBookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const fetchBooking = async () => {
    try {
      const data = await bookings.get(id);
      setBooking(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const timer = setTimeout(() => {
        fetchBooking();
      }, 50);
      return () => clearTimeout(timer);
    }, [])
  );

  const handlePay = async () => {
    if (!booking) return;
    setPaying(true);
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const url = 'https://oppositionless-emil-inspiritingly.ngrok-free.dev/api/bookings/' + booking.id + '/pay';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({
          redirect_url: 'exp://192.168.100.90:8081/--/booking/' + booking.id + '/confirmed',
        }),
      });
      const data = await res.json();
      if (data.checkout_url) {
        const freshUrl = data.checkout_url + (data.checkout_url.includes('?') ? '&' : '?') + 't=' + Date.now();
        await WebBrowser.openAuthSessionAsync(freshUrl, 'exp://192.168.100.90:8081/--/booking/' + booking.id + '/confirmed');
        fetchBooking();
      } else {
        Alert.alert('Error', data.message || 'Could not create checkout');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to connect to payment server');
    } finally {
      setPaying(false);
    }
  };

  const handleCashPay = async () => {
    if (!booking) return;
    setPaying(true);
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const url = 'https://oppositionless-emil-inspiritingly.ngrok-free.dev/api/bookings/' + booking.id + '/pay';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({ payment_method: 'cash' }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchBooking();
      } else {
        Alert.alert('Error', data.message || 'Could not confirm cash payment.');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.gearupGreen} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.center}>
        <Text>Booking not found.</Text>
      </View>
    );
  }

  const isPaid = booking.payment_status === 'paid';
  const isCash = booking.payment_method === 'cash';
  
  // Check if the campsite owner restricted this to pay at campsite
  const isPayAtCampsite = (booking.campsite as any)?.payment_mode === 'pay_at_campsite';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        {booking.campsite?.image_url ? (
          <Image
            source={{ uri: imgSrc(booking.campsite.image_url) }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1504280385913-2052e734ce4c?q=80&w=1000&auto=format&fit=crop' }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.cardBody}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Booking #{booking.id}</Text>
            <View style={[styles.badge, isPaid ? styles.badgePaid : styles.badgePending]}>
              <Text style={[styles.badgeText, isPaid ? styles.badgeTextPaid : styles.badgeTextPending]}>
                {isPaid ? 'PAID' : 'PENDING'}
              </Text>
            </View>
          </View>

          <Text style={styles.campsiteName}>{booking.campsite?.name || 'Campsite'}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <Text style={styles.locationText}>{booking.campsite?.location || 'Location'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
            <Text style={styles.detailText}>
              {new Date(booking.check_in || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(booking.check_out || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="people-outline" size={18} color={colors.textMuted} />
            <Text style={styles.detailText}>{booking.guests} guest(s)</Text>
          </View>

          <View style={{ marginTop: 16, backgroundColor: "#fffbeb", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#fde68a" }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Ionicons name="time-outline" size={18} color="#d97706" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#92400e" }}>Check-in / Check-out Policy</Text>
            </View>
            <View style={{ paddingLeft: 24 }}>
              <Text style={{ fontSize: 13, color: "#92400e", marginBottom: 4 }}>Check-in: <Text style={{ fontWeight: "700" }}>after 2:00 PM</Text></Text>
              <Text style={{ fontSize: 13, color: "#92400e" }}>Check-out: <Text style={{ fontWeight: "700" }}>before 12:00 PM</Text></Text>
              <Text style={{ fontSize: 11, fontStyle: 'italic', color: '#b45309', marginTop: 6 }}>Need an early check-in? Contact the host.</Text>
              {booking.preferred_arrival && (
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#92400e", marginTop: 8 }}>
                  Your preferred arrival: {booking.preferred_arrival}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Campsite Fee</Text>
            <Text style={styles.priceValueSmall}>₱{Number(booking.total_price).toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Service Fee</Text>
            <Text style={[styles.priceValueSmall, { color: colors.gearupGreen }]}>Free</Text>
          </View>

          <View style={[styles.divider, { marginVertical: 12 }]} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₱{Number(booking.total_price).toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {isPaid ? (
        <View style={styles.successPanel}>
          <Ionicons name="checkmark-circle" size={44} color="#065f46" />
          <Text style={styles.successText}>Payment Received!</Text>
          <Text style={styles.successSubtext}>Your booking is confirmed.</Text>
        </View>
      ) : isCash || isPayAtCampsite ? (
        <View style={styles.cashNotice}>
          <Ionicons name="cash-outline" size={36} color="#92400e" />
          <Text style={styles.cashNoticeTitle}>Pay at Campsite</Text>
          <Text style={styles.cashNoticeText}>
            {isPayAtCampsite 
                            ? `This campsite requires cash payment upon arrival. Please prepare ₱${Number(booking.total_price).toFixed(2)} for your visit.`
              : `Please pay ₱${Number(booking.total_price).toFixed(2)} to the host when you arrive.`}
          </Text>
        </View>
      ) : (
        <View>
          <TouchableOpacity
            onPress={handlePay}
            disabled={paying}
            style={[styles.payButton, paying && { opacity: 0.7 }]}
          >
            <Text style={styles.payButtonText}>
              {paying ? 'Processing...' : `Pay Now - ₱${Number(booking.total_price).toFixed(2)}`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCashPay}
            disabled={paying}
            style={[styles.cashButton, paying && { opacity: 0.7 }]}
          >
            <Text style={styles.cashButtonText}>
              {paying ? 'Processing...' : 'Pay with Cash (Pay on Arrival)'}
            </Text>
          </TouchableOpacity>
          <View style={styles.trustRow}>
            <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} />
            <Text style={styles.trustText}>Secured by PayMongo</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f4f8' },
  content: { padding: 20, paddingTop: 64, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: 'white', borderRadius: 20, overflow: 'hidden', marginBottom: 24, elevation: 4 },
  coverImage: { width: '100%', height: 170, backgroundColor: '#e5e7eb' },
  cardBody: { padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgePending: { backgroundColor: '#fef3c7' },
  badgePaid: { backgroundColor: '#d1fae5' },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  badgeTextPending: { color: '#b45309' },
  badgeTextPaid: { color: '#065f46' },
  campsiteName: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 14, color: colors.textMuted },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  detailText: { fontSize: 15, color: '#374151' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  priceLabel: { fontSize: 14, color: colors.textMuted },
  priceValueSmall: { fontSize: 14, fontWeight: '500', color: '#374151' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#111827' },
  totalValue: { fontSize: 24, fontWeight: '700', color: colors.gearupGreen },
  payButton: { backgroundColor: colors.gearupGreen, paddingVertical: 16, borderRadius: 14, alignItems: 'center', elevation: 5 },
  payButtonText: { color: 'white', fontWeight: '700', fontSize: 18 },
  cashButton: { backgroundColor: 'white', borderWidth: 2, borderColor: colors.gearupGreen, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  cashButtonText: { color: colors.gearupGreen, fontWeight: '700', fontSize: 16 },
  cashNotice: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 12, padding: 20, alignItems: 'center' },
  cashNoticeTitle: { fontSize: 16, fontWeight: '700', color: '#92400e', marginTop: 8 },
  cashNoticeText: { fontSize: 13, color: '#b45309', textAlign: 'center', marginTop: 4 },
  trustRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 14 },
  trustText: { fontSize: 12, color: colors.textMuted },
  successPanel: { backgroundColor: '#ecfdf5', paddingVertical: 28, paddingHorizontal: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#a7f3d0' },
  successText: { fontSize: 20, fontWeight: '700', color: '#065f46', marginTop: 8 },
  successSubtext: { fontSize: 14, color: '#047857', marginTop: 4 },
});
