const form = document.querySelector("#studentForm");
const message = document.querySelector("#message");
const list = document.querySelector("#recordList");
const statusBox = document.querySelector(".status");
const statusText = document.querySelector("#statusText");
const recordCount = document.querySelector("#recordCount");
const formTitle = document.querySelector("#formTitle");
const saveButton = document.querySelector("#saveButton");
const cancelEdit = document.querySelector("#cancelEdit");
const studentId = document.querySelector("#studentId");

function showMessage(text, type = "") {
  message.textContent = text;
  message.className = "message " + type;
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload.details ? payload.details.join("; ") : payload.error || "Request failed";
    throw new Error(detail);
  }
  return payload;
}

async function checkHealth() {
  try {
    await request("/api/health");
    statusBox.classList.add("connected");
    statusBox.classList.remove("error");
    statusText.textContent = "MongoDB connected";
  } catch {
    statusBox.classList.add("error");
    statusBox.classList.remove("connected");
    statusText.textContent = "MongoDB unavailable — check server configuration";
  }
}

function escapeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function resetForm() {
  form.reset();
  studentId.value = "";
  formTitle.textContent = "Add a student";
  saveButton.textContent = "Save student";
  cancelEdit.classList.add("hidden");
}

async function loadStudents() {
  list.innerHTML = '<div class="empty">Loading student records…</div>';
  try {
    const result = await request("/api/students");
    recordCount.textContent = result.count + (result.count === 1 ? " record" : " records");
    if (!result.data.length) {
      list.innerHTML = '<div class="empty">No students yet. Add the first record above.</div>';
      return;
    }
    list.innerHTML = result.data.map(student => `
      <article class="record">
        <div class="record-main">
          <h3>${escapeText(student.name)}</h3>
          <p>${escapeText(student.email)} · ${escapeText(student.course)}</p>
          <p class="meta">Year ${escapeText(student.year)} · ID: ${escapeText(student._id)}</p>
        </div>
        <div class="record-actions">
          <button class="secondary" type="button" data-edit="${escapeText(student._id)}">Edit</button>
          <button class="delete" type="button" data-delete="${escapeText(student._id)}">Delete</button>
        </div>
      </article>
    `).join("");
  } catch (error) {
    list.innerHTML = '<div class="empty">Could not load records. Check that the server is connected to MongoDB.</div>';
    showMessage(error.message, "error");
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const body = {
    name: document.querySelector("#name").value.trim(),
    email: document.querySelector("#email").value.trim(),
    course: document.querySelector("#course").value.trim(),
    year: Number(document.querySelector("#year").value)
  };

  try {
    const id = studentId.value;
    const result = await request(id ? "/api/students/" + encodeURIComponent(id) : "/api/students", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(body)
    });
    showMessage(result.message, "success");
    resetForm();
    await loadStudents();
    await checkHealth();
  } catch (error) {
    showMessage(error.message, "error");
  }
});

list.addEventListener("click", async event => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");

  if (editButton) {
    try {
      const result = await request("/api/students/" + encodeURIComponent(editButton.dataset.edit));
      const student = result.data;
      studentId.value = student._id;
      document.querySelector("#name").value = student.name;
      document.querySelector("#email").value = student.email;
      document.querySelector("#course").value = student.course;
      document.querySelector("#year").value = String(student.year);
      formTitle.textContent = "Edit student";
      saveButton.textContent = "Update student";
      cancelEdit.classList.remove("hidden");
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      showMessage(error.message, "error");
    }
  }

  if (deleteButton) {
    const id = deleteButton.dataset.delete;
    if (!window.confirm("Delete this student record permanently?")) return;
    try {
      const result = await request("/api/students/" + encodeURIComponent(id), { method: "DELETE" });
      showMessage(result.message, "success");
      if (studentId.value === id) resetForm();
      await loadStudents();
    } catch (error) {
      showMessage(error.message, "error");
    }
  }
});

cancelEdit.addEventListener("click", resetForm);
document.querySelector("#refreshButton").addEventListener("click", async () => {
  await checkHealth();
  await loadStudents();
});

checkHealth();
loadStudents();
