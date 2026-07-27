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

window.addEventListener("beforeunload", () => sendSpeed(0));
document.addEventListener("visibilitychange", () => {
  if (document.hidden) sendSpeed(0);
});
