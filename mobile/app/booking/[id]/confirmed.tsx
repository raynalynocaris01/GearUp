import React, { useEffect, useState } from 'react';

import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { bookings } from '../../../lib/api';
import type { Booking } from '@gearup/shared';
import { colors } from '../../../theme';

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

  useFocusEffect(() => {
    fetchBooking();
  });

  const handlePay = async () => {
    if (!booking) return;
    setPaying(true);
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const url = 'http://192.168.0.102:8000/api/bookings/' + booking.id + '/pay';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          redirect_url: 'exp://192.168.0.102:8081/--/booking/' + booking.id + '/confirmed'
        })
      });
      const data = await res.json(); console.log('PAY_RESPONSE:', data);
      if (data.checkout_url) {
        await WebBrowser.openBrowserAsync(data.checkout_url);
        // Re-fetch when browser closes in case webhook updated it
        fetchBooking();
      } else {
        
      }
    } catch (e) {
      
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: 40 }]}>
      <View style={styles.card}>
        <Text style={styles.title}>Booking #{booking.id}</Text>
        
        {booking.payment_status === 'paid' ? (
          <View style={styles.paidBox}>
            <Text style={styles.paidText}>Payment Received!</Text>
          </View>
        ) : (
          <TouchableOpacity 
            onPress={handlePay} 
            disabled={paying}
            style={[styles.payButton, { marginHorizontal: 20 }]}
          >
            <Text style={styles.payButtonText}>
              {paying ? 'Processing...' : 'Pay Now - ₱' + booking.total_price}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 20, elevation: 2 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  paidBox: { backgroundColor: '#d1fae5', padding: 15, borderRadius: 8, alignItems: 'center' },
  paidText: { color: '#065f46', fontWeight: 'bold', fontSize: 16 },
  payButton: { backgroundColor: colors.gearupGreen, padding: 15, borderRadius: 8, alignItems: 'center' },
  payButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
