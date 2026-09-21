import { View, Text, StyleSheet } from 'react-native';

interface Props {
  rating: number;
  size?: number;
  showValue?: boolean;
}

export function StarRating({ rating, size = 14, showValue = false }: Props) {
  const rounded = Math.round(rating * 2) / 2;

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((i) => {
        const isFilled = i <= rounded;
        return (
          <Text
            key={i}
            style={[
              { fontSize: size },
              isFilled ? styles.filled : styles.empty,
            ]}
          >
            ★
          </Text>
        );
      })}
      {showValue && (
        <Text style={[styles.value, { fontSize: size }]}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  filled: { color: '#f59e0b' },
  empty: { color: '#d1d5db' },
  value: { color: '#111827', fontWeight: '800', marginLeft: 6 },
});