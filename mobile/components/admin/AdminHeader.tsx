import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  title: string;
}

export function AdminHeader({ title }: Props) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const openDrawer = () => {
    const nav = navigation as any;
    if (nav.openDrawer) nav.openDrawer();
    else if (nav.toggleDrawer) nav.toggleDrawer();
    else if (nav.dispatch) nav.dispatch({ type: 'OPEN_DRAWER' });
  };

  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top + 14 },
      ]}
    >
      <TouchableOpacity
        onPress={openDrawer}
        style={styles.iconBtn}
        accessibilityLabel="Open menu"
        activeOpacity={0.7}
      >
        <Ionicons name="menu" size={26} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.side}>
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>ADMIN</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#183d1d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  side: {
    width: 72,
    alignItems: 'flex-end',
  },
  iconBtn: {
    width: 32,
    padding: 2,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
  adminBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  adminBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
});