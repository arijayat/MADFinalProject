import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenHeader } from '@/components/wireframe/BackNav';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { Wireframe } from '@/constants/wireframe-theme';
import { useAuth } from '@/contexts/AuthContext';

export default function CreateAccountScreen() {
  const router = useRouter();
  const { signUp, refreshProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleCreateAccount() {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Enter your email and password.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Make sure both password fields match.');
      return;
    }

    setSubmitting(true);
    try {
      await signUp(email, password);
      const profile = await refreshProfile();
      router.replace(profile?.teamId ? '/(tabs)' : '/team-onboarding');
    } catch (error) {
      Alert.alert('Could not create account', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <WireScreen
      footer={
        <PrimaryButton
          label={submitting ? 'CREATING…' : 'CREATE ACCOUNT'}
          style={styles.primaryButton}
          onPress={handleCreateAccount}
          disabled={submitting}
        />
      }>
      <ScreenHeader
        backLabel="Back"
        onBack={() => router.back()}
        title="Create account"
        subtitle="Sign up with email and password (Firebase Authentication)."
      />

      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@school.edu"
          placeholderTextColor={Wireframe.placeholder}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!submitting}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="At least 6 characters"
          placeholderTextColor={Wireframe.placeholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!submitting}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Confirm password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={Wireframe.placeholder}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!submitting}
        />
      </View>

      {submitting ? <ActivityIndicator color={Wireframe.panelBg} style={styles.spinner} /> : null}

      <Pressable onPress={() => router.replace('/log-in')} disabled={submitting}>
        <Text style={styles.link}>Already have an account? Log in</Text>
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
