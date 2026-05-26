import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenHeader } from '@/components/wireframe/BackNav';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { Wireframe } from '@/constants/wireframe-theme';

export default function LogInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <WireScreen
      footer={
        <PrimaryButton
          label="LOG IN"
          style={styles.primaryButton}
          onPress={() => router.push('/team-onboarding')}
        />
      }>
      <ScreenHeader
        backLabel="Back"
        onBack={() => router.back()}
        title="Log in"
        subtitle="Use your school email and password (wireframe — no real auth yet)."
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
        />
      </View>
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
});
