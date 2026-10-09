const authScreen = document.querySelector("#authScreen");
const appScreen = document.querySelector("#appScreen");
const authForm = document.querySelector("#authForm");
const authAlert = document.querySelector("#authAlert");
const authSubmit = document.querySelector("#authSubmit");
const ticketForm = document.querySelector("#ticketForm");
const ticketList = document.querySelector("#ticketList");
const toastRegion = document.querySelector("#toastRegion");
const searchInput = document.querySelector("#searchInput");
const statusFilter = document.querySelector("#statusFilter");
const priorityFilter = document.querySelector("#priorityFilter");
const description = document.querySelector("#description");
const photoInput = document.querySelector("#photo");
const geoButton = document.querySelector("#geoButton");
const geoHint = document.querySelector("#geoHint");
let currentUser = null;
let authRole = "student";
let authMode = "login";
let searchTimer;
let currentPhotoUrl = null;

const categories = ["IT & Wi-Fi", "Lab Equipment", "Classroom", "Electrical", "Plumbing", "Cleaning", "Other"];
const priorities = ["Low", "Normal", "High", "Urgent"];
const statuses = ["Submitted", "Under Review", "In Progress", "Resolved", "Rejected"];
const escapeText = value => String(value ?? "");
const dateLabel = value => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
const make = (tagName, className, text = "") => {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
};

function showToast(message, type = "success") {
  const toast = make("div", `toast toast-${type}`);
  toast.append(make("span", "toast-icon", type === "success" ? "✓" : "!"), make("p", "", message));
  const close = make("button", "", "×"); close.type = "button"; close.setAttribute("aria-label", "Dismiss notification"); close.addEventListener("click", () => toast.remove());
  toast.append(close); toastRegion.append(toast); window.setTimeout(() => toast.remove(), 6500);
}
function setApiState(online, message) {
  ["apiDot", "sidebarApiDot"].forEach(id => document.getElementById(id)?.classList.toggle("offline", !online));
  const apiText = document.querySelector("#apiText"); if (apiText) apiText.textContent = message;
  const sideText = document.querySelector("#sidebarApiText"); if (sideText) sideText.textContent = online ? "Server connected" : "Server unavailable";
}
async function api(url, options = {}) {
  const response = await fetch(url, { credentials: "same-origin", ...options });
  let result;
  try { result = await response.json(); } catch { result = { success: false, message: "The server returned an unreadable response." }; }
  if (response.status === 401 && !url.includes("/api/auth/login") && !url.includes("/api/auth/register") && !url.includes("/api/auth/me")) {
    showAuth(); throw new Error("Your session expired. Please sign in again.");
  }
  return { response, result };
}
function authErrors(errors = {}) {
  document.querySelectorAll("[data-auth-error]").forEach(n => { n.textContent = ""; n.classList.remove("visible"); });
  Object.entries(errors).forEach(([field, message]) => {
    const node = document.querySelector(`[data-auth-error="${field}"]`);
    if (node) { node.textContent = message; node.classList.add("visible"); }
  });
}
function ticketErrors(errors = {}) {
  document.querySelectorAll("[data-error]").forEach(n => { n.textContent = ""; n.classList.remove("visible"); });
  ticketForm.querySelectorAll("[aria-invalid='true']").forEach(n => n.removeAttribute("aria-invalid"));
  Object.entries(errors).forEach(([field, message]) => {
    const node = document.querySelector(`[data-error="${field}"]`);
    const input = ticketForm.elements.namedItem(field);
    if (node) { node.textContent = message; node.classList.add("visible"); }
    if (input && input.setAttribute) input.setAttribute("aria-invalid", "true");
  });
}
function setAuthAlert(message = "", isError = true) {
  authAlert.textContent = message;
  authAlert.hidden = !message;
  authAlert.classList.toggle("alert-error", isError);
  authAlert.classList.toggle("alert-success", !isError);
}
function updateAuthUI() {
  const registering = authMode === "register" && authRole === "student";
  document.querySelector("#authTitle").textContent = registering ? "Create your student account" : authRole === "admin" ? "Administrator sign in" : "Sign in to your workspace";
  document.querySelector("#authSubtitle").textContent = registering ? "Create an account to register and track your complaints." : authRole === "admin" ? "Use your campus administrator credentials." : "Sign in to track your campus complaints.";
  document.querySelector("#authNameWrap").hidden = !registering;
  document.querySelector("#registerPasswordHint").hidden = !registering;
  document.querySelector("#passwordHint").textContent = registering ? "Create a strong password" : "Your account password";
  authSubmit.innerHTML = registering ? 'Create account <span>↗</span>' : 'Sign in <span>↗</span>';
  document.querySelector("#registerModeButton").hidden = authRole === "admin";
  document.querySelectorAll("[data-role]").forEach(button => button.classList.toggle("selected", button.dataset.role === authRole));
  document.querySelectorAll("[data-mode]").forEach(button => button.classList.toggle("selected", button.dataset.mode === authMode));
  document.querySelector("#authPassword").setAttribute("autocomplete", registering ? "new-password" : "current-password");
  document.querySelector("#authFootnote").textContent = authRole === "admin" ? "Administrator accounts are created by the deployment owner. Student registration cannot create an admin account." : "Only student accounts can be self-registered. Your complaints remain linked to your account.";
}
function showAuth() {
  currentUser = null; appScreen.hidden = true; authScreen.hidden = false;
  authForm.reset(); authErrors({}); setAuthAlert(""); authRole = "student"; authMode = "login"; updateAuthUI();
}
function showApp(user) {
  currentUser = user; authScreen.hidden = true; appScreen.hidden = false;
  const isAdmin = user.role === "admin";
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  document.querySelector("#sideAvatar").textContent = initials;
  document.querySelector("#topAvatar").textContent = initials;
  document.querySelector("#sideName").textContent = user.name;
  document.querySelector("#sideRole").textContent = isAdmin ? "Campus administrator" : "Student account";
  document.querySelector("#complaintNavText").textContent = isAdmin ? "All complaints" : "My complaints";
  document.querySelector("#statLabelAll").textContent = isAdmin ? "All complaints" : "My complaints";
  document.querySelector("#ticketListTitle").textContent = isAdmin ? "Campus complaint queue" : "My complaints";
  document.querySelector("#ticketListDescription").textContent = isAdmin ? "Review incoming issues and coordinate the response." : "Follow status changes, evidence and staff replies.";
  document.querySelector("#ticketListKicker").innerHTML = isAdmin ? 'ADMIN WORKSPACE <span>02</span>' : 'TRACK YOUR REQUESTS <span>02</span>';
  document.querySelector("#heroEyebrow").textContent = isAdmin ? "CAMPUS OPERATIONS DESK" : "CAMPUS SUPPORT HUB";
  document.querySelector("#heroTitle").innerHTML = isAdmin ? 'Keep campus<br><em>moving forward.</em>' : 'Make campus<br><em>work better.</em>';
  document.querySelector("#heroDescription").textContent = isAdmin ? "Review complaints, prioritize issues, and keep students informed from one workspace." : "Report a problem, track its progress, and help keep labs and learning spaces running smoothly.";
  document.querySelector("#heroAction").textContent = isAdmin ? "Review complaint queue ↗" : "Report a campus issue ↗";
  document.querySelector("#heroAction").href = isAdmin ? "#complaints" : "#newComplaint";
  document.querySelector("#reportNav").hidden = isAdmin;
  document.querySelector("#sideCreateLink").parentElement.hidden = isAdmin;
  document.querySelector("#newComplaint").hidden = isAdmin;
  const navReport = document.querySelector('[data-nav="newComplaint"]'); if (navReport) navReport.hidden = isAdmin;
  clearPhotoPreview();
  loadTickets();
}
async function checkExistingSession() {
  try {
    const { response, result } = await api("/api/auth/me");
    if (response.ok && result.user) showApp(result.user); else showAuth();
  } catch { showAuth(); setAuthAlert("Could not connect to the Express server. Refresh after the server is running."); }
}

document.querySelectorAll("[data-role]").forEach(button => button.addEventListener("click", () => {
  authRole = button.dataset.role; authMode = "login"; authForm.reset(); authErrors({}); setAuthAlert(""); updateAuthUI();
}));
document.querySelectorAll("[data-mode]").forEach(button => button.addEventListener("click", () => {
  if (button.dataset.mode === "register" && authRole !== "student") return;
  authMode = button.dataset.mode; authErrors({}); setAuthAlert(""); updateAuthUI();
}));
document.querySelector("#togglePassword").addEventListener("click", event => {
  const input = document.querySelector("#authPassword");
  input.type = input.type === "password" ? "text" : "password";
  event.currentTarget.textContent = input.type === "password" ? "Show" : "Hide";
});
authForm.addEventListener("submit", async event => {
  event.preventDefault(); authErrors({}); setAuthAlert(""); authSubmit.disabled = true; authSubmit.classList.add("button-loading");
  const payload = Object.fromEntries(new FormData(authForm).entries());
  payload.role = authRole;
  const endpoint = authMode === "register" && authRole === "student" ? "/api/auth/register" : "/api/auth/login";
  try {
    const { response, result } = await api(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!response.ok || !result.success) { authErrors(result.errors || {}); setAuthAlert(result.message || "Unable to authenticate."); return; }
    authForm.reset(); showApp(result.user); showToast(result.message || "Signed in successfully.");
  } catch (error) { setAuthAlert(error.message || "Could not connect to the server."); }
  finally { authSubmit.disabled = false; authSubmit.classList.remove("button-loading"); }
});
document.querySelector("#logoutButton").addEventListener("click", async () => {
  try { await api("/api/auth/logout", { method: "POST" }); } catch {}
  showAuth(); showToast("You have been signed out.");
});

