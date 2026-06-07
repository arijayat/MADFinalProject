import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenHeader } from '@/components/wireframe/BackNav';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { Wireframe } from '@/constants/wireframe-theme';
import { useAuth } from '@/contexts/AuthContext';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { changePassword, user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) {
      Alert.alert('Missing fields', 'Enter your current password and a new password.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Password too short', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Make sure both new password fields match.');
      return;
    }
    if (currentPassword === newPassword) {
      Alert.alert('Same password', 'Choose a new password that is different from your current one.');
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      Alert.alert('Password updated', 'Your password has been changed successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert(
        'Could not change password',
        error instanceof Error ? error.message : 'Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <WireScreen
      footer={
        <PrimaryButton
          label={submitting ? 'UPDATING…' : 'UPDATE PASSWORD'}
          style={styles.primaryButton}
          onPress={handleChangePassword}
          disabled={submitting}
        />
      }>
      <ScreenHeader
        backLabel="Back"
        onBack={() => router.back()}
        title="Change password"
        subtitle={
          user?.email
            ? `Update the password for ${user.email}.`
            : 'Enter your current password, then choose a new one.'
        }
      />

      <View style={styles.field}>
        <Text style={styles.label}>Current password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={Wireframe.placeholder}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          editable={!submitting}
          autoCapitalize="none"
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>New password</Text>
        <TextInput
          style={styles.input}
          placeholder="At least 6 characters"
          placeholderTextColor={Wireframe.placeholder}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          editable={!submitting}
          autoCapitalize="none"
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Confirm new password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={Wireframe.placeholder}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!submitting}
          autoCapitalize="none"
        />
      </View>

      {submitting ? <ActivityIndicator color={Wireframe.panelBg} style={styles.spinner} /> : null}
    </WireScreen>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 18,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  label: {
    color: Wireframe.panelBg,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: Wireframe.panelBg,
    borderWidth: 1,
    borderColor: Wireframe.border,
    borderRadius: 4,
    padding: 14,
    fontSize: 15,
    color: Wireframe.text,
  },
  primaryButton: {
    width: '100%',
  },
  spinner: {
    marginTop: 8,
    marginBottom: 8,
  },
});
