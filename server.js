
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

const uploadsDir = path.join(__dirname, "uploads");
const dataDir = path.join(__dirname, "data");
const notesFile = path.join(dataDir, "notes.json");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(notesFile)) fs.writeFileSync(notesFile, JSON.stringify([]));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use("/uploads", express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "-"));
  }
});

const upload = multer({ storage });

function readNotes() {
  try {
    return JSON.parse(fs.readFileSync(notesFile, "utf8"));
  } catch {
    return [];
  }
}

function saveNotes(notes) {
  fs.writeFileSync(notesFile, JSON.stringify(notes, null, 2));
}

app.get("/api/notes", (req, res) => {
  res.json({ notes: readNotes() });
});

app.post("/api/notes", upload.single("file"), (req, res) => {
  const notes = readNotes();

  const note = {
    id: Date.now().toString(),
    title: req.body.title,
    subject: req.body.subject,
    semester: req.body.semester,
    type: req.body.type,
    contributor: req.body.contributor,
    uploaderEmail: req.body.uploaderEmail,
    downloads: 0,
    createdAt: new Date().toISOString(),
    url: `/uploads/${req.file.filename}`
  };

  notes.unshift(note);
  saveNotes(notes);

  res.json({ success: true, note });
});

app.post("/api/notes/:id/download", (req, res) => {
  const notes = readNotes();

  const note = notes.find(n => n.id === req.params.id);

  if (!note) {
    return res.status(404).json({ error: "Note not found" });
  }

  note.downloads += 1;

  saveNotes(notes);

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