function statusClass(status) { return status.toLowerCase().replaceAll(" ", "-"); }
function renderStats(all) {
  document.querySelector("#statAll").textContent = String(all.length).padStart(2, "0");
  document.querySelector("#statOpen").textContent = String(all.filter(t => ["Submitted", "Under Review"].includes(t.status)).length).padStart(2, "0");
  document.querySelector("#statProgress").textContent = String(all.filter(t => t.status === "In Progress").length).padStart(2, "0");
  document.querySelector("#statResolved").textContent = String(all.filter(t => t.status === "Resolved").length).padStart(2, "0");
  document.querySelector("#navCount").textContent = all.length;
}
function badge(className, text) { return make("span", className, text); }
function fieldErrorFor(field) { return document.querySelector(`[data-error="${field}"]`); }
function makeTicketCard(ticket) {
  const card = make("article", "ticket-card");
  const head = make("div", "ticket-card-top");
  head.append(badge("ticket-reference", ticket.id), badge(`status-tag status-${statusClass(ticket.status)}`, ticket.status));
  const title = make("h3", "", ticket.subject);
  const meta = make("div", "ticket-meta"); meta.append(badge("category-tag", ticket.category), badge(`priority-tag priority-${ticket.priority.toLowerCase()}`, `${ticket.priority} priority`));
  const location = make("p", "ticket-location", `⌖  ${ticket.location}`);
  const desc = make("p", "ticket-description", ticket.description);
  const reporter = make("div", "ticket-byline");
  const initials = (ticket.reporterName || "Student").trim().split(/\s+/).slice(0, 2).map(p => p[0]).join("").toUpperCase();
  reporter.append(badge("person-avatar", initials));
  const reporterCopy = make("span", ""); reporterCopy.append(make("strong", "", currentUser.role === "admin" ? ticket.reporterName : "Submitted by you"), make("small", "", dateLabel(ticket.createdAt))); reporter.append(reporterCopy);
  const headTop = make("div", "ticket-summary"); headTop.append(head, title, meta, location, desc, reporter);
  const referenceLine = make("div", "ticket-card-top ticket-secondary-top"); referenceLine.append(make("span", "ticket-updated", `Updated ${dateLabel(ticket.updatedAt)}`));
  const detailsButton = make("button", "details-toggle", "View tracking & conversation ↓"); detailsButton.type = "button";
  const details = make("div", "ticket-details"); details.hidden = true;
  detailsButton.addEventListener("click", () => { details.hidden = !details.hidden; detailsButton.textContent = details.hidden ? "View tracking & conversation ↓" : "Hide tracking & conversation ↑"; });

  const infoGrid = make("div", "ticket-info-grid");
  infoGrid.append(make("div", "ticket-info-item", "REFERENCE"), make("div", "ticket-info-item", "REPORTER"));
  infoGrid.children[0].append(make("strong", "", ticket.id));
  infoGrid.children[1].append(make("strong", "", currentUser.role === "admin" ? `${ticket.reporterName} · ${ticket.reporterEmail}` : currentUser.email));
  details.append(infoGrid);
  if (ticket.photoUrl) {
    const photoLink = make("a", "photo-link", "Open attached photo ↗"); photoLink.href = ticket.photoUrl; photoLink.target = "_blank"; photoLink.rel = "noopener noreferrer";
    const photo = make("img", "ticket-photo"); photo.src = ticket.photoUrl; photo.alt = "Photo attached to this complaint"; photo.loading = "lazy";
    photoLink.prepend(photo); details.append(photoLink);
  }
  if (ticket.coordinates) {
    const map = make("a", "map-link", "⌖ View reported location on map ↗");
    const lat = Number(ticket.coordinates.latitude), lon = Number(ticket.coordinates.longitude);
    map.href = `https://www.openstreetmap.org/?mlat=${encodeURIComponent(lat)}&mlon=${encodeURIComponent(lon)}#map=17/${encodeURIComponent(lat)}/${encodeURIComponent(lon)}`;
    map.target = "_blank"; map.rel = "noopener noreferrer"; details.append(map);
  }

  const timeline = make("div", "timeline-block"); timeline.append(make("h4", "", "Status history"));
  const timelineList = make("ol", "timeline");
  (ticket.history || []).slice().reverse().forEach(entry => {
    const li = make("li", "timeline-item"); li.append(make("span", "timeline-dot"), make("strong", "", entry.status));
    if (entry.note) li.append(make("p", "", entry.note));
    li.append(make("small", "", `${entry.by || "System"} · ${dateLabel(entry.at)}`)); timelineList.append(li);
  });
  timeline.append(timelineList); details.append(timeline);

  const thread = make("div", "thread-block"); thread.append(make("h4", "", `Conversation (${(ticket.comments || []).length})`));
  if (!(ticket.comments || []).length) thread.append(make("p", "empty-thread", "No messages yet. Add a message if you have more details or need an update."));
  (ticket.comments || []).forEach(comment => {
    const item = make("div", `message-bubble ${comment.role === "admin" ? "staff-message" : "student-message"}`);
    const top = make("div", "message-top"); top.append(make("strong", "", comment.authorName), badge("role-mini", comment.role === "admin" ? "ADMIN" : "STUDENT"));
    item.append(top, make("p", "", comment.message), make("small", "", dateLabel(comment.at))); thread.append(item);
  });
  const commentForm = make("form", "comment-form");
  const commentInput = make("textarea", ""); commentInput.name = "message"; commentInput.rows = 2; commentInput.maxLength = 600; commentInput.placeholder = currentUser.role === "admin" ? "Write a staff update or ask for more detail…" : "Add a message or extra detail…";
  const commentButton = make("button", "small-action-button", currentUser.role === "admin" ? "Send reply ↗" : "Add message ↗"); commentButton.type = "submit";
  const commentError = make("small", "comment-error"); commentForm.append(commentInput, commentError, commentButton);
  commentForm.addEventListener("submit", async event => {
    event.preventDefault(); commentError.textContent = ""; commentButton.disabled = true;
    try {
      const { response, result } = await api(`/api/tickets/${encodeURIComponent(ticket.id)}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: commentInput.value }) });
      if (!response.ok) { commentError.textContent = result.message || "Message could not be added."; return; }
      showToast(result.message); await loadTickets();
    } catch (error) { commentError.textContent = error.message; }
    finally { commentButton.disabled = false; }
  });
  thread.append(commentForm); details.append(thread);

  if (currentUser.role === "admin") {
    const staff = make("form", "admin-update-form"); staff.append(make("h4", "", "Manage complaint"));
    const fields = make("div", "admin-control-grid");
    const statusLabel = make("label", "", "Status"); const statusSelect = make("select", ""); statusSelect.name = "status";
    statuses.forEach(value => { const o = make("option", "", value); o.value = value; o.selected = ticket.status === value; statusSelect.append(o); }); statusLabel.append(statusSelect);
    const priorityLabel = make("label", "", "Priority"); const prioritySelect = make("select", ""); prioritySelect.name = "priority";
    priorities.forEach(value => { const o = make("option", "", value); o.value = value; o.selected = ticket.priority === value; prioritySelect.append(o); }); priorityLabel.append(prioritySelect);
    fields.append(statusLabel, priorityLabel);
    const noteLabel = make("label", "staff-note-label", "Student-facing update (optional)"); const noteInput = make("textarea", ""); noteInput.name = "note"; noteInput.rows = 2; noteInput.maxLength = 600; noteInput.placeholder = "Explain the action taken or next step…"; noteLabel.append(noteInput);
    const save = make("button", "small-action-button", "Save complaint update"); save.type = "submit";
    const err = make("small", "comment-error"); staff.append(fields, noteLabel, err, save);
    staff.addEventListener("submit", async event => {
      event.preventDefault(); err.textContent = ""; save.disabled = true;
      try {
        const { response, result } = await api(`/api/tickets/${encodeURIComponent(ticket.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: statusSelect.value, priority: prioritySelect.value, note: noteInput.value }) });
        if (!response.ok) { err.textContent = result.message || "Update failed."; return; }
        showToast(result.message); await loadTickets();
      } catch (error) { err.textContent = error.message; }
      finally { save.disabled = false; }
    });
    details.append(staff);
  }

  card.append(headTop, referenceLine, detailsButton, details);
  return card;
}
function renderTickets(list) {
  ticketList.replaceChildren();
  if (!list.length) {
    const empty = make("div", "empty-state");
    empty.append(make("span", "empty-symbol", "⌕"), make("strong", "", "No matching complaints"), make("p", "", currentUser.role === "admin" ? "No complaints match these filters yet." : "Your registered complaints will appear here. Try another filter or report an issue."));
    if (currentUser.role === "student") { const link = make("a", "empty-cta", "Register a complaint →"); link.href = "#newComplaint"; empty.append(link); }
    ticketList.append(empty);
  } else list.forEach(ticket => ticketList.append(makeTicketCard(ticket)));
  document.querySelector("#resultCount").textContent = `${list.length} complaint${list.length === 1 ? "" : "s"} shown`;
}
async function loadTickets() {
  if (!currentUser) return;
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set("q", searchInput.value.trim());
  if (statusFilter.value !== "All") params.set("status", statusFilter.value);
  if (priorityFilter.value !== "All") params.set("priority", priorityFilter.value);
  try {
    const [filtered, all] = await Promise.all([api(`/api/tickets?${params}`), api("/api/tickets")]);
    if (!filtered.response.ok || !all.response.ok) throw new Error(filtered.result.message || all.result.message || "Could not load complaint records.");
    setApiState(true, "Server connected"); renderStats(all.result.data || []); renderTickets(filtered.result.data || []);
  } catch (error) {
    setApiState(false, "Connection issue"); ticketList.replaceChildren();
    const empty = make("div", "empty-state"); empty.append(make("strong", "", "Could not reach the server"), make("p", "", error.message || "Try refreshing after the Express server is running."));
    const button = make("button", "empty-cta", "Try again ↻"); button.type = "button"; button.addEventListener("click", loadTickets); empty.append(button); ticketList.append(empty);
  }
}

