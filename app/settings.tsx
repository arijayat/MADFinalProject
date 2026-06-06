import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { WireScreen } from '@/components/wireframe/WireScreen';
import { Wireframe } from '@/constants/wireframe-theme';
import { useAppTheme } from '@/contexts/AppThemeContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, mode, toggleMode } = useAppTheme();

  return (
    <WireScreen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <MaterialIcons name="chevron-left" size={22} color={Wireframe.panelBg} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.eyebrow}>App preferences</Text>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Adjust how the app looks on this device.</Text>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.panelBg,
            borderColor: colors.border,
            boxShadow: colors.shadow,
          },
        ]}>
        <View style={[styles.settingIcon, { backgroundColor: colors.accentSoft }]}>
          <MaterialIcons
            name={isDark ? 'dark-mode' : 'light-mode'}
            size={22}
            color={Wireframe.accent}
          />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>Dark mode</Text>
          <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
            Current mode: {mode === 'dark' ? 'Dark' : 'Light'}
          </Text>
        </View>
        <Switch
          value={isDark}
          onValueChange={toggleMode}
          trackColor={{ false: colors.border, true: colors.accentSoft }}
          thumbColor={isDark ? Wireframe.accent : colors.panelBg}
        />
      </View>
    </WireScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    marginBottom: 8,
  },
  backText: {
    color: Wireframe.panelBg,
    fontSize: 13,
    fontWeight: '700',
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: Wireframe.panelBg,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 2,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Wireframe.panelBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Wireframe.border,
    padding: 14,
    boxShadow: Wireframe.shadow,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Wireframe.accentSoft,
  },
  settingText: {
    flex: 1,
    minWidth: 0,
  },
  settingTitle: {
    color: Wireframe.text,
    fontSize: 16,
    fontWeight: '900',
  },
  settingSubtitle: {
    color: Wireframe.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
});
