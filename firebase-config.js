import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyD1es35wUTftNf4QFSUEWTuK1wFhNWto9Y",
  authDomain: "study-app-bc550.firebaseapp.com",
  projectId: "study-app-bc550",
  storageBucket: "study-app-bc550.firebasestorage.app",
  messagingSenderId: "354237339048",
  appId: "1:354237339048:web:e9c36dcda5f768e88a799d",
};

const app = initializeApp(firebaseConfig);
window.db = getFirestore(app);
window.storage = getStorage(app);
