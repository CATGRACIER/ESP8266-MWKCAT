import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
import { firebaseConfig } from "./firebase.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const speedText = document.getElementById("speed");

function sendSpeed(speed) {
  speedText.innerHTML = speed;
  set(ref(db, "servo"), { speed: speed });
}

/* ---------- Joystick mode ---------- */
const joystick = nipplejs.create({
  zone: document.getElementById("zone"),
  mode: "static",
  position: { left: "50%", top: "50%" },
  color: "blue"
});

joystick.on("move", (evt, data) => {
  if (!data) return;
  let x = data.vector.x;
  let speed = Math.round(x * 100);
  if (speed > 100) speed = 100;
  if (speed < -100) speed = -100;
  sendSpeed(speed);
});

joystick.on("end", () => {
  sendSpeed(0);
});

/* ---------- Tilt mode ---------- */
const DEAD_ZONE_DEG = 5;
const MAX_TILT_DEG = 45;
const SEND_INTERVAL_MS = 150;

let tiltActive = false;
let lastSendTime = 0;
let lastSent = null;

function handleOrientation(event) {
  if (!tiltActive) return;
  let gamma = event.gamma;
  if (gamma === null) return;

  let speed = 0;
  if (Math.abs(gamma) > DEAD_ZONE_DEG) {
    const sign = gamma > 0 ? 1 : -1;
    const usable = Math.min(Math.abs(gamma), MAX_TILT_DEG) - DEAD_ZONE_DEG;
    const range = MAX_TILT_DEG - DEAD_ZONE_DEG;
    speed = Math.round(sign * (usable / range) * 100);
  }

  const now = Date.now();
  if (now - lastSendTime < SEND_INTERVAL_MS && speed === lastSent) return;
  lastSendTime = now;
  lastSent = speed;
  sendSpeed(speed);
}

const startTiltBtn = document.getElementById("startTiltBtn");
const stopTiltBtn = document.getElementById("stopTiltBtn");
const tiltHint = document.getElementById("tiltHint");

startTiltBtn.addEventListener("click", async () => {
  if (typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function") {
    try {
      const perm = await DeviceOrientationEvent.requestPermission();
      if (perm !== "granted") {
        tiltHint.textContent = "ไม่ได้รับอนุญาตให้ใช้เซนเซอร์";
        return;
      }
    } catch (err) {
      tiltHint.textContent = "ขอ permission ไม่สำเร็จ: " + err.message;
      return;
    }
  }
  tiltActive = true;
  window.addEventListener("deviceorientation", handleOrientation);
  startTiltBtn.style.display = "none";
  stopTiltBtn.style.display = "inline-block";
  tiltHint.textContent = "กำลังควบคุม — เอียงซ้าย-ขวา";
});

stopTiltBtn.addEventListener("click", () => {
  tiltActive = false;
  window.removeEventListener("deviceorientation", handleOrientation);
  sendSpeed(0);
  startTiltBtn.style.display = "inline-block";
  stopTiltBtn.style.display = "none";
  tiltHint.textContent = "ถือมือถือแนวนอน แล้วเอียงซ้าย-ขวา";
});

/* ---------- Tab switching ---------- */
const tabBtns = document.querySelectorAll(".tab-btn");
const joystickPanel = document.getElementById("joystickPanel");
const tiltPanel = document.getElementById("tiltPanel");

function stopAllModes() {
  if (tiltActive) {
    tiltActive = false;
    window.removeEventListener("deviceorientation", handleOrientation);
    stopTiltBtn.style.display = "none";
    startTiltBtn.style.display = "inline-block";
  }
  sendSpeed(0);
}

tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    tabBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    stopAllModes();
    if (btn.dataset.mode === "joystick") {
      joystickPanel.style.display = "block";
      tiltPanel.style.display = "none";
    } else {
      joystickPanel.style.display = "none";
      tiltPanel.style.display = "block";
    }
  });
});

/* ---------- Voice control ---------- */
const voiceBtn = document.getElementById("voiceBtn");
const voiceStatus = document.getElementById("voiceStatus");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;
const DEFAULT_VOICE_SPEED = 50;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "th-TH";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    isListening = true;
    voiceBtn.classList.add("listening");
    voiceBtn.textContent = "🎤 กำลังฟัง...";
  };

  recognition.onend = () => {
    isListening = false;
    voiceBtn.classList.remove("listening");
    voiceBtn.textContent = "🎤 สั่งด้วยเสียง";
  };

  recognition.onerror = (event) => {
    voiceStatus.textContent = "ไม่ได้ยิน/error: " + event.error;
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim();
    voiceStatus.textContent = `ได้ยิน: "${transcript}"`;
    handleVoiceCommand(transcript);
  };

  voiceBtn.addEventListener("click", () => {
    if (isListening) {
      recognition.stop();
    } else {
      stopAllModes();
      recognition.start();
    }
  });
} else {
  voiceBtn.disabled = true;
  voiceStatus.textContent = "เบราว์เซอร์นี้ไม่รองรับสั่งด้วยเสียง (ลองใช้ Chrome)";
}

function extractNumber(text) {
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function handleVoiceCommand(text) {
  const t = text.toLowerCase();

  if (t.includes("หยุด") || t.includes("stop")) {
    sendSpeed(0);
    voiceStatus.textContent = "✅ หยุดหมุน";
    return;
  }

  let direction = 0; // 1 = ตามเข็ม (+), -1 = ทวนเข็ม (-)

  if (t.includes("ทวนเข็ม") || t.includes("ทวน") || t.includes("ซ้าย")) {
    direction = -1;
  } else if (t.includes("ตามเข็ม") || t.includes("ตาม") || t.includes("ขวา")) {
    direction = 1;
  } else {
    voiceStatus.textContent = "❓ ไม่เข้าใจคำสั่ง ลองพูด 'ตามเข็ม' หรือ 'ทวนเข็ม'";
    return;
  }

  let speedValue = extractNumber(t);
  if (speedValue === null) speedValue = DEFAULT_VOICE_SPEED;
  speedValue = Math.min(100, Math.max(0, speedValue));

  const finalSpeed = direction * speedValue;
  sendSpeed(finalSpeed);
  voiceStatus.textContent = `✅ ${direction > 0 ? "ตามเข็ม" : "ทวนเข็ม"} ความเร็ว ${speedValue}%`;
}

/* ---------- Logout / WiFi reset ---------- */
const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", () => {
  if (confirm("ต้องการรีเซ็ตค่า WiFi ของ ESP8266 หรือไม่? อุปกรณ์จะรีสตาร์ทและต้องตั้งค่า WiFi ใหม่")) {
    set(ref(db, "system/wifiReset"), true);
    alert("ส่งคำสั่ง logout แล้ว รอ ESP8266 รีสตาร์ท แล้วต่อ WiFi ชื่อ 'ESP-Servo-Setup' เพื่อตั้งค่าใหม่");
  }
});

/* ---------- Safety: หยุด servo เมื่อออกจากหน้า/สลับแท็บ ---------- */
window.addEventListener("beforeunload", () => sendSpeed(0));
document.addEventListener("visibilitychange", () => {
  if (document.hidden) sendSpeed(0);
});