ticketForm.addEventListener("submit", async event => {
  event.preventDefault(); ticketErrors({});
  const button = document.querySelector("#submitButton"); button.disabled = true; button.classList.add("button-loading");
  try {
    const { response, result } = await api("/api/tickets", { method: "POST", body: new FormData(ticketForm) });
    if (!response.ok || !result.success) { ticketErrors(result.errors || {}); showToast(result.message || "Please review the complaint details.", "error"); return; }
    ticketForm.reset(); document.querySelector("#descriptionCount").textContent = "0 / 1200"; document.querySelector("#latitude").value = ""; document.querySelector("#longitude").value = "";
    geoHint.textContent = "Geolocation is optional and only accessed after you press the button."; clearPhotoPreview();
    showToast(result.message); searchInput.value = ""; statusFilter.value = "All"; priorityFilter.value = "All"; await loadTickets();
    document.querySelector("#complaints").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) { showToast(error.message || "Unable to register this complaint.", "error"); }
  finally { button.disabled = false; button.classList.remove("button-loading"); }
});
ticketForm.querySelectorAll("input, select, textarea").forEach(input => input.addEventListener("input", () => {
  const node = fieldErrorFor(input.name); if (node) { node.textContent = ""; node.classList.remove("visible"); input.removeAttribute("aria-invalid"); }
}));
description.addEventListener("input", () => { document.querySelector("#descriptionCount").textContent = `${description.value.length} / 1200`; });
searchInput.addEventListener("input", () => { clearTimeout(searchTimer); searchTimer = setTimeout(loadTickets, 250); });
statusFilter.addEventListener("change", loadTickets); priorityFilter.addEventListener("change", loadTickets); document.querySelector("#refreshButton").addEventListener("click", loadTickets);
document.querySelectorAll("[data-nav]").forEach(link => link.addEventListener("click", () => {
  document.querySelectorAll("[data-nav]").forEach(item => item.classList.toggle("active", item === link));
}));

document.querySelector("#geoButton").addEventListener("click", () => {
  if (!navigator.geolocation) { geoHint.textContent = "This browser does not support geolocation. Enter the location manually."; return; }
  geoButton.disabled = true; geoHint.textContent = "Waiting for location permission…";
  navigator.geolocation.getCurrentPosition(position => {
    const latitude = position.coords.latitude, longitude = position.coords.longitude;
    document.querySelector("#latitude").value = latitude.toFixed(6); document.querySelector("#longitude").value = longitude.toFixed(6);
    geoHint.textContent = `Location attached (${latitude.toFixed(4)}, ${longitude.toFixed(4)}). You can still edit the room or building above.`;
    const location = document.querySelector("#location"); if (!location.value.trim()) location.value = "Campus location shared";
    geoButton.disabled = false; showToast("Location attached to your complaint.");
  }, error => {
    const messages = { 1: "Location permission was denied. You can enter the place manually.", 2: "Your location could not be determined. Try again or enter it manually.", 3: "Location request timed out. Try again or enter it manually." };
    geoHint.textContent = messages[error.code] || "Location is unavailable. Enter the place manually."; geoButton.disabled = false;
  }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
});
function clearPhotoPreview() { if (currentPhotoUrl) URL.revokeObjectURL(currentPhotoUrl); currentPhotoUrl = null; const preview = document.querySelector("#photoPreview"); preview.replaceChildren(); preview.hidden = true; }
photoInput.addEventListener("change", () => {
  clearPhotoPreview(); const file = photoInput.files?.[0]; if (!file) return;
  if (! ["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 3 * 1024 * 1024) {
    const message = file.size > 3 * 1024 * 1024 ? "Photo must be 3 MB or smaller." : "Choose a JPG, PNG, or WEBP image.";
    photoInput.value = ""; ticketErrors({ photo: message }); showToast(message, "error"); return;
  }
  currentPhotoUrl = URL.createObjectURL(file); const preview = document.querySelector("#photoPreview");
  const image = make("img", "", ""); image.src = currentPhotoUrl; image.alt = "Selected complaint photo preview";
  const info = make("div", ""); info.append(make("strong", "", file.name), make("small", "", `${(file.size / 1024).toFixed(0)} KB`));
  const remove = make("button", "photo-remove", "Remove"); remove.type = "button"; remove.addEventListener("click", () => { photoInput.value = ""; clearPhotoPreview(); });
  preview.append(image, info, remove); preview.hidden = false;
});

updateAuthUI(); checkExistingSession();