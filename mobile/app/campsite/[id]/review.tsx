import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { reviews } from '../../../lib/api';
import { colors } from '../../../theme';

export default function NewReviewScreen() {
  const router = useRouter();
  const { id, bookingId } = useLocalSearchParams<{
    id: string;
    bookingId: string;
  }>();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);

    try {
      await reviews.create(id, {
        booking_id: Number(bookingId),
        rating,
        comment: comment.trim() || undefined,
      });
      router.back();
    } catch (err: any) {
      const data = err.response?.data;
      const message =
        data?.errors?.booking_id?.[0] ??
        data?.errors?.rating?.[0] ??
        data?.message ??
        'Could not submit review.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f9fafb' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave a Review</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Share your experience</Text>
          <Text style={styles.subtitle}>
            Your review helps other campers make better decisions.
          </Text>

          {/* Star picker */}
          <Text style={styles.label}>Your rating</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setRating(i)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Text
                  style={[
                    styles.star,
                    i <= rating ? styles.starFilled : styles.starEmpty,
                  ]}
                >
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingHint}>
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very good'}
            {rating === 5 && 'Excellent'}
          </Text>

          {/* Comment */}
          <Text style={[styles.label, { marginTop: 20 }]}>
            Your review (optional)
          </Text>
          <TextInput
            style={styles.textarea}
            value={comment}
            onChangeText={setComment}
            placeholder="What was your stay like? What did you enjoy?"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={5}
            maxLength={1000}
          />
          <Text style={styles.charCount}>{comment.length} / 1000</Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submit, submitting && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Post review</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 55,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },

  scrollContent: { padding: 20 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  title: { fontSize: 20, fontWeight: '900', color: '#111827' },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 20,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
  },
  stars: { flexDirection: 'row', gap: 8 },
  star: { fontSize: 44 },
  starFilled: { color: '#f59e0b' },
  starEmpty: { color: '#d1d5db' },
  ratingHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
    fontWeight: '600',
  },

  textarea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fff',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },

  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },
  errorText: { fontSize: 13, color: '#dc2626' },

  submit: {
    backgroundColor: colors.gearupGreen,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});