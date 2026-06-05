import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';

import { Wireframe } from '@/constants/wireframe-theme';
import { useAuth } from '@/contexts/AuthContext';
import { confirmAction } from '@/utils/confirm-alert';

export function LogOutNav() {
  const router = useRouter();
  const { logOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  async function performLogOut() {
    setLoggingOut(true);
    try {
      await logOut();
      router.replace('/sign-in');
    } catch (error) {
      Alert.alert(
        'Log out failed',
        error instanceof Error ? error.message : 'Try again.',
      );
    } finally {
      setLoggingOut(false);
    }
  }

  function handlePress() {
    if (loggingOut) return;

    confirmAction({
      title: 'Log out',
      message: 'Are you sure you want to sign out?',
      confirmLabel: 'Log out',
      onConfirm: performLogOut,
    });
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={loggingOut}
      style={({ pressed }) => [styles.row, pressed && !loggingOut && styles.pressed]}
      hitSlop={8}>
      <MaterialIcons name="logout" size={22} color={Wireframe.panelBg} />
      <Text style={styles.text}>{loggingOut ? 'Signing out…' : 'Log out'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  pressed: {
    opacity: 0.85,
  },
  text: {
    color: Wireframe.panelBg,
    fontSize: 13,
    fontWeight: '700',
  },
});
