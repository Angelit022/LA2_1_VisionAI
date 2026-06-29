import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

export async function imageToBase64(uri: string) {
  if (uri.startsWith("data:")) {
    return uri.split(",")[1] ?? "";
  }

  if (Platform.OS === "web") {
    const response = await fetch(uri);
    const blob = await response.blob();
    const data = await blob.arrayBuffer();
    return arrayBufferToBase64(data);
  }

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: "base64",
  });
  return base64;
}

export async function analyzeImage(base64Image: string, prompt: string) {
  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image,
              },
            },
          ],
        },
      ],
    }),
  });

  const responseText = await response.text();
  let json;

  try {
    json = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Gemini returned invalid JSON: ${responseText.slice(0, 200)}`,
    );
  }

  if (!response.ok) {
    const message = json?.error?.message ?? response.statusText;
    throw new Error(`Gemini request failed: ${message}`);
  }

  return json;
}
