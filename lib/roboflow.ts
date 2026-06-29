const ROBOFLOW_MODEL_ID = "coco";
const ROBOFLOW_MODEL_VERSION = "8";
const ROBOFLOW_API_KEY = process.env.EXPO_PUBLIC_ROBOFLOW_KEY;

export async function detectObjects(base64Image: string) {
  const url = `https://detect.roboflow.com/${ROBOFLOW_MODEL_ID}/${ROBOFLOW_MODEL_VERSION}?api_key=${ROBOFLOW_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: base64Image,
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.predictions ?? [];
  } catch (err) {
    return [];
  }
}
