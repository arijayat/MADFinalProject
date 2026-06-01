import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenHeader } from '@/components/wireframe/BackNav';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { Wireframe } from '@/constants/wireframe-theme';
import { useAuth } from '@/contexts/AuthContext';

export default function LogInScreen() {
  const router = useRouter();
  const { signIn, refreshProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
          disabled={submitting}
        />
      }>
      <ScreenHeader
        backLabel="Back"
        onBack={() => router.back()}
        title="Log in"
        subtitle="Use the email and password from your Firebase account."
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
          placeholder="••••••••"
          placeholderTextColor={Wireframe.placeholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!submitting}
        />
      </View>

      {submitting ? <ActivityIndicator color={Wireframe.panelBg} style={styles.spinner} /> : null}

      <Pressable onPress={() => router.push('/create-account')} disabled={submitting}>
        <Text style={styles.link}>Need an account? Create one</Text>
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
