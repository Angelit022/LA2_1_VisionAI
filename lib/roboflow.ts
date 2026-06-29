const ROBOFLOW_MODEL_ID = "coco";
const ROBOFLOW_MODEL_VERSION = "8";
const ROBOFLOW_API_KEY = process.env.EXPO_PUBLIC_ROBOFLOW_KEY;

export async function detectObjects(base64Image: string) {
  if (!ROBOFLOW_API_KEY) {
    console.warn("Roboflow API key is missing. Skipping object detection.");
    return [];
  }

  const url = `https://detect.roboflow.com/${ROBOFLOW_MODEL_ID}/${ROBOFLOW_MODEL_VERSION}?api_key=${ROBOFLOW_API_KEY}`;
  const imageData = base64Image.startsWith("data:")
    ? base64Image
    : `data:image/jpeg;base64,${base64Image}`;

  function base64ToBlob(dataURI: string) {
    const base64 = dataURI.split(",")[1] ?? "";
    const binary = atob(base64);
    const length = binary.length;
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: "image/jpeg" });
  }

  const tryMultipart = async () => {
    const form = new FormData();
    const blob = base64ToBlob(imageData);
    form.append("image", blob, "image.jpg");

    return await fetch(url, {
      method: "POST",
      body: form,
    });
  };

  const tryUrlEncoded = async () => {
    const form = new URLSearchParams();
    form.append("image", imageData);

    return await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
  };

  const attempts = [tryMultipart, tryUrlEncoded];

  for (const attempt of attempts) {
    try {
      const response = await attempt();
      const text = await response.text();

      if (!response.ok) {
        console.warn("Roboflow detection failed:", response.status, text);
        continue;
      }

      const data = JSON.parse(text);
      return data.predictions ?? [];
    } catch (err) {
      console.warn("Roboflow detection error:", err);
    }
  }

  return [];
}
