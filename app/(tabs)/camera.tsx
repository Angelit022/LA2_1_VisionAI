import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  async function takePicture() {
    if (!cameraRef.current) return;

    try {
      const result = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      console.log("Photo captured:", result.uri);
      setPhotoUri(result.uri);
    } catch (error) {
      console.error("Failed to take picture:", error);
    }
  }

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          We need your permission to use the camera
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
        <Text style={styles.captureButtonText}>Capture</Text>
      </TouchableOpacity>
      {photoUri ? <Text style={styles.photoText}>{photoUri}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  captureButton: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "#2E5BBA",
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 30,
  },
  captureButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionText: {
    textAlign: "center",
    marginBottom: 16,
    fontSize: 16,
  },
  permissionButton: {
    backgroundColor: "#2E5BBA",
    padding: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  photoText: {
    position: "absolute",
    top: 50,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
});
