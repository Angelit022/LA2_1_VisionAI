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
import { analyzeImage, imageToBase64 } from "../lib/gemini";
import { detectObjects } from "../lib/roboflow";

const PROMPTS = {
  academic: `Act as a university professor. Looking at this image, provide an academic-style analysis: identify the objects present, describe the educational context, and give one piece of constructive feedback. Respond ONLY with valid JSON in this exact shape: { "objects": ["...", "..."], "context": "...", "activities": "...", "recommendations": "..." }`,
  safety: `Act as a workplace safety inspector. Looking at this image, identify any visible hazards, risks, or safety concerns. If none are visible, state that clearly. Respond ONLY with valid JSON in this exact shape: { "objects": ["...", "..."], "context": "...", "activities": "...", "recommendations": "..." }`,
  inventory: `Act as an asset management clerk. Looking at this image, list every visible physical asset as a clean inventory list. In the other fields, keep the responses short and factual. Respond ONLY with valid JSON in this exact shape: { "objects": ["...", "..."], "context": "...", "activities": "...", "recommendations": "..." }`,
} as const;

type AnalysisResult = {
  objects: string[];
  context: string;
  activities: string;
  recommendations: string;
};

type PromptKey = keyof typeof PROMPTS;

export default function ResultScreen() {
  const params = useLocalSearchParams<{
    photoUri: string;
    promptKey?: string;
  }>();
  const { photoUri, promptKey } = params;
  const selectedPromptKey =
    promptKey && PROMPTS[promptKey as PromptKey]
      ? (promptKey as PromptKey)
      : "academic";
  const selectedPrompt = PROMPTS[selectedPromptKey];
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

  function parseResultText(text: string) {
    const cleaned = stripMarkdownFences(text);
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    return JSON.parse(cleaned);
  }

  const runAnalysis = async () => {
    if (!photoUri) {
      setError("No image provided.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);
    setDetections([]);

    try {
      const base64Image = await imageToBase64(photoUri);
      const [json, found] = await Promise.all([
        analyzeImage(base64Image, selectedPrompt),
        detectObjects(base64Image),
      ]);

      const textPart = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textPart) {
        throw new Error("Empty response from Gemini");
      }

      const parsed = parseResultText(textPart) as AnalysisResult;
      setAnalysis(parsed);
      setDetections(found);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Could not analyze this image. ${message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, [photoUri]);

  if (!photoUri) {
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
