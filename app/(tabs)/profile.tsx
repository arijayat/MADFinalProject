import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { EditableField } from '@/components/wireframe/EditableField';
import { EditableSection } from '@/components/wireframe/EditableSection';
import { LogOutNav } from '@/components/wireframe/LogOutNav';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { Wireframe } from '@/constants/wireframe-theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalization } from '@/contexts/LocalizationContext';

export default function ProfileTabScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t } = useLocalization();
  const { user, profile, updateDisplayName } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');

  useEffect(() => {
    setDisplayName(profile?.displayName ?? '');
  }, [profile?.displayName]);

  function resetAccountDrafts() {
    setDisplayName(profile?.displayName ?? '');
  }

  async function handleSaveAccount() {
    try {
      await updateDisplayName(displayName);
      Alert.alert(t('saved'), t('accountSaved'));
    } catch (error) {
      Alert.alert(
        t('accountSaveFailed'),
        error instanceof Error ? error.message : t('tryAgain'),
      );
      throw error;
    }
  }

  return (
    <WireScreen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{t('account')}</Text>
        <Text style={styles.headerTitle}>{t('profile')}</Text>
        <Text style={styles.headerSubtitle}>{t('profileSubtitle')}</Text>
      </View>

      <View
        style={[
          styles.profileCard,
          {
            backgroundColor: colors.panelBg,
            borderColor: colors.border,
            boxShadow: colors.shadow,
          },
        ]}>
        <View style={[styles.profileAvatar, { backgroundColor: colors.accentSoft }]}>
          <Text style={styles.profileInitial}>
            {((profile?.displayName || user?.email || '?').trim()[0] ?? '?').toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>
            {profile?.displayName || t('student')}
          </Text>
          <Text style={[styles.profileEmail, { color: colors.textMuted }]} numberOfLines={1}>
            {user?.email ?? profile?.email ?? t('noEmail')}
          </Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [
            styles.settingsButton,
            {
              backgroundColor: colors.panelBg,
              borderColor: colors.border,
              boxShadow: colors.shadow,
            },
            pressed && styles.pressed,
          ]}>
          <MaterialIcons name="settings" size={20} color={Wireframe.accent} />
          <Text style={[styles.settingsText, { color: colors.text }]}>{t('settings')}</Text>
          <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
        </Pressable>
        <LogOutNav variant="panel" />
      </View>

      <EditableSection
        title={t('account')}
        onSave={handleSaveAccount}
        onCancel={resetAccountDrafts}>
        {(editing) => (
          <>
            <EditableField
              label={t('email')}
              value={user?.email ?? profile?.email ?? ''}
              editable={false}
            />
            <EditableField
              label={t('displayName')}
              value={displayName}
              onChangeText={setDisplayName}
              editable={editing}
              placeholder={t('enterDisplayName')}
            />
          </>
        )}
      </EditableSection>
    </WireScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 4,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: Wireframe.panelBg,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 2,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  profileCard: {
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
  profileAvatar: {
    width: 54,
    height: 54,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Wireframe.accentSoft,
  },
  profileInitial: {
    color: Wireframe.accent,
    fontSize: 22,
    fontWeight: '900',
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    color: Wireframe.text,
    fontSize: 18,
    fontWeight: '900',
  },
  profileEmail: {
    color: Wireframe.textMuted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  settingsButton: {
    minHeight: 54,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Wireframe.panelBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Wireframe.border,
    paddingHorizontal: 12,
    boxShadow: Wireframe.shadow,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  settingsText: {
    color: Wireframe.text,
    fontSize: 13,
    fontWeight: '900',
  },
});
