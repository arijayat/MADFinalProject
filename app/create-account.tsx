import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenHeader } from '@/components/wireframe/BackNav';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { Wireframe } from '@/constants/wireframe-theme';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentPosition } from '@/lib/device/location';
import {
  geocodeSchoolName,
  nearbySchoolToLocation,
  searchNearbySchools,
  type NearbySchool,
} from '@/lib/device/nearby-schools';
import type { SchoolLocation } from '@/types/firestore';

export default function CreateAccountScreen() {
  const router = useRouter();
  const { signUp, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<SchoolLocation | null>(null);
  const [pickedSchoolName, setPickedSchoolName] = useState<string | null>(null);
  const [userPosition, setUserPosition] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );
  const [nearbySchools, setNearbySchools] = useState<NearbySchool[]>([]);
  const [schoolPickerOpen, setSchoolPickerOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleSchoolNameChange(value: string) {
    setSchoolName(value);
    setSelectedSchool(null);
    setPickedSchoolName(null);
  }

  function handleSelectSchool(school: NearbySchool) {
    const location = nearbySchoolToLocation(school);
    setSchoolName(school.name);
    setSelectedSchool(location);
    setPickedSchoolName(school.name);
    setSchoolPickerOpen(false);
  }

  async function handleFindNearbySchools() {
    setLocating(true);
    try {
      const position = await getCurrentPosition();
      setUserPosition(position);
      const schools = await searchNearbySchools(position.latitude, position.longitude);
      setNearbySchools(schools);
      setSchoolPickerOpen(true);
      if (schools.length === 0) {
        Alert.alert(
          'No schools found nearby',
          'Enter your school name manually in the field above.',
        );
      }
    } catch (error) {
      Alert.alert(
        'Could not get location',
        error instanceof Error ? error.message : 'Enable location services and try again.',
      );
    } finally {
      setLocating(false);
    }
  }

  async function resolveSchoolLocation(): Promise<SchoolLocation | null> {
    const trimmed = schoolName.trim();
    if (!trimmed) return null;

    if (selectedSchool && pickedSchoolName === trimmed) {
      return selectedSchool;
    }

    const geocoded = await geocodeSchoolName(
      trimmed,
      userPosition?.latitude,
      userPosition?.longitude,
    );
    if (geocoded) return geocoded;

    if (userPosition) {
      return {
        latitude: userPosition.latitude,
        longitude: userPosition.longitude,
        label: trimmed,
      };
    }

    return null;
  }

  async function handleCreateAccount() {
    if (!displayName.trim() || !email.trim() || !password) {
      Alert.alert('Missing fields', 'Enter your display name, email, and password.');
      return;
    }
    if (!schoolName.trim()) {
      Alert.alert(
        'School required',
        'Tap the location icon to find schools near you, or enter your school name manually.',
      );
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Make sure both password fields match.');
      return;
    }

    setSubmitting(true);
    try {
      const schoolLocation = await resolveSchoolLocation();
      if (!schoolLocation) {
        Alert.alert(
          'School location required',
          'Tap the location icon to find schools near you, or enter your school name manually.',
        );
        return;
      }

      await signUp(email, password, {
        displayName: displayName.trim(),
        schoolLocation,
      });
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
        <Text style={styles.label}>Display name</Text>
        <TextInput
          style={styles.input}
          placeholder="How teammates see you"
          placeholderTextColor={Wireframe.placeholder}
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          editable={!submitting}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>School</Text>
        <Text style={styles.hint}>
          Tap the location icon to see schools near you, or type your school name.
        </Text>
        <View style={styles.locationRow}>
          <TextInput
            style={[styles.input, styles.locationInput]}
            placeholder="School name"
            placeholderTextColor={Wireframe.placeholder}
            value={schoolName}
            onChangeText={handleSchoolNameChange}
            autoCapitalize="words"
            editable={!submitting}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Find schools near your location"
            style={[styles.locationButton, (locating || submitting) && styles.locationButtonDisabled]}
            onPress={handleFindNearbySchools}
            disabled={locating || submitting}>
            {locating ? (
              <ActivityIndicator color={Wireframe.panelBg} size="small" />
            ) : (
              <MaterialIcons name="location-on" size={24} color={Wireframe.panelBg} />
            )}
          </Pressable>
        </View>
      </View>
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

      <Modal visible={schoolPickerOpen} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setSchoolPickerOpen(false)}>
          <Pressable
            style={styles.modalCard}
            onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>Schools near you</Text>
            {nearbySchools.length === 0 ? (
              <Text style={styles.modalEmpty}>
                No schools found nearby. Close and enter your school manually.
              </Text>
            ) : (
              <FlatList
                data={nearbySchools}
                keyExtractor={(item) => item.id}
                style={styles.modalList}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <Pressable style={styles.schoolRow} onPress={() => handleSelectSchool(item)}>
                    <Text style={styles.schoolName}>{item.name}</Text>
                    {item.address ? (
                      <Text style={styles.schoolAddress}>{item.address}</Text>
                    ) : null}
                  </Pressable>
                )}
              />
            )}
            <Pressable style={styles.modalClose} onPress={() => setSchoolPickerOpen(false)}>
              <Text style={styles.modalCloseText}>Enter manually instead</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
  hint: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
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
  locationRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'stretch',
  },
  locationInput: {
    flex: 1,
  },
  locationButton: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Wireframe.accent,
    borderRadius: 4,
  },
  locationButtonDisabled: {
    opacity: 0.6,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.42)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: Wireframe.panelBg,
    borderRadius: 8,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: Wireframe.border,
    overflow: 'hidden',
    paddingTop: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Wireframe.text,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  modalEmpty: {
    fontSize: 14,
    color: Wireframe.textMuted,
    paddingHorizontal: 16,
    paddingBottom: 16,
    lineHeight: 20,
  },
  modalList: {
    maxHeight: 320,
  },
  schoolRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Wireframe.border,
  },
  schoolName: {
    fontSize: 15,
    fontWeight: '700',
    color: Wireframe.text,
  },
  schoolAddress: {
    fontSize: 13,
    color: Wireframe.textMuted,
    marginTop: 2,
  },
  modalClose: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Wireframe.border,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: Wireframe.accent,
    textDecorationLine: 'underline',
  },
});
