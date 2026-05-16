
const loginScreen = document.getElementById("loginScreen");
const appShell = document.getElementById("appShell");
const loginForm = document.getElementById("loginForm");
const browseGuest = document.getElementById("browseGuest");
const logoutBtn = document.getElementById("logoutBtn");

const userLabel = document.getElementById("userLabel");
const userAvatar = document.getElementById("userAvatar");

const notesList = document.getElementById("notesList");
const uploadForm = document.getElementById("uploadForm");

const pdfFrame = document.getElementById("pdfFrame");
const viewerName = document.getElementById("viewerName");
const viewerMeta = document.getElementById("viewerMeta");

let currentUser = null;
let notes = [];

function saveUser(user) {
  localStorage.setItem("vguUser", JSON.stringify(user));
}

function getUser() {
  return JSON.parse(localStorage.getItem("vguUser"));
}

function openApp(user) {
  currentUser = user;

  loginScreen.classList.add("hidden");
  appShell.classList.remove("hidden");

  userLabel.textContent = user.name;
  userAvatar.textContent = user.name.charAt(0).toUpperCase();

  fetchNotes();
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const user = {
    name: document.getElementById("studentName").value,
    email: document.getElementById("studentEmail").value,
    branch: document.getElementById("studentBranch").value
  };

  saveUser(user);
  openApp(user);
});

browseGuest.addEventListener("click", () => {
  openApp({
    name: "Guest",
    email: "guest@vgu.ac.in",
    branch: "Guest"
  });
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("vguUser");
  location.reload();
});

async function fetchNotes() {
  const response = await fetch("/api/notes");
  const data = await response.json();

  notes = data.notes;
  renderNotes();
}

function renderNotes() {
  notesList.innerHTML = "";

  if (!notes.length) {
    notesList.innerHTML = `<div class="empty">No notes uploaded yet</div>`;
    return;
  }

  notes.forEach(note => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div>
        <h3>${note.title}</h3>

        <div class="meta">
          <span class="pill">${note.subject}</span>
          <span class="pill">Semester ${note.semester}</span>
          <span class="pill">${note.type}</span>
        </div>

        <p class="hint">Uploaded by ${note.contributor}</p>

        <div class="status-row">
          <span class="pill">Downloads ${note.downloads}</span>
        </div>
      </div>

      <div class="actions">
        <button class="icon-btn view-btn">View</button>
        <a href="${note.url}" class="icon-btn download-btn" download>Download</a>
      </div>
    `;

    card.querySelector(".view-btn").addEventListener("click", () => {
      pdfFrame.src = note.url;
      viewerName.textContent = note.title;
      viewerMeta.textContent = note.subject;
    });

    card.querySelector(".download-btn").addEventListener("click", async () => {
      await fetch(`/api/notes/${note.id}/download`, {
        method: "POST"
      });

      fetchNotes();
    });

    notesList.appendChild(card);
  });
}

uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentUser) {
    alert("Please login first");
    return;
  }

  const file = document.getElementById("noteFile").files[0];

  if (!file) {
    alert("Please select PDF");
    return;
  }

  const formData = new FormData();

  formData.append("title", document.getElementById("noteTitle").value);
  formData.append("subject", document.getElementById("noteSubject").value);
  formData.append("semester", document.getElementById("noteSemester").value);
  formData.append("type", document.getElementById("noteType").value);
  formData.append("contributor", currentUser.name);
  formData.append("uploaderEmail", currentUser.email);
  formData.append("file", file);

  const response = await fetch("/api/notes", {
    method: "POST",
    body: formData
  });

  const data = await response.json();

  if (data.success) {
    alert("Upload successful");
    uploadForm.reset();
    fetchNotes();
  } else {
    alert("Upload failed");
  }
});

const savedUser = getUser();

if (savedUser) {
  openApp(savedUser);
}
