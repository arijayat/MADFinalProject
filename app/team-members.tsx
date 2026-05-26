import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { PrimaryButton } from "@/components/wireframe/PrimaryButton";
import { WireScreen } from "@/components/wireframe/WireScreen";
import { Wireframe } from "@/constants/wireframe-theme";
import { useTeam } from "@/contexts/TeamContext";

export default function TeamMembersScreen() {
  const router = useRouter();
  const { teamName, members, addMember } = useTeam();
  const [name, setName] = useState("");

  return (
    <WireScreen
      footer={
        <PrimaryButton
          label="CONTINUE"
          style={styles.primaryButton}
          onPress={() => router.replace("/(tabs)")}
        />
      }
    >
      <View style={styles.content}>
        <Text style={styles.heading}>TEAM MEMBERS</Text>
        <Text style={styles.sub}>Add all members of {teamName}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Member 1 Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter the team member name"
            placeholderTextColor={Wireframe.placeholder}
            value={name}
            onChangeText={setName}
          />
        </View>
        <PrimaryButton
          variant="light"
          label="ADD MEMBER"
          style={styles.secondaryButton}
          onPress={() => {
            if (name.trim()) {
              addMember(name.trim());
              setName("");
            }
          }}
        />

        {members.length > 0 ? (
          <View style={styles.added}>
            <Text style={styles.addedTitle}>Added ({members.length})</Text>
            {members.map((m) => (
              <Text key={m.id} style={styles.addedRow}>
                • {m.name}
              </Text>
            ))}
          </View>
        ) : null}
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
  secondaryButton: {
    width: "100%",
    marginTop: 16,
  },
  added: {
    marginTop: 24,
  },
  addedTitle: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 10,
  },
  addedRow: {
    color: Wireframe.panelBg,
    fontSize: 14,
    marginBottom: 6,
  },
  primaryButton: {
    width: "100%",
  },
});
