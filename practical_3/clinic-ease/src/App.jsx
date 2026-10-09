import { useEffect, useMemo, useState } from "react";
import {
  Activity, CalendarDays, CheckCircle2, ChevronDown, Clock3, HeartPulse,
  LayoutDashboard, Search, Stethoscope, Users, X, Plus, Trash2, Phone,
  CalendarCheck, CircleAlert, Sparkles, ArrowUpRight, Menu, FileDown, Pencil, Printer
} from "lucide-react";

const doctors = [
  { name: "Dr. Aditi Sharma", specialty: "General Physician", initials: "AS", color: "lavender", days: "Mon – Sat" },
  { name: "Dr. Rohan Mehta", specialty: "Cardiologist", initials: "RM", color: "mint", days: "Mon – Fri" },
  { name: "Dr. Neha Kulkarni", specialty: "Dermatologist", initials: "NK", color: "peach", days: "Tue – Sat" },
  { name: "Dr. Arjun Desai", specialty: "Orthopedic", initials: "AD", color: "blue", days: "Mon – Sat" },
  { name: "Dr. Sana Khan", specialty: "Pediatrician", initials: "SK", color: "pink", days: "Mon – Fri" }
];
const slots = ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM"];
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const prettyDate = (date) => new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const seedAppointments = [
  { id: 101, name: "Priya Patil", age: "28", phone: "9876543210", doctor: "Dr. Aditi Sharma", date: todayISO(), time: "10:00 AM", reason: "Routine check-up", status: "Confirmed" },
  { id: 102, name: "Aarav Joshi", age: "42", phone: "9823012345", doctor: "Dr. Rohan Mehta", date: todayISO(), time: "11:30 AM", reason: "Heart health consultation", status: "Confirmed" },
  { id: 103, name: "Mira Shah", age: "19", phone: "9765432109", doctor: "Dr. Neha Kulkarni", date: todayISO(), time: "02:00 PM", reason: "Skin consultation", status: "Confirmed" }
];

function App() {
  const [appointments, setAppointments] = useState(() => {
    try {
      const saved = localStorage.getItem("clinicease-appointments");
      return saved ? JSON.parse(saved) : seedAppointments;
    } catch { return seedAppointments; }
  });
  const [form, setForm] = useState({ name: "", age: "", phone: "", doctor: "", date: todayISO(), time: "", reason: "", visitType: "In-person" });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [activeNav, setActiveNav] = useState("Overview");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    localStorage.setItem("clinicease-appointments", JSON.stringify(appointments));
  }, [appointments]);

  const today = todayISO();
  const todaysAppointments = appointments.filter(a => a.date === today && a.status !== "Cancelled");
  const upcoming = appointments.filter(a => a.date >= today && a.status !== "Cancelled");
  const confirmed = appointments.filter(a => a.status === "Confirmed");
  const checkedIn = appointments.filter(a => a.status === "Checked In");
  const completed = appointments.filter(a => a.status === "Completed");
  const filteredAppointments = useMemo(() => appointments.filter(a => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || [a.name, a.doctor, a.phone, a.reason].some(v => (v || "").toLowerCase().includes(q));
    const matchesFilter = filter === "All" || a.status === filter;
    return matchesSearch && matchesFilter;
  }).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)), [appointments, search, filter]);

  const updateForm = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = "Enter the patient's full name (at least 2 characters).";
    if (!form.age || !Number.isInteger(Number(form.age)) || Number(form.age) < 1 || Number(form.age) > 120) next.age = "Enter a valid age between 1 and 120.";
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) next.phone = "Enter a valid 10-digit Indian mobile number.";
    if (!form.doctor) next.doctor = "Please select a doctor.";
    if (!form.date || form.date < today) next.date = "Choose today or a future date.";
    if (!form.time) next.time = "Please select an appointment time.";
    if (form.date === today && form.time) {
      const [time, meridiem] = form.time.split(" ");
      let [hours, minutes] = time.split(":").map(Number);
      if (meridiem === "PM" && hours !== 12) hours += 12;
      if (meridiem === "AM" && hours === 12) hours = 0;
      const chosen = new Date(); chosen.setHours(hours, minutes, 0, 0);
      if (chosen <= new Date()) next.time = "This time has passed. Choose a later slot.";
    }
    if (form.reason.trim().length > 250) next.reason = "Keep the reason under 250 characters.";
    const duplicate = appointments.some(a => a.id !== editingId && !["Cancelled", "Completed"].includes(a.status) && a.doctor === form.doctor && a.date === form.date && a.time === form.time);
    if (form.doctor && form.date && form.time && duplicate) next.time = "This doctor already has a booking at this time. Choose another slot.";
    return next;
  };

  const submitAppointment = (e) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setNotice({ type: "error", text: "Please correct the highlighted fields before booking." });
      return;
    }
    const savedAppointment = { ...form, id: editingId ?? Date.now(), name: form.name.trim(), phone: form.phone.trim(), reason: form.reason.trim() || "General consultation", visitType: form.visitType || "In-person", status: editingId !== null ? (appointments.find(a => a.id === editingId)?.status || "Confirmed") : "Confirmed" };
    if (editingId !== null) {
      setAppointments(prev => prev.map(a => a.id === editingId ? savedAppointment : a));
      setNotice({ type: "success", text: `Appointment updated for ${savedAppointment.name}.` });
    } else {
      setAppointments(prev => [savedAppointment, ...prev]);
      setNotice({ type: "success", text: `Appointment confirmed for ${savedAppointment.name} with ${savedAppointment.doctor}.` });
    }
    setForm({ name: "", age: "", phone: "", doctor: "", date: todayISO(), time: "", reason: "", visitType: "In-person" });
    setEditingId(null);
    setErrors({});
    setShowForm(false);
    setActiveNav("Appointments");
  };

  const cancelAppointment = (id) => {
    const target = appointments.find(a => a.id === id);
    if (!target || !window.confirm(`Cancel the appointment for ${target.name}?`)) return;
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "Cancelled" } : a));
    setNotice({ type: "success", text: "Appointment cancelled successfully." });
  };

  const openBooking = () => { setNotice(null); setErrors({}); setEditingId(null); setForm({ name: "", age: "", phone: "", doctor: "", date: todayISO(), time: "", reason: "", visitType: "In-person" }); setShowForm(true); setActiveNav("Book appointment"); };
  const editAppointment = (appointment) => {
    setForm({ name: appointment.name, age: appointment.age, phone: appointment.phone, doctor: appointment.doctor, date: appointment.date, time: appointment.time, reason: appointment.reason === "General consultation" ? "" : appointment.reason, visitType: appointment.visitType || "In-person" });
    setEditingId(appointment.id); setErrors({}); setNotice(null); setShowForm(true); setActiveNav("Book appointment");
  };
  const exportCSV = () => {
    if (!appointments.length) { setNotice({ type: "error", text: "There are no appointments to export." }); return; }
    const columns = ["id", "name", "age", "phone", "doctor", "date", "time", "visitType", "reason", "status"];
    const escape = value => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [columns.join(","), ...appointments.map(a => columns.map(key => escape(a[key])).join(","))].join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = `clinicease-appointments-${todayISO()}.csv`; link.click(); URL.revokeObjectURL(url);
    setNotice({ type: "success", text: "Appointment list exported as a CSV file." });
  };
  const closeBooking = () => { setShowForm(false); setErrors({}); setEditingId(null); };
  const updateStatus = (id, status) => {
    const target = appointments.find(a => a.id === id);
    if (!target) return;
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    setNotice({ type: "success", text: `${target.name}'s appointment marked ${status.toLowerCase()}.` });
  };
  const availableSlots = slots.filter(slot => !appointments.some(a =>
    a.id !== editingId && a.doctor === form.doctor && a.date === form.date &&
    a.time === slot && !["Cancelled", "Completed"].includes(a.status)
  ));
  const selectedDoctor = doctors.find(d => d.name === form.doctor);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand"><div className="brand-mark"><HeartPulse size={23} /></div><div><strong>ClinicEase</strong><span>CARE, MADE SIMPLE</span></div><button className="mobile-close icon-button" onClick={() => setMobileMenu(false)} aria-label="Close menu"><X size={18}/></button></div>
        <div className="side-label">WORKSPACE</div>
        <nav className="nav-list">
          <button className={`nav-item ${activeNav === "Overview" ? "active" : ""}`} onClick={() => { setActiveNav("Overview"); setShowForm(false); setMobileMenu(false); }}><LayoutDashboard size={18}/> Overview</button>
          <button className={`nav-item ${activeNav === "Appointments" ? "active" : ""}`} onClick={() => { setActiveNav("Appointments"); setShowForm(false); setMobileMenu(false); }}><CalendarDays size={18}/> Appointments <span className="nav-count">{appointments.length}</span></button>
          <button className={`nav-item ${activeNav === "Book appointment" ? "active" : ""}`} onClick={() => { openBooking(); setMobileMenu(false); }}><Plus size={18}/> Book appointment</button>
        </nav>
        <div className="sidebar-spacer"/>
        <div className="help-card"><div className="help-icon"><Sparkles size={17}/></div><strong>A healthier you starts here.</strong><p>Simple scheduling, more time for care.</p><button onClick={openBooking}>Book a visit <ArrowUpRight size={15}/></button></div>
        <div className="profile"><div className="profile-avatar">CA</div><div><strong>Clinic Admin</strong><span>Administrator</span></div><ChevronDown size={16} className="profile-chevron"/></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setMobileMenu(true)} aria-label="Open menu"><Menu size={20}/></button>
          <div className="breadcrumb">Workspace <span>/</span> <strong>{showForm ? "Book appointment" : activeNav}</strong></div>
          <div className="topbar-right"><span className="live-dot"/><span className="open-label">Clinic dashboard</span><div className="top-avatar">CA</div></div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div><div className="eyebrow"><span className="eyebrow-line"/> YOUR CLINIC, IN ONE PLACE</div><h1>{showForm ? "Book an appointment" : activeNav === "Appointments" ? "Appointments" : "Good care starts with a plan."}</h1><p>{showForm ? "Fill in the details below to reserve a consultation." : "A clearer view of your schedule and patient visits."}</p></div>
            <button className="primary-button" onClick={openBooking}><Plus size={18}/> New appointment</button>
          </section>

          {notice && <div className={`notice ${notice.type}`} role="status"><span>{notice.type === "success" ? <CheckCircle2 size={19}/> : <CircleAlert size={19}/>}</span><p>{notice.text}</p><button onClick={() => setNotice(null)} aria-label="Dismiss message"><X size={17}/></button></div>}

          {!showForm && <>
            <section className="stats-grid">
              <div className="stat-card"><div className="stat-top"><span>Appointments today</span><div className="stat-icon purple"><CalendarCheck size={19}/></div></div><div className="stat-number">{todaysAppointments.length.toString().padStart(2, "0")}</div><div className="stat-foot"><span className="stat-dot purple-dot"/>Scheduled for today</div></div>
              <div className="stat-card"><div className="stat-top"><span>Upcoming visits</span><div className="stat-icon green"><Clock3 size={19}/></div></div><div className="stat-number">{upcoming.length.toString().padStart(2, "0")}</div><div className="stat-foot"><span className="stat-dot green-dot"/>Today and future bookings</div></div>
              <div className="stat-card"><div className="stat-top"><span>Confirmed</span><div className="stat-icon blue"><CheckCircle2 size={19}/></div></div><div className="stat-number">{confirmed.length.toString().padStart(2, "0")}</div><div className="stat-foot"><span className="stat-dot blue-dot"/>Ready for consultation</div></div>
              <div className="stat-card"><div className="stat-top"><span>Care team</span><div className="stat-icon peach"><Stethoscope size={19}/></div></div><div className="stat-number">{doctors.length.toString().padStart(2, "0")}</div><div className="stat-foot"><span className="stat-dot peach-dot"/>Specialists available</div></div>
              <div className="stat-card"><div className="stat-top"><span>Checked in</span><div className="stat-icon green"><Users size={19}/></div></div><div className="stat-number">{checkedIn.length.toString().padStart(2, "0")}</div><div className="stat-foot"><span className="stat-dot green-dot"/>Patients arrived</div></div>
              <div className="stat-card"><div className="stat-top"><span>Completed visits</span><div className="stat-icon blue"><CheckCircle2 size={19}/></div></div><div className="stat-number">{completed.length.toString().padStart(2, "0")}</div><div className="stat-foot"><span className="stat-dot blue-dot"/>Consultations finished</div></div>
            </section>

            <section className="content-grid">
              <div className="panel appointments-panel">
                <div className="panel-heading"><div><h2>{activeNav === "Appointments" ? "All appointments" : "Appointment schedule"}</h2><p>Manage and review patient bookings</p></div><div className="heading-actions"><button className="text-button" onClick={exportCSV}><FileDown size={15}/> Export CSV</button><button className="text-button print-button" onClick={() => window.print()}><Printer size={15}/> Print</button><button className="text-button" onClick={() => setActiveNav("Appointments")}>View all <ArrowUpRight size={15}/></button></div></div>
                <div className="table-tools"><label className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient, doctor..." aria-label="Search appointments"/></label><label className="filter-select"><select value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter by status"><option>All</option><option>Confirmed</option><option>Checked In</option><option>Completed</option><option>Cancelled</option></select><ChevronDown size={15}/></label></div>
                <div className="appointment-list">
                  {filteredAppointments.length === 0 ? <div className="empty-state"><CalendarDays size={28}/><strong>No appointments found</strong><span>Try changing your search or book a new visit.</span><button className="secondary-button" onClick={openBooking}>Book appointment</button></div> :
                    filteredAppointments.slice(0, activeNav === "Appointments" ? 50 : 5).map(a => {
                      const doc = doctors.find(d => d.name === a.doctor);
                      return <article className="appointment-row" key={a.id}>
                        <div className={`doctor-avatar ${doc?.color || "lavender"}`}>{doc?.initials || "DR"}</div>
                        <div className="appointment-person"><strong>{a.name}</strong><span>{a.doctor}</span><small><Phone size={12}/> {a.phone}</small><small className="visit-type-label">{a.visitType || "In-person"}</small></div>
                        <div className="appointment-when"><strong>{prettyDate(a.date)}</strong><span><Clock3 size={13}/> {a.time}</span></div>
                        <div className="appointment-actions"><span className={`status-pill ${a.status.toLowerCase().replace(" ", "-")}`}>{a.status}</span>
                          {a.status === "Confirmed" && <button className="row-action workflow-action" title="Mark patient checked in" aria-label={`Check in ${a.name}`} onClick={() => updateStatus(a.id, "Checked In")}><CheckCircle2 size={15}/></button>}
                          {a.status === "Checked In" && <button className="row-action workflow-action" title="Mark visit completed" aria-label={`Complete visit for ${a.name}`} onClick={() => updateStatus(a.id, "Completed")}><CalendarCheck size={15}/></button>}
                          {!["Cancelled", "Completed"].includes(a.status) && <><button className="row-action" title="Edit appointment" aria-label={`Edit appointment for ${a.name}`} onClick={() => editAppointment(a)}><Pencil size={14}/></button><button className="row-action" title="Cancel appointment" aria-label={`Cancel appointment for ${a.name}`} onClick={() => cancelAppointment(a.id)}><Trash2 size={15}/></button></>}</div>
                      </article>;
                    })}
                </div>
                <div className="panel-footer"><span>Showing {Math.min(filteredAppointments.length, activeNav === "Appointments" ? 50 : 5)} of {filteredAppointments.length} appointments</span><span className="secure-note"><Activity size={14}/> Updated live</span></div>
              </div>

              <div className="right-column">
                <div className="panel date-panel"><div className="panel-heading"><div><h2>Today at a glance</h2><p>Your daily overview</p></div><div className="calendar-mini"><CalendarDays size={18}/></div></div><div className="today-date"><span>{new Date().toLocaleDateString("en-IN", { weekday: "long" })}</span><strong>{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long" })}</strong></div><div className="mini-progress"><div><span>Daily schedule</span><strong>{todaysAppointments.length} visits</strong></div><div className="progress-track"><span style={{ width: `${Math.min(100, todaysAppointments.length / 8 * 100)}%` }}/></div><small>{todaysAppointments.length >= 8 ? "Busy day — schedule is filling up." : "Room available for more appointments."}</small></div></div>
                <div className="panel doctors-panel"><div className="panel-heading"><div><h2>Meet the care team</h2><p>Choose a specialist for your visit</p></div><Users size={19} className="muted-icon"/></div><div className="doctor-list">{doctors.slice(0, 4).map(d => <button className="doctor-item" key={d.name} onClick={() => { setForm(prev => ({ ...prev, doctor: d.name })); openBooking(); }}><div className={`doctor-avatar small ${d.color}`}>{d.initials}</div><div><strong>{d.name}</strong><span>{d.specialty}</span></div><ArrowUpRight size={15} className="doctor-arrow"/></button>)}</div><button className="full-width-button" onClick={openBooking}>Find your doctor <ArrowUpRight size={15}/></button></div>
              </div>
            </section>
          </>}

          {showForm && <section className="booking-layout">
            <div className="panel booking-panel">
              <div className="panel-heading booking-heading"><div><div className="section-kicker"><CalendarCheck size={16}/> APPOINTMENT DETAILS</div><h2>{editingId !== null ? "Edit appointment" : "Patient information"}</h2><p>Fields marked with * are required.</p></div><button className="icon-button" onClick={closeBooking} aria-label="Close form"><X size={19}/></button></div>
              <form onSubmit={submitAppointment} noValidate>
                <div className="form-grid">
                  <div className="field full"><label htmlFor="name">Patient full name <span>*</span></label><input id="name" name="name" value={form.name} onChange={updateForm} placeholder="e.g. Ananya Deshmukh" autoComplete="name" aria-invalid={!!errors.name}/>{errors.name && <small className="field-error">{errors.name}</small>}</div>
                  <div className="field"><label htmlFor="age">Age <span>*</span></label><input id="age" name="age" type="number" min="1" max="120" value={form.age} onChange={updateForm} placeholder="Age in years" aria-invalid={!!errors.age}/>{errors.age && <small className="field-error">{errors.age}</small>}</div>
                  <div className="field"><label htmlFor="phone">Mobile number <span>*</span></label><input id="phone" name="phone" type="tel" inputMode="numeric" maxLength="10" value={form.phone} onChange={updateForm} placeholder="10-digit number" autoComplete="tel" aria-invalid={!!errors.phone}/>{errors.phone && <small className="field-error">{errors.phone}</small>}</div>
                  <div className="field full"><label htmlFor="doctor">Select doctor <span>*</span></label><select id="doctor" name="doctor" value={form.doctor} onChange={updateForm} aria-invalid={!!errors.doctor}><option value="">Choose a specialist</option>{doctors.map(d => <option key={d.name} value={d.name}>{d.name} — {d.specialty}</option>)}</select>{errors.doctor && <small className="field-error">{errors.doctor}</small>}{selectedDoctor && <div className="doctor-selected"><CheckCircle2 size={14}/> {selectedDoctor.specialty} · Available {selectedDoctor.days}</div>}</div>
                  <div className="field full"><label htmlFor="visitType">Consultation type <span>*</span></label><select id="visitType" name="visitType" value={form.visitType || "In-person"} onChange={updateForm}><option value="In-person">In-person visit</option><option value="Video consultation">Video consultation</option><option value="Follow-up">Follow-up visit</option></select><div className="field-hint">Choose the format that suits the patient.</div></div>
                  <div className="field"><label htmlFor="date">Appointment date <span>*</span></label><input id="date" name="date" type="date" min={today} value={form.date} onChange={updateForm} aria-invalid={!!errors.date}/>{errors.date && <small className="field-error">{errors.date}</small>}</div>
                  <div className="field"><label htmlFor="time">Available time <span>*</span></label><select id="time" name="time" value={form.time} onChange={updateForm} aria-invalid={!!errors.time}><option value="">Select a time slot</option>{(form.doctor && form.date ? availableSlots : slots).map(s => <option key={s} value={s}>{s}</option>)}</select>{errors.time && <small className="field-error">{errors.time}</small>}{form.doctor && form.date && availableSlots.length === 0 && <small className="field-hint">No open slots for this doctor and date. Try another date.</small>}</div>
                  <div className="field full"><label htmlFor="reason">Reason for visit <span className="optional">(optional)</span></label><textarea id="reason" name="reason" rows="3" maxLength="250" value={form.reason} onChange={updateForm} placeholder="Briefly describe the reason for your visit..."/><div className="field-hint">{form.reason.length}/250 characters. Please don't include sensitive medical details.</div></div>
                </div>
                <div className="form-note"><HeartPulse size={18}/><span>Your information stays in this browser for this demo. This is not a real clinic booking service.</span></div>
                <div className="form-actions"><button type="button" className="secondary-button" onClick={closeBooking}>Back to dashboard</button><button type="submit" className="primary-button"><CalendarCheck size={17}/> {editingId !== null ? "Save changes" : "Confirm appointment"}</button></div>
              </form>
            </div>
            <aside className="booking-aside"><div className="booking-illustration"><div className="illustration-circle"><HeartPulse size={40}/></div><span className="float-plus">+</span><span className="float-cross">✳</span></div><h3>Care that fits your schedule.</h3><p>Choose a specialist and a time that works for you. Your appointment details will appear on the dashboard after confirmation.</p><div className="aside-benefit"><span><CheckCircle2 size={17}/></span><div><strong>Quick and simple</strong><small>Book in just a few steps</small></div></div><div className="aside-benefit"><span><CheckCircle2 size={17}/></span><div><strong>Instant confirmation</strong><small>See your booking immediately</small></div></div><div className="aside-benefit"><span><CheckCircle2 size={17}/></span><div><strong>Easy management</strong><small>Search or cancel a booking</small></div></div></aside>
          </section>}
          <footer className="page-footer"><span>© {new Date().getFullYear()} ClinicEase</span><span>Designed for better everyday care <HeartPulse size={13}/></span></footer>
        </div>
      </main>
    </div>
  );
}

export default App;