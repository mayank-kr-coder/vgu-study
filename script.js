const supabaseUrl = "PASTE_YOUR_SUPABASE_URL";
const supabaseKey = "PASTE_YOUR_SUPABASE_ANON_KEY";

const supabaseClient =
  supabase.createClient(
    supabaseUrl,
    supabaseKey
  );

const loginScreen =
  document.getElementById("loginScreen");

const appShell =
  document.getElementById("appShell");

const loginForm =
  document.getElementById("loginForm");

const browseGuest =
  document.getElementById("browseGuest");

const logoutBtn =
  document.getElementById("logoutBtn");

const userLabel =
  document.getElementById("userLabel");

const userAvatar =
  document.getElementById("userAvatar");

const notesList =
  document.getElementById("notesList");

const uploadForm =
  document.getElementById("uploadForm");

const pdfFrame =
  document.getElementById("pdfFrame");

const viewerName =
  document.getElementById("viewerName");

const viewerMeta =
  document.getElementById("viewerMeta");

const openPdf =
  document.getElementById("openPdf");

let currentUser = null;

function saveUser(user){

  localStorage.setItem(
    "vguUser",
    JSON.stringify(user)
  );

}

function getUser(){

  return JSON.parse(
    localStorage.getItem("vguUser")
  );

}

function openApp(user){

  currentUser = user;

  loginScreen.classList.add(
    "hidden"
  );

  appShell.classList.remove(
    "hidden"
  );

  userLabel.textContent =
    user.name;

  userAvatar.textContent =
    user.name.charAt(0).toUpperCase();

  fetchNotes();

}

loginForm.addEventListener(
  "submit",
  (e)=>{

  e.preventDefault();

  const user = {

    name:
      document.getElementById(
        "studentName"
      ).value,

    email:
      document.getElementById(
        "studentEmail"
      ).value,

    branch:
      document.getElementById(
        "studentBranch"
      ).value

  };

  saveUser(user);

  openApp(user);

});

browseGuest.addEventListener(
  "click",
  ()=>{

  openApp({
    name:"Guest",
    email:"guest@vgu.ac.in",
    branch:"Guest"
  });

});

logoutBtn.addEventListener(
  "click",
  ()=>{

  localStorage.removeItem(
    "vguUser"
  );

  location.reload();

});

async function fetchNotes(){

  const {
    data,
    error
  } = await supabaseClient
      .from("notes")
      .select("*")
      .order("id",{
        ascending:false
      });

  if(error){

    console.log(error);

    return;

  }

  renderNotes(data);

}

function renderNotes(notes){

  notesList.innerHTML = "";

  if(!notes.length){

    notesList.innerHTML = `
      <div class="empty">
        No notes uploaded yet
      </div>
    `;

    return;

  }

  notes.forEach(note=>{

    const card =
      document.createElement("div");

    card.className = "card";

    card.innerHTML = `

      <div>

        <h3>${note.title}</h3>

        <div class="meta">

          <span class="pill">
            ${note.subject}
          </span>

          <span class="pill">
            Semester ${note.semester}
          </span>

          <span class="pill">
            ${note.type}
          </span>

        </div>

        <p class="hint">
          Uploaded by
          ${note.contributor}
        </p>

      </div>

      <div class="actions">

        <button class="icon-btn view-btn">
          View
        </button>

        <a
          href="${note.pdf_url}"
          class="icon-btn"
          download
        >
          Download
        </a>

      </div>

    `;

    card.querySelector(
      ".view-btn"
    ).addEventListener(
      "click",
      ()=>{

      pdfFrame.src =
        note.pdf_url;

      viewerName.textContent =
        note.title;

      viewerMeta.textContent =
        note.subject;

      openPdf.onclick = ()=>{

        window.open(
          note.pdf_url,
          "_blank"
        );

      };

    });

    notesList.appendChild(card);

  });

}

uploadForm.addEventListener(
  "submit",
  async (e)=>{

  e.preventDefault();

  if(!currentUser){

    alert("Login first");

    return;

  }

  const file =
    document.getElementById(
      "noteFile"
    ).files[0];

  if(!file){

    alert("Select PDF");

    return;

  }

  const fileName =
    Date.now() +
    "-" +
    file.name;

  const {
    error:uploadError
  } = await supabaseClient
      .storage
      .from("notes")
      .upload(fileName,file);

  if(uploadError){

    console.log(uploadError);

    alert("PDF upload failed");

    return;

  }

  const { data } =
    supabaseClient
      .storage
      .from("notes")
      .getPublicUrl(fileName);

  const pdfUrl =
    data.publicUrl;

  const {
    error
  } = await supabaseClient
      .from("notes")
      .insert([
        {

          title:
            document.getElementById(
              "noteTitle"
            ).value,

          subject:
            document.getElementById(
              "noteSubject"
            ).value,

          semester:
            document.getElementById(
              "noteSemester"
            ).value,

          type:
            document.getElementById(
              "noteType"
            ).value,

          contributor:
            currentUser.name,

          pdf_url:
            pdfUrl

        }
      ]);

  if(error){

    console.log(error);

    alert(
      "Database insert failed"
    );

    return;

  }

  alert("Upload Successful");

  uploadForm.reset();

  fetchNotes();

});

const savedUser = getUser();

if(savedUser){

  openApp(savedUser);

}
