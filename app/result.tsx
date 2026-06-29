import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { analyzeImage } from "../lib/gemini";
import { detectObjects } from "../lib/roboflow";

const ANALYSIS_PROMPT = `Analyze this image. Identify:
1. Objects - list the distinct physical objects you see
2. Context - briefly describe the setting or scene
3. Activities - what activity appears to be happening, if any
4. Recommendations - one practical suggestion based on the scene
Respond ONLY with valid JSON in this exact shape, no extra text:
{
  "objects": ["...", "..."],
  "context": "...",
  "activities": "...",
  "recommendations": "..."
}
`;

type AnalysisResult = {
  objects: string[];
  context: string;
  activities: string;
  recommendations: string;
};

export default function ResultScreen() {
  const { base64Image } = useLocalSearchParams<{ base64Image: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [detections, setDetections] = useState<any[]>([]);

  function stripMarkdownFences(text: string) {
    return text
      .replace(/^```\w*\n/, "")
      .replace(/\n```$/, "")
      .trim();
  }

  const runAnalysis = async () => {
    if (!base64Image) {
      setError("No image provided.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);
    setDetections([]);

    try {
      const [json, found] = await Promise.all([
        analyzeImage(base64Image, ANALYSIS_PROMPT),
        detectObjects(base64Image),
      ]);

      const textPart = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textPart) {
        throw new Error("Empty response from Gemini");
      }

      const cleanedText = stripMarkdownFences(textPart);
      const parsed = JSON.parse(cleanedText) as AnalysisResult;
      setAnalysis(parsed);
      setDetections(found);
    } catch (err) {
      setError("Could not analyze this image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, [base64Image]);

  if (!base64Image) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No image to analyze</Text>
        <Text style={styles.subtitle}>
          Please retake a photo and try again.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#5B3FA3" />
        <Text style={styles.loadingText}>Analyzing image...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={runAnalysis}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Objects</Text>
      {analysis?.objects.map((obj, index) => (
        <Text key={index} style={styles.listItem}>
          • {obj}
        </Text>
      ))}

      <Text style={styles.sectionTitle}>Context</Text>
      <Text style={styles.bodyText}>{analysis?.context}</Text>

      <Text style={styles.sectionTitle}>Activities</Text>
      <Text style={styles.bodyText}>{analysis?.activities}</Text>

      <Text style={styles.sectionTitle}>Recommendations</Text>
      <Text style={styles.bodyText}>{analysis?.recommendations}</Text>

      <Text style={styles.sectionTitle}>Detected Objects (Roboflow)</Text>
      {detections.length === 0 ? (
        <Text style={styles.bodyText}>
          No objects detected above the confidence threshold.
        </Text>
      ) : (
        detections.map((d, i) => (
          <Text key={i} style={styles.listItem}>
            • {d.class} — {(d.confidence * 100).toFixed(1)}% confidence
          </Text>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#000",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  subtitle: {
    color: "#ccc",
    fontSize: 16,
    textAlign: "center",
  },
  errorText: {
    color: "#ff6666",
    fontSize: 16,
  },
  resultText: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "monospace",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 12,
  },
  bodyText: {
    color: "#ddd",
    fontSize: 16,
    marginBottom: 12,
  },
  listItem: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 8,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#000",
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
    marginTop: 16,
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#5B3FA3",
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
