import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { WireScreen } from '@/components/wireframe/WireScreen';
import { Wireframe } from '@/constants/wireframe-theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  availableLanguages,
  useLocalization,
  type AppLanguage,
} from '@/contexts/LocalizationContext';
import {
  cancelAllScheduledNotifications,
  ensureNotificationPermissions,
} from '@/lib/notifications/notifications';
import { updateUserPreferences } from '@/lib/firestore/users';
import { defaultUserPreferences } from '@/types/firestore';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, mode, toggleMode } = useAppTheme();
  const { user, profile } = useAuth();
  const { language, languageName, setLanguage, t } = useLocalization();
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    defaultUserPreferences.notificationsEnabled,
  );

  useEffect(() => {
    const saved = profile?.preferences?.notificationsEnabled;
    if (typeof saved === 'boolean') {
      setNotificationsEnabled(saved);
    }
  }, [profile?.preferences?.notificationsEnabled]);

  const toggleNotifications = useCallback(
    async (nextValue: boolean) => {
      setNotificationsEnabled(nextValue);

      if (!user) return;

      if (nextValue) {
        const granted = await ensureNotificationPermissions();
        if (!granted) {
          setNotificationsEnabled(false);
          Alert.alert(t('notifications'), t('notificationsDisabledHint'), [
            { text: t('cancel'), style: 'cancel' },
            {
              text: t('settings'),
              onPress: () => {
                if (Platform.OS === 'ios') {
                  void Linking.openURL('app-settings:');
                } else {
                  void Linking.openSettings();
                }
              },
            },
          ]);
          return;
        }
      } else {
        await cancelAllScheduledNotifications();
      }

      try {
        await updateUserPreferences(user.uid, { notificationsEnabled: nextValue });
      } catch (error) {
        setNotificationsEnabled(!nextValue);
        console.error('Failed to save notification preference', error);
      }
    },
    [user, t],
  );

  return (
    <WireScreen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <MaterialIcons name="chevron-left" size={22} color={Wireframe.panelBg} />
          <Text style={styles.backText}>{t('back')}</Text>
        </Pressable>
        <Text style={styles.eyebrow}>{t('appPreferences')}</Text>
        <Text style={styles.title}>{t('settings')}</Text>
        <Text style={styles.subtitle}>{t('settingsSubtitle')}</Text>
      </View>

      <Text style={styles.sectionLabel}>{t('appearance')}</Text>
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
          <Text style={[styles.settingTitle, { color: colors.text }]}>{t('darkMode')}</Text>
          <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
            {t('currentMode', { mode: mode === 'dark' ? t('dark') : t('light') })}
          </Text>
        </View>
        <Switch
          value={isDark}
          onValueChange={toggleMode}
          trackColor={{ false: colors.border, true: colors.accentSoft }}
          thumbColor={isDark ? Wireframe.accent : colors.panelBg}
        />
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
          <MaterialIcons name="language" size={22} color={Wireframe.accent} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>{t('language')}</Text>
          <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
            {t('languageSubtitle', { language: languageName })}
          </Text>
          <View style={[styles.languageToggle, { backgroundColor: colors.surfaceAlt }]}>
            {availableLanguages.map((option) => {
              const selected = language === option.code;
              return (
                <Pressable
                  key={option.code}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setLanguage(option.code as AppLanguage)}
                  style={[
                    styles.languageButton,
                    selected && {
                      backgroundColor: colors.panelBg,
                      borderColor: colors.border,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.languageButtonText,
                      { color: selected ? colors.text : colors.textMuted },
                    ]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>{t('notifications')}</Text>
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
          <MaterialIcons name="notifications" size={22} color={Wireframe.accent} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>{t('notifications')}</Text>
          <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
            {t('notificationsSubtitle')}
          </Text>
        </View>
        <Switch
          value={notificationsEnabled}
          onValueChange={toggleNotifications}
          trackColor={{ false: colors.border, true: colors.accentSoft }}
          thumbColor={notificationsEnabled ? Wireframe.accent : colors.panelBg}
        />
      </View>

      <Text style={styles.sectionLabel}>{t('security')}</Text>
      <Pressable
        onPress={() => router.push('/change-password')}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.panelBg,
            borderColor: colors.border,
            boxShadow: colors.shadow,
            opacity: pressed ? 0.88 : 1,
          },
        ]}>
        <View style={[styles.settingIcon, { backgroundColor: colors.accentSoft }]}>
          <MaterialIcons name="lock" size={22} color={Wireframe.accent} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>{t('changePassword')}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
      </Pressable>
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
  sectionLabel: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
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
  languageToggle: {
    flexDirection: 'row',
    gap: 6,
    borderRadius: 8,
    padding: 4,
    marginTop: 10,
  },
  languageButton: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 8,
  },
  languageButtonText: {
    fontSize: 12,
    fontWeight: '900',
  },
});
