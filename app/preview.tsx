import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function PreviewScreen() {
  const router = useRouter();
  const { photoUri } = useLocalSearchParams<{ photoUri: string }>();

  async function handleAnalyze() {
    if (!photoUri) return;

    router.push({ pathname: "/result", params: { photoUri } });
  }

  if (!photoUri) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No photo available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: photoUri }} style={styles.preview} />
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.retakeButton}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Retake</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyze}>
          <Text style={styles.buttonText}>Analyze</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  preview: { flex: 1, resizeMode: "contain" },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
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
