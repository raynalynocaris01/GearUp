import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import {
  EMPTY_FILTERS,
  type FilterState,
  type PriceRange,
} from './FilterChips';

const PRICE_OPTIONS: { key: Exclude<PriceRange, null>; label: string }[] = [
  { key: 'under-150', label: 'Under ₱150' },
  { key: '150-250', label: '₱150 – ₱250' },
  { key: '250-400', label: '₱250 – ₱400' },
  { key: 'over-400', label: '₱400+' },
];

const RATING_OPTIONS = [4.0, 4.5, 4.8];

interface Props {
  visible: boolean;
  initial: FilterState;
  regions: string[];
  onApply: (filters: FilterState) => void;
  onClose: () => void;
}

export function FilterModal({
  visible,
  initial,
  regions,
  onApply,
  onClose,
}: Props) {
  // Local draft state — only lifted up on Apply
  const [draft, setDraft] = React.useState<FilterState>(initial);

  // Sync draft when modal opens with new initial values
  React.useEffect(() => {
    if (visible) setDraft(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleReset = () => {
    setDraft({ ...EMPTY_FILTERS, search: initial.search });
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Region */}
            {regions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Region</Text>
                <View style={styles.chipWrap}>
                  {regions.map((r) => {
                    const active = draft.region === r;
                    return (
                      <TouchableOpacity
                        key={r}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() =>
                          setDraft((d) => ({
                            ...d,
                            region: active ? null : r,
                          }))
                        }
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            active && styles.chipTextActive,
                          ]}
                        >
                          {r}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Price */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Price per night</Text>
              <View style={styles.chipWrap}>
                {PRICE_OPTIONS.map((p) => {
                  const active = draft.priceRange === p.key;
                  return (
                    <TouchableOpacity
                      key={p.key}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() =>
                        setDraft((d) => ({
                          ...d,
                          priceRange: active ? null : p.key,
                        }))
                      }
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Rating */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Minimum rating</Text>
              <View style={styles.chipWrap}>
                {RATING_OPTIONS.map((r) => {
                  const active = draft.minRating === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() =>
                        setDraft((d) => ({
                          ...d,
                          minRating: active ? null : r,
                        }))
                      }
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name="star"
                        size={11}
                        color={active ? '#fff' : '#f59e0b'}
                      />
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {r}+
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
              activeOpacity={0.85}
            >
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApply}
              activeOpacity={0.85}
            >
              <Text style={styles.applyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d1d5db',
    alignSelf: 'center',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: { fontSize: 18, fontWeight: '900', color: '#111827' },
  closeButton: { padding: 4 },

  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipActive: {
    backgroundColor: colors.gearupGreen,
    borderColor: colors.gearupGreen,
  },
  chipText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  resetText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.gearupGreen,
  },
  applyText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});