import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBTVxuS2OkqIOX8j7Hw1QSgAVYZM7L9Yn8",
  authDomain: "sgram-262d0.firebaseapp.com",
  projectId: "sgram-262d0",
  storageBucket: "sgram-262d0.firebasestorage.app",
  messagingSenderId: "1017138295510",
  appId: "1:1017138295510:web:dc652f2352ee6a95b5cf77",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
