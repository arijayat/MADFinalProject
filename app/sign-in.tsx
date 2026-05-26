import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/wireframe/PrimaryButton";
import { Wireframe } from "@/constants/wireframe-theme";

export default function SignInScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.centerContent}>
        <View style={styles.logo} />
        <Text style={styles.title}>GLOBAL APP</Text>
        <Text style={styles.subtitle}>
          Log in with your school account, or sign in with Google.
        </Text>
        <View style={styles.actions}>
          <PrimaryButton
            label="LOG IN"
            style={styles.button}
            onPress={() => router.push("/log-in")}
          />
          <PrimaryButton
            variant="light"
            label="SIGN IN WITH GOOGLE"
            style={styles.button}
            onPress={() => router.push("/team-onboarding")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Wireframe.panelBg,
    paddingHorizontal: 24,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 120,
    height: 120,
    backgroundColor: "#d0d0d0",
    borderWidth: 1,
    borderColor: Wireframe.border,
    borderRadius: 8,
  },
  title: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: Wireframe.text,
  },
  subtitle: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 14,
    color: Wireframe.textMuted,
    maxWidth: 320,
    lineHeight: 20,
  },
  actions: {
    width: "100%",
    maxWidth: 320,
    marginTop: 28,
    gap: 14,
  },
  button: {
    width: "100%",
  },
});
