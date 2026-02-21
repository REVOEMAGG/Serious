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
  onChildRemoved,
  remove
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";


// ===== CONFIG =====
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
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("send");


// ===== STATE =====
let currentUser = null;
let currentChat = null;
let unsubscribeChat = null;

// ===== ADMIN =====
// сюда вставь свой UID
const admins = [
  "3tNh1mfm7FYlIGhwZTnY8Csp1GG3"
];


// ===== LOGIN =====
googleBtn.onclick = async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    alert("Ошибка входа");
    console.error(e);
  }
};


// ===== LOGOUT =====
logoutBtn.onclick = () => signOut(auth);


// ===== AUTH =====
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;

    loginScreen.classList.add("hidden");
    chatScreen.classList.remove("hidden");

    // сохраняем пользователя
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

      // админ кнопка
      if (admins.includes(currentUser.uid)) {
        const btn = document.createElement("button");
        btn.innerText = "Ban";
        btn.onclick = (e) => {
          e.stopPropagation();
          banUser(uid);
        };
        div.appendChild(btn);
      }

      userBox.appendChild(div);
    }
  });
}


// ===== CHAT =====
function createChatID(a, b) {
  return a < b ? a + "_" + b : b + "_" + a;
}

function openChat(uid) {
  if (currentChat) {
    off(ref(db, "chats/" + currentChat));
  }

  currentChat = createChatID(currentUser.uid, uid);
  messagesDiv.innerHTML = "";

  const chatRef = ref(db, "chats/" + currentChat);

  // Слушатель НОВЫХ сообщений
  onChildAdded(chatRef, (snap) => {
    const d = snap.val();
    const msgId = snap.key; // ID сообщения в базе

    const el = document.createElement("div");
    el.className = "message";
    el.id = "msg-" + msgId; // Чтобы потом удалить из DOM
    if (d.uid === currentUser.uid) el.classList.add("me");

    // Создаем контент: текст + кнопка (если автор — ты или админ)
    const canDelete = d.uid === currentUser.uid || admins.includes(currentUser.uid);
    
    el.innerHTML = `
      <span>${d.text}</span>
      ${canDelete ? `<button class="del-btn" onclick="deleteMsg('${msgId}')">❌</button>` : ""}
    `;

    messagesDiv.appendChild(el);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });

  // Слушатель УДАЛЕНИЯ (чтобы исчезало у всех сразу)
  onChildRemoved(chatRef, (snap) => {
    const el = document.getElementById("msg-" + snap.key);
    if (el) el.remove();
  });
}





// ===== SEND =====
sendBtn.addEventListener("click", sendMessage);

function sendMessage() {
  if (!currentUser) {
    alert("Сначала войди");
    return;
  }

  if (!currentChat) {
    alert("Выбери пользователя слева");
    return;
  }

  const text = msgInput.value.trim();
  if (!text) return;

  push(ref(db, "chats/" + currentChat), {
    text: text,
    uid: currentUser.uid,
    name: currentUser.displayName,
    time: Date.now()
  });

  msgInput.value = "";
}



// ===== ADMIN =====
function banUser(uid) {
  set(ref(db, "banned/" + uid), true);
}

window.deleteMsg = function(msgId) {
  if (confirm("Удалить сообщение?")) {
    const msgRef = ref(db, "chats/" + currentChat + "/" + msgId);
    remove(msgRef).catch(err => console.error("Ошибка удаления:", err));
  }
};


const backBtn = document.getElementById("backBtn");

// открыть чат
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

  // 📱 mobile
  if (window.innerWidth < 768) {
    document.querySelector(".chat").classList.add("active");
  }
}

// кнопка назад
backBtn.onclick = () => {
  document.querySelector(".chat").classList.remove("active");
};














