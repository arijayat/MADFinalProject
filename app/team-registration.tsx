import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenHeader } from "@/components/wireframe/BackNav";
import { PrimaryButton } from "@/components/wireframe/PrimaryButton";
import { WireScreen } from "@/components/wireframe/WireScreen";
import { Wireframe } from "@/constants/wireframe-theme";
import { useAppTheme } from "@/contexts/AppThemeContext";
import { useTeam } from "@/contexts/TeamContext";
import { validateTeamName } from "@/utils/team-name-filter";

export default function TeamRegistrationScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { teamName, setTeamName, gradeLevel, setGradeLevel } = useTeam();
  const [grade, setGrade] = useState(gradeLevel);
  const canContinue = teamName.trim().length > 0 && grade.trim().length > 0;

  function handleContinue() {
    const trimmedName = teamName.trim();
    const trimmedGrade = grade.trim();

    if (!trimmedName) {
      Alert.alert("Missing team name", "Enter a team name before continuing.");
      return;
    }

    if (!trimmedGrade) {
      Alert.alert("Missing grade level", "Enter a grade level before continuing.");
      return;
    }

    try {
      validateTeamName(trimmedName);
    } catch (error) {
      Alert.alert(
        "Team name not allowed",
        error instanceof Error ? error.message : "Choose a different team name.",
      );
      return;
    }

    setTeamName(trimmedName);
    setGradeLevel(trimmedGrade);
    router.push("/team-members");
  }

  return (
    <WireScreen
      footer={
        <PrimaryButton
          label="CONTINUE"
          style={styles.primaryButton}
          disabled={!canContinue}
          onPress={handleContinue}
        />
      }
    >
      <ScreenHeader
        backLabel="Back"
        onBack={() => router.back()}
        title="Team registration"
        subtitle="Create your team to get started."
      />

      <View style={styles.content}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.headerText }]}>Team Name</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.panelBg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Enter your team name"
            placeholderTextColor={Wireframe.placeholder}
            value={teamName}
            onChangeText={setTeamName}
          />
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.headerText }]}>Grade Level</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.panelBg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Select Grade Level (e.g. 6)"
            placeholderTextColor={Wireframe.placeholder}
            value={grade}
            onChangeText={setGrade}
          />
        </View>
      </View>
    </WireScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  field: {
    marginBottom: 18,
  },
  label: {
    color: Wireframe.panelBg,
    fontSize: 13,
    fontWeight: "600",
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
    width: "100%",
  },
});
