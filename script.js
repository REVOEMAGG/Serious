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
  set,
  onValue,
  onChildAdded,
  remove
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


// ===== DOM =====
const googleBtn = document.getElementById("googleBtn");
const logoutBtn = document.getElementById("logout");

const loginScreen = document.getElementById("login");
const chatScreen = document.getElementById("chat");

const userBox = document.getElementById("users");
const messagesDiv = document.getElementById("messages");
const input = document.getElementById("msgInput");


// ===== STATE =====
let currentUser = null;
let currentChat = null;


// ===== ADMIN =====
// вставь свой UID после входа
const admins = [
  "3tNh1mfm7FYlIGhwZTnY8Csp1GG3"
];


// ===== LOGIN =====
googleBtn.onclick = async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    console.error(e);
    alert("Ошибка входа");
  }
};


// ===== LOGOUT =====
logoutBtn.onclick = () => signOut(auth);


// ===== AUTH =====
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;

    // экран
    loginScreen.classList.add("hidden");
    chatScreen.classList.remove("hidden");

    // сохранить пользователя
    set(ref(db, "users/" + user.uid), {
      name: user.displayName,
      photo: user.photoURL,
      email: user.email
    });

    // проверка бана
    onValue(ref(db, "banned/" + user.uid), (snap) => {
      if (snap.exists()) {
        alert("Вы забанены");
        signOut(auth);
      }
    });

    loadUsers();

  } else {
    loginScreen.classList.remove("hidden");
    chatScreen.classList.add("hidden");
  }
});


// ===== USERS =====
function loadUsers() {
  onValue(ref(db, "users"), (snap) => {
    const data = snap.val();
    userBox.innerHTML = "";

    for (let uid in data) {
      if (uid === currentUser.uid) continue;

      const u = data[uid];

      const div = document.createElement("div");
      div.className = "user";
      div.innerHTML = `
        <img src="${u.photo}" width="35" style="border-radius:50%">
        ${u.name}
      `;

      div.onclick = () => openChat(uid);
      userBox.appendChild(div);

      // админ кнопка удаления
      if (admins.includes(currentUser.uid)) {
        const del = document.createElement("button");
        del.innerText = "Ban";
        del.onclick = () => banUser(uid);
        div.appendChild(del);
      }
    }
  });
}


// ===== CHAT =====
function createChatID(a, b) {
  return a < b ? a + "_" + b : b + "_" + a;
}

function openChat(uid) {
  currentChat = createChatID(currentUser.uid, uid);
  messagesDiv.innerHTML = "";

  const chatRef = ref(db, "chats/" + currentChat);

  onChildAdded(chatRef, (snap) => {
    const d = snap.val();

    const el = document.createElement("div");
    el.className = "message";

    if (d.uid === currentUser.uid) el.classList.add("me");

    el.innerText = d.text;
    messagesDiv.appendChild(el);
  });
}


function sendMessage() {
  const text = msgInput.value.trim();

  if (!currentUser) {
    alert("Сначала войдите в аккаунт!");
    return;
  }

  if (!text) return;

  push(ref(db, "chats/" + currentChat), {
    text: text,
    uid: currentUser.uid,
    time: Date.now()
  });

  msgInput.value = "";
}


// ===== ADMIN =====
function banUser(uid) {
  set(ref(db, "banned/" + uid), true);
}







