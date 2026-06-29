import { useLocalSearchParams, useRouter } from "expo-router";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";

type PromptKey = "academic" | "safety" | "inventory";

export default function PreviewScreen() {
  const router = useRouter();
  const { photoUri } = useLocalSearchParams<{ photoUri: string }>();

  function analyzeWithPersona(persona: PromptKey) {
    if (!photoUri) return;

    router.push({
      pathname: "/result",
      params: { photoUri, promptKey: persona },
    });
  }

  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const imageHeight = Math.min(height * 0.55, 500);

  if (!photoUri) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No photo available.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Image
        source={{ uri: photoUri }}
        style={[
          styles.preview,
          {
            width: isTablet ? 600 : "100%",
            alignSelf: "center",
            height: imageHeight,
          },
        ]}
      />
      <View style={styles.personaRow}>
        <TouchableOpacity
          style={styles.personaButton}
          onPress={() => analyzeWithPersona("academic")}
        >
          <Text style={styles.buttonText}>Academic Analysis</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.personaButton}
          onPress={() => analyzeWithPersona("safety")}
        >
          <Text style={styles.buttonText}>Safety Analysis</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.personaButton}
          onPress={() => analyzeWithPersona("inventory")}
        >
          <Text style={styles.buttonText}>Inventory Analysis</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.retakeButton}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Retake</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  contentContainer: { paddingBottom: 24, alignItems: "center" },
  preview: { resizeMode: "contain" },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
  },
  personaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  personaButton: {
    backgroundColor: "#5B3FA3",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
    marginBottom: 12,
  },
  retakeButton: {
    backgroundColor: "#5A6472",
    padding: 14,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  analyzeButton: {
    backgroundColor: "#5B3FA3",
    padding: 14,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  emptyText: { color: "#fff", fontSize: 16 },
});
