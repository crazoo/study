import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

async function getLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
}

function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language
  };
}

async function saveUserData(location, deviceInfo, fileUrls) {
  try {
    await addDoc(collection(window.db, "user_data"), {
      timestamp: new Date(),
      location: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      },
      deviceInfo,
      files: fileUrls
    });
    console.log("Data saved to Firestore");
  } catch (e) {
    console.error("Error saving data:", e);
  }
}

async function handleFileUpload(files) {
  const urls = [];
  for (const file of files) {
    const storageRef = ref(window.storage, `uploads/${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    urls.push(downloadURL);
  }
  return urls;
}

async function init() {
  try {
    const location = await getLocation();
    const deviceInfo = getDeviceInfo();

    const fileInput = document.getElementById("fileInput");
    fileInput.addEventListener("change", async (e) => {
      const files = e.target.files;
      const fileUrls = await handleFileUpload(files);
      await saveUserData(location, deviceInfo, fileUrls);
    });

    // Auto-save if no file is uploaded
    setTimeout(async () => {
      await saveUserData(location, deviceInfo, []);
    }, 5000);

  } catch (err) {
    console.error("Error collecting info:", err);
  }
}

window.onload = init;
