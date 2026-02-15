import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getDatabase,
  ref,
  push,
  onChildAdded
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";


// ===== CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyBUiPq1MDLb62Zl0Q0o-9Dl-Gbg7bL0Aik",
  authDomain: "minichatick.firebaseapp.com",
  databaseURL: "https://minichatick-default-rtdb.firebaseio.com",
  projectId: "minichatick",
  storageBucket: "minichatick.firebasestorage.app",
  messagingSenderId: "463477970284",
  appId: "1:463477970284:web:d0115e35f2cfb734cc8f49"
};


// ===== INIT =====
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const db = getDatabase(app);
const messagesRef = ref(db, "messages");


// ===== DOM =====
const googleBtn = document.getElementById("googleBtn");
const logoutBtn = document.getElementById("logout");

const loginScreen = document.getElementById("login");
const chatScreen = document.getElementById("chat");

const userBox = document.getElementById("users");
const messagesDiv = document.getElementById("messages");
const input = document.getElementById("msgInput");

let currentUser = null;


// ===== LOGIN =====
googleBtn.onclick = async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    console.error("LOGIN ERROR:", e);
    alert("Google login не работает. Проверь popup.");
  }
};


// ===== LOGOUT =====
logoutBtn.onclick = () => {
  signOut(auth);
};


// ===== USER =====
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;

    // переключение экранов
    loginScreen.classList.add("hidden");
    chatScreen.classList.remove("hidden");

    userBox.innerHTML = `
      <img src="${user.photoURL}" width="35" style="border-radius:50%">
      ${user.displayName}
    `;

  } else {
    loginScreen.classList.remove("hidden");
    chatScreen.classList.add("hidden");
    userBox.innerHTML = "";
  }
});


// ===== SEND =====
window.sendMessage = function () {
  if (!currentUser || !input.value) return;

  push(messagesRef, {
    text: input.value,
    user: currentUser.displayName,
    photo: currentUser.photoURL,
    uid: currentUser.uid,
    time: Date.now()
  });

  input.value = "";
};


// ===== RECEIVE =====
onChildAdded(messagesRef, (snap) => {
  const d = snap.val();

  const el = document.createElement("div");
  el.classList.add("message");

  if (d.uid === currentUser?.uid) el.classList.add("me");

  el.innerHTML = `
    <b>${d.user}</b><br>
    ${d.text}
  `;

  messagesDiv.appendChild(el);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});
