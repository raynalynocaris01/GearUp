import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

interface Props {
  title: string;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    color?: string;
  };
}

export function OwnerHeader({ title, rightAction }: Props) {
  const navigation = useNavigation();

  const openDrawer = () => {
    const nav = navigation as any;
    if (nav.openDrawer) nav.openDrawer();
    else if (nav.toggleDrawer) nav.toggleDrawer();
    else if (nav.dispatch) nav.dispatch({ type: 'OPEN_DRAWER' });
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={openDrawer}
        accessibilityLabel="Open menu"
      >
        <Ionicons name="menu" size={26} color="#111827" />
      </TouchableOpacity>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {rightAction ? (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={rightAction.onPress}
          accessibilityLabel="Action"
        >
          <Ionicons
            name={rightAction.icon}
            size={24}
            color={rightAction.color ?? colors.gearupGreen}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconButton} />
      )}
    </View>
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
  iconButton: {
    width: 32,
    padding: 4,
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
});