const medicineList = document.getElementById("medicineList");
const reminderList = document.getElementById("reminderList");
const historyList = document.getElementById("historyList");
const takenList = document.getElementById("takenList");
const reminderSound = document.getElementById("reminderSound");

const knownMedicines = ["Paracetamol", "Aspirin", "Amoxicillin", "Metformin", "Cetrizine", "Dolo 650", "Azithromycin", "Omeprazole", "Ibuprofen"];
knownMedicines.forEach(med => {
  const option = document.createElement("option");
  option.value = med;
  medicineList.appendChild(option);
});

let reminders = JSON.parse(localStorage.getItem("reminders")) || [];
let history = JSON.parse(localStorage.getItem("history")) || [];
let taken = JSON.parse(localStorage.getItem("taken")) || [];

function saveAll() {
  localStorage.setItem("reminders", JSON.stringify(reminders));
  localStorage.setItem("history", JSON.stringify(history));
  localStorage.setItem("taken", JSON.stringify(taken));
}

function renderLists() {
  reminderList.innerHTML = "";
  reminders.forEach(r => {
    const li = document.createElement("li");
    li.textContent = `${r.name} (${r.dosage}) at ${r.time}`;
    reminderList.appendChild(li);
  });

  historyList.innerHTML = "";
  history.forEach(h => {
    const li = document.createElement("li");
    li.textContent = `${h.name} (${h.dosage}) set at ${h.time}`;
    historyList.appendChild(li);
  });

  takenList.innerHTML = "";
  taken.forEach(t => {
    const li = document.createElement("li");
    li.textContent = `${t.name} (${t.dosage}) taken at ${t.time}`;
    takenList.appendChild(li);
  });
}

document.getElementById("addBtn").addEventListener("click", addReminder);

function addReminder() {
  const name = document.getElementById("medicineName").value;
  const dosage = document.getElementById("dosage").value;
  const time = document.getElementById("time").value;

  if (!name || !time) {
    alert("Please fill all fields!");
    return;
  }

  const newReminder = { name, dosage, time };
  reminders.push(newReminder);
  history.push(newReminder);
  saveAll();
  renderLists();

  const now = new Date();
  const [hours, minutes] = time.split(":").map(Number);
  const reminderTime = new Date();
  reminderTime.setHours(hours, minutes, 0, 0);

  const delay = reminderTime - now;
  if (delay > 0) {
    setTimeout(() => {
      showNotification(name, dosage);
      reminderSound.play();
      moveToTaken(name, dosage, time);
    }, delay);
  }
}

function moveToTaken(name, dosage, time) {
  const takenMed = { name, dosage, time };
  taken.push(takenMed);
  saveAll();
  renderLists();
}

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");
}

// Voice recognition
const voiceBtn = document.getElementById("voiceBtn");
if ("webkitSpeechRecognition" in window) {
  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-IN";
  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    document.getElementById("medicineName").value = text.match(/[a-zA-Z]+/g)?.[0] || "";
    document.getElementById("dosage").value = text.match(/\d+\s*(tablet|capsule|ml)?/i)?.[0] || "";
    document.getElementById("time").value = extractTimeFromSpeech(text);
  };
  voiceBtn.onclick = () => recognition.start();
}

function extractTimeFromSpeech(text) {
  const match = text.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!match) return "";
  let hours = parseInt(match[1]);
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const ampm = match[3];
  if (ampm?.toLowerCase() === "pm" && hours < 12) hours += 12;
  if (ampm?.toLowerCase() === "am" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

// Notification permission
if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission();
}

function showNotification(name, dosage) {
  if (Notification.permission === "granted") {
    new Notification("💊 Time for your medicine!", {
      body: `${name} (${dosage}) — Take it now.`,
      icon: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png"
    });
  }
}

renderLists();
