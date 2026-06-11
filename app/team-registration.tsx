import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";

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

  return (
    <WireScreen
      footer={
        <PrimaryButton
          label="CONTINUE"
          style={styles.primaryButton}
          onPress={() => {
            try {
              if (teamName.trim()) validateTeamName(teamName);
            } catch (error) {
              Alert.alert(
                "Team name not allowed",
                error instanceof Error ? error.message : "Choose a different team name.",
              );
              return;
            }
            setGradeLevel(grade);
            router.push("/team-members");
          }}
        />
      }
    >
      <View style={styles.content}>
        <Text style={[styles.heading, { color: colors.headerText }]}>TEAM REGISTRATION</Text>
        <Text style={[styles.sub, { color: colors.headerSubtle }]}>Create your team to get started</Text>

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
    paddingTop: 24,
  },
  heading: {
    color: Wireframe.panelBg,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  sub: {
    color: "#cfcfcf",
    marginBottom: 24,
    marginTop: 4,
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
