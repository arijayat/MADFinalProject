import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenHeader } from '@/components/wireframe/BackNav';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { Wireframe } from '@/constants/wireframe-theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useAuth } from '@/contexts/AuthContext';

export default function LogInScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { signIn, refreshProfile, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function handleForgotPassword() {
    if (!email.trim()) {
      Alert.alert('Enter your email', 'Type the email for your account, then tap Forgot password again.');
      return;
    }

    setResetting(true);
    try {
      await resetPassword(email);
      Alert.alert(
        'Check your email',
        `If an account exists for ${email.trim()}, a password reset link has been sent. Open the link to set a new password.`,
      );
    } catch (error) {
      Alert.alert(
        'Could not send reset email',
        error instanceof Error ? error.message : 'Try again.',
      );
    } finally {
      setResetting(false);
    }
  }

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Enter your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email, password);
      const profile = await refreshProfile();
      router.replace(profile?.teamId ? '/(tabs)' : '/team-onboarding');
    } catch (error) {
      Alert.alert('Log in failed', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <WireScreen
      footer={
        <PrimaryButton
          label={submitting ? 'LOGGING IN…' : 'LOG IN'}
          style={styles.primaryButton}
          onPress={handleLogin}
          disabled={submitting || resetting}
        />
      }>
      <ScreenHeader
        backLabel="Back"
        onBack={() => router.back()}
        title="Log in"
        subtitle="Use the email and password from your Firebase account."
      />

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.headerText }]}>Email</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.panelBg,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          placeholder="you@school.edu"
          placeholderTextColor={Wireframe.placeholder}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!submitting && !resetting}
        />
      </View>
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.headerText }]}>Password</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.panelBg,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          placeholder="••••••••"
          placeholderTextColor={Wireframe.placeholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!submitting && !resetting}
        />
      </View>

      <Pressable
        onPress={handleForgotPassword}
        disabled={submitting || resetting}
        style={styles.forgotPassword}>
        <Text style={[styles.forgotPasswordText, { color: colors.headerText }]}>
          {resetting ? 'Sending reset link…' : 'Forgot password?'}
        </Text>
      </Pressable>

      {submitting || resetting ? (
        <ActivityIndicator color={colors.headerText} style={styles.spinner} />
      ) : null}

      <Pressable onPress={() => router.push('/create-account')} disabled={submitting || resetting}>
        <Text style={[styles.link, { color: colors.headerText }]}>Need an account? Create one</Text>
      </Pressable>
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
  forgotPassword: {
    alignSelf: 'flex-end',
    width: '100%',
    maxWidth: 420,
    marginTop: -10,
    marginBottom: 8,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    textAlign: 'right',
    color: Wireframe.panelBg,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  spinner: {
    marginTop: 8,
    marginBottom: 8,
  },
  link: {
    marginTop: 8,
    textAlign: 'center',
    color: Wireframe.panelBg,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
