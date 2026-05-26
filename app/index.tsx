import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Wireframe } from '@/constants/wireframe-theme';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace('/sign-in'), 2000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <Pressable style={styles.screen} onPress={() => router.replace('/sign-in')}>
      <View style={styles.logo} />
      <Text style={styles.hint}>Tap to continue</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Wireframe.panelBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    backgroundColor: '#d0d0d0',
    borderWidth: 1,
    borderColor: Wireframe.border,
  },
  hint: {
    marginTop: 24,
    fontSize: 13,
    color: Wireframe.textMuted,
  },
});
