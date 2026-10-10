import { useEffect, useMemo, useState } from "react";
import { createAnnouncement, createClub, createEvent, getClubs, getMyClubs, getCoordinators, getEventFeedback, getMyEvents, getEventRegistrations, updateAttendance, getAttendanceLink, updateEvent } from "../services/api";
import { getEventStart } from "../utils/calendar";

const tabs = [
  { id: "events", label: "Create event" },
  { id: "manageEvents", label: "Manage events" },
  { id: "announcements", label: "Publish announcement" },
  { id: "feedback", label: "Event feedback" },
  { id: "attendance", label: "Attendance & QR" },
  { id: "clubs", label: "Create club", adminOnly: true },
];

const ManagementWorkspace = ({ token, user }) => {
  const [activeTab, setActiveTab] = useState("events");
  const [clubs, setClubs] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedFeedbackEvent, setSelectedFeedbackEvent] = useState("");
  const [editingEventId, setEditingEventId] = useState("");
  const [feedbackRecords, setFeedbackRecords] = useState([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceCounts, setAttendanceCounts] = useState({ registeredCount: 0, waitlistedCount: 0 });
  const [selectedAttendanceEvent, setSelectedAttendanceEvent] = useState("");
  const [attendanceLink, setAttendanceLink] = useState("");
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attendanceError, setAttendanceError] = useState("");
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [clubForm, setClubForm] = useState({ name: "", category: "", description: "", logo: "", facultyCoordinator: "", studentCoordinator: "" });
  const [eventForm, setEventForm] = useState({
    club: "", title: "", description: "", date: "", time: "", venue: "", capacity: "50",
    registrationDeadline: "", category: "Workshop", status: "registration_open", locationUrl: "", organiserName: "", organiserEmail: "", organiserPhone: "",
  });
  const [announcementForm, setAnnouncementForm] = useState({ title: "", content: "", club: "", priority: "normal", status: "published" });

  const permittedClubs = useMemo(() => {
    const currentUserId = String(user?._id || user?.id || "");
    if (user?.role === "admin") return clubs;
    return clubs.filter((club) => {
      if (user?.role === "club_manager") {
        return String(club.owner?._id || club.owner || "") === currentUserId && club.status === "active";
      }
      if (user?.role === "club_coordinator") {
        return String(club.studentCoordinator?._id || club.studentCoordinator || "") === currentUserId;
      }
      if (user?.role === "faculty_coordinator") {
        return String(club.facultyCoordinator?._id || club.facultyCoordinator || "") === currentUserId;
      }
      return false;
    });
  }, [clubs, user]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const requests = [user?.role === "club_manager" ? getMyClubs(token) : getClubs()];
        if (user?.role === "admin") requests.push(getCoordinators(token));
        const [clubData, coordinatorData] = await Promise.all(requests);
        if (mounted) {
          setClubs((clubData.clubs || []).filter((club) => club.status === "active"));
          setCoordinators(coordinatorData?.coordinators || []);
        }
      } catch (loadError) {
        if (mounted) setError(loadError.message);
      } finally {
        if (mounted) setLoadingClubs(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [token, user?.role]);

  const managedEvents = useMemo(() => {
    const clubIds = new Set(permittedClubs.map((club) => String(club._id)));
    return events.filter((event) => clubIds.has(String(event.club?._id || event.club || "")));
  }, [events, permittedClubs]);
  const approvedManagedEvents = useMemo(() => managedEvents.filter((event) =>
    (!event.approvalStatus || event.approvalStatus === "approved") && event.status !== "draft"
  ), [managedEvents]);
  const feedbackEventId = approvedManagedEvents.some((event) => event._id === selectedFeedbackEvent)
    ? selectedFeedbackEvent
    : (approvedManagedEvents[0]?._id || "");
  const averageRating = feedbackRecords.length
    ? (feedbackRecords.reduce((sum, record) => sum + Number(record.rating || 0), 0) / feedbackRecords.length).toFixed(1)
    : "—";

  useEffect(() => {
    let mounted = true;
    getMyEvents(token)
      .then((data) => { if (mounted) setEvents(data.events || []); })
      .catch((loadError) => { if (mounted) setError(loadError.message); });
    return () => { mounted = false; };
  }, [token]);

  useEffect(() => {
    if (activeTab !== "feedback" || !feedbackEventId) {
      setFeedbackRecords([]);
      return undefined;
    }
    let mounted = true;
    const loadFeedback = async () => {
      try {
        setLoadingFeedback(true);
        const data = await getEventFeedback(token, feedbackEventId);
        if (mounted) setFeedbackRecords(data.feedback || []);
      } catch (loadError) {
        if (mounted) {
          setFeedbackRecords([]);
          setError(loadError.message);
        }
      } finally {
        if (mounted) setLoadingFeedback(false);
      }
    };
    loadFeedback();
    return () => { mounted = false; };
  }, [activeTab, feedbackEventId, token]);

  const attendanceEventId = approvedManagedEvents.some((event) => event._id === selectedAttendanceEvent)
    ? selectedAttendanceEvent
    : (approvedManagedEvents[0]?._id || "");

  useEffect(() => {
    if (activeTab !== "attendance" || !attendanceEventId) {
      setAttendanceRecords([]);
      setAttendanceLink("");
      return undefined;
    }
    let mounted = true;
    const loadAttendance = async () => {
      setLoadingAttendance(true);
      setAttendanceError("");
      try {
        const [registrationData, linkData] = await Promise.all([
          getEventRegistrations(token, attendanceEventId),
          getAttendanceLink(token, attendanceEventId),
        ]);
        if (mounted) {
          setAttendanceRecords(registrationData.registrations || []);
          setAttendanceCounts({ registeredCount: registrationData.registeredCount || 0, waitlistedCount: registrationData.waitlistedCount || 0 });
          setAttendanceLink(linkData.attendanceUrl || "");
        }
      } catch (loadError) {
        if (mounted) setAttendanceError(loadError.message);
      } finally {
        if (mounted) setLoadingAttendance(false);
      }
    };
    loadAttendance();
    return () => { mounted = false; };
  }, [activeTab, attendanceEventId, token]);

  const markPresent = async (registration, present) => {
    try {
      setAttendanceError("");
      await updateAttendance(token, registration._id, present);
      setAttendanceRecords((records) => records.map((record) => record._id === registration._id
        ? { ...record, checkedInAt: present ? (record.checkedInAt || new Date().toISOString()) : null }
        : record));
      setMessage(present ? "Attendance marked present." : "Attendance cleared.");
    } catch (attendanceUpdateError) {
      setAttendanceError(attendanceUpdateError.message);
    }
  };

  const exportAttendance = () => {
    const protectSpreadsheetFormula = (value) => {
      const text = String(value ?? "");
      return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    };
    const rows = [["Student", "Email", "Department", "Year", "Registration status", "Attendance", "Checked in at"]];
    attendanceRecords.forEach((record) => rows.push([
      record.student?.name || "", record.student?.email || "", record.student?.department || "", record.student?.year || "",
      record.status, record.checkedInAt ? "Present" : "Not checked in", record.checkedInAt ? new Date(record.checkedInAt).toISOString() : "",
    ]));
    const csv = rows.map((row) => row.map((value) => `"${protectSpreadsheetFormula(value).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `clubsphere-attendance-${attendanceEventId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const changeForm = (setter) => (event) => {
    const { name, value } = event.target;
    setter((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      if (activeTab === "clubs") {
        const data = await createClub(token, {
          ...clubForm,
          logo: clubForm.logo.trim(),
          facultyCoordinator: clubForm.facultyCoordinator || null,
          studentCoordinator: clubForm.studentCoordinator || null,
        });
        setClubs((current) => [data.club, ...current.filter((club) => club._id !== data.club._id)]);
        setClubForm({ name: "", category: "", description: "", logo: "", facultyCoordinator: "", studentCoordinator: "" });
        setMessage(data.message || "Club created successfully.");
      } else if (activeTab === "events") {
        if (!selectedEventClub) throw new Error("Create or select a club before creating an event.");
        const eventStartsAt = new Date(`${eventForm.date}T${eventForm.time}:00`);
        const registrationDeadline = new Date(eventForm.registrationDeadline);
        if (Number.isNaN(eventStartsAt.getTime()) || Number.isNaN(registrationDeadline.getTime())) {
          throw new Error("Enter a valid event date, time and registration deadline.");
        }
        if (registrationDeadline >= eventStartsAt) {
          throw new Error("The registration deadline must be earlier than the event date and time.");
        }
        const payload = {
          ...eventForm,
          club: selectedEventClub,
          date: eventStartsAt.toISOString(),
          registrationDeadline: registrationDeadline.toISOString(),
          capacity: Number(eventForm.capacity),
        };
        const data = editingEventId
          ? await updateEvent(token, editingEventId, payload)
          : await createEvent(token, payload);
        if (data.event) setEvents((current) => [data.event, ...current.filter((item) => item._id !== data.event._id)]);
        setEditingEventId("");
        setEventForm({ club: selectedEventClub, title: "", description: "", date: "", time: "", venue: "", capacity: "50", registrationDeadline: "", category: "Workshop", status: "registration_open", locationUrl: "", organiserName: user?.name || "", organiserEmail: user?.email || "", organiserPhone: "" });
        setMessage(data.message || (editingEventId ? "Event updated." : "Event submitted successfully."));
      } else {
        if (user?.role !== "admin" && !announcementForm.club) {
          throw new Error("Select one of your assigned clubs before publishing an announcement.");
        }
        const data = await createAnnouncement(token, {
          ...announcementForm,
          club: announcementForm.club || null,
        });
        setAnnouncementForm({ title: "", content: "", club: "", priority: "normal", status: "published" });
        setMessage(data.message || "Announcement published successfully.");
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  };

  const startEditingEvent = (event) => {
    const start = getEventStart(event);
    const pad = (value) => String(value).padStart(2, "0");
    const deadline = new Date(event.registrationDeadline);
    setEditingEventId(event._id);
    setEventForm({
      club: String(event.club?._id || event.club || ""),
      title: event.title || "", description: event.description || "",
      date: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
      time: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
      venue: event.venue || "", capacity: String(event.capacity || 50),
      registrationDeadline: Number.isNaN(deadline.getTime()) ? "" : `${deadline.getFullYear()}-${pad(deadline.getMonth() + 1)}-${pad(deadline.getDate())}T${pad(deadline.getHours())}:${pad(deadline.getMinutes())}`,
      category: event.category || "Workshop", status: event.status || "registration_open",
      locationUrl: event.locationUrl || "", organiserName: event.organiserName || user?.name || "",
      organiserEmail: event.organiserEmail || user?.email || "", organiserPhone: event.organiserPhone || "",
    });
    setActiveTab("events");
    setError(""); setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEventEdit = () => {
    setEditingEventId("");
    setEventForm({ club: selectedEventClub, title: "", description: "", date: "", time: "", venue: "", capacity: "50", registrationDeadline: "", category: "Workshop", status: "registration_open", locationUrl: "", organiserName: user?.name || "", organiserEmail: user?.email || "", organiserPhone: "" });
    setError(""); setMessage("");
  };

  const allowedTabs = tabs.filter((tab) => !tab.adminOnly || user?.role === "admin");
  const selectedEventClub = permittedClubs.some((club) => club._id === eventForm.club)
    ? eventForm.club
    : (permittedClubs[0]?._id || "");

  return (
    <section className="card border-0 shadow-sm mt-4" aria-labelledby="management-workspace-title">
      <div className="card-body p-4 p-lg-5">
        <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-4">
          <div>
            <span className="text-uppercase small fw-bold text-primary">Staff tools</span>
            <h3 id="management-workspace-title" className="fw-bold mb-1">Publish to your campus</h3>
            <p className="text-muted mb-0">Create event listings and announcements. Coordinators can publish for clubs assigned to them.</p>
          </div>
          <span className="badge rounded-pill text-bg-light align-self-lg-start">{user?.role?.replaceAll("_", " ")}</span>
        </div>

        <div className="d-flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Publishing tools">
          {allowedTabs.map((tab) => (
            <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id}
              className={`btn ${activeTab === tab.id ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => { setActiveTab(tab.id); setError(""); setMessage(""); }}>
              {tab.id === "events" && editingEventId ? "Edit event" : tab.label}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {message && <div className="alert alert-success" role="status">{message}</div>}

        {activeTab === "clubs" && user?.role === "admin" && (
          <form onSubmit={submit}>
            <div className="row g-3">
              <div className="col-md-6"><label className="form-label fw-semibold" htmlFor="club-name">Club name</label><input id="club-name" className="form-control" name="name" value={clubForm.name} onChange={changeForm(setClubForm)} maxLength={100} required /></div>
              <div className="col-md-6"><label className="form-label fw-semibold" htmlFor="club-category">Category</label><input id="club-category" className="form-control" name="category" value={clubForm.category} onChange={changeForm(setClubForm)} maxLength={80} placeholder="Technology, arts, sports…" required /></div>
              <div className="col-12"><label className="form-label fw-semibold" htmlFor="club-description">Description</label><textarea id="club-description" className="form-control" rows="4" name="description" value={clubForm.description} onChange={changeForm(setClubForm)} maxLength={3000} required /></div>
              <div className="col-12"><label className="form-label fw-semibold" htmlFor="club-logo">Logo URL <span className="text-muted fw-normal">(optional)</span></label><input id="club-logo" type="url" className="form-control" name="logo" value={clubForm.logo} onChange={changeForm(setClubForm)} maxLength={500} placeholder="https://…" /></div>
              <div className="col-md-6"><label className="form-label fw-semibold" htmlFor="club-faculty">Faculty coordinator <span className="text-muted fw-normal">(optional)</span></label><select id="club-faculty" className="form-select" name="facultyCoordinator" value={clubForm.facultyCoordinator} onChange={changeForm(setClubForm)}><option value="">Unassigned</option>{coordinators.filter((person) => person.role === "faculty_coordinator").map((person) => <option key={person._id} value={person._id}>{person.name} · {person.email}</option>)}</select></div>
              <div className="col-md-6"><label className="form-label fw-semibold" htmlFor="club-student">Student coordinator <span className="text-muted fw-normal">(optional)</span></label><select id="club-student" className="form-select" name="studentCoordinator" value={clubForm.studentCoordinator} onChange={changeForm(setClubForm)}><option value="">Unassigned</option>{coordinators.filter((person) => person.role === "club_coordinator").map((person) => <option key={person._id} value={person._id}>{person.name} · {person.email}</option>)}</select></div>
            </div>
            <button className="btn btn-primary mt-4" type="submit" disabled={saving}>{saving ? "Creating…" : "Create club"}</button>
          </form>
        )}

        {activeTab === "events" && (
          <form onSubmit={submit}>
            <h4 className="h5 fw-bold mb-3">{editingEventId ? "Edit event details" : "Propose an event"}</h4>
            <p className="text-muted">{user?.role === "admin" ? "Create or update a campus event." : "Your event proposal will remain private until an administrator approves it."}</p>
            <div className="row g-3">
              <div className="col-md-6"><label className="form-label fw-semibold" htmlFor="event-title">Event title</label><input id="event-title" className="form-control" name="title" value={eventForm.title} onChange={changeForm(setEventForm)} maxLength={150} required /></div>
              <div className="col-md-6"><label className="form-label fw-semibold" htmlFor="event-club">Organizing club</label><select id="event-club" className="form-select" name="club" value={selectedEventClub} onChange={changeForm(setEventForm)} required disabled={loadingClubs || !permittedClubs.length}><option value="">{loadingClubs ? "Loading clubs…" : "Select a club"}</option>{permittedClubs.map((club) => <option key={club._id} value={club._id}>{club.name}</option>)}</select></div>
              <div className="col-12"><label className="form-label fw-semibold" htmlFor="event-description">Description</label><textarea id="event-description" className="form-control" rows="3" name="description" value={eventForm.description} onChange={changeForm(setEventForm)} maxLength={3000} required /></div>
              <div className="col-md-4"><label className="form-label fw-semibold" htmlFor="event-date">Date</label><input id="event-date" type="date" className="form-control" name="date" value={eventForm.date} onChange={changeForm(setEventForm)} required /></div>
              <div className="col-md-4"><label className="form-label fw-semibold" htmlFor="event-time">Time</label><input id="event-time" type="time" className="form-control" name="time" value={eventForm.time} onChange={changeForm(setEventForm)} required /></div>
              <div className="col-md-4"><label className="form-label fw-semibold" htmlFor="event-capacity">Capacity</label><input id="event-capacity" type="number" min="1" max="100000" className="form-control" name="capacity" value={eventForm.capacity} onChange={changeForm(setEventForm)} required /></div>
              <div className="col-md-6"><label className="form-label fw-semibold" htmlFor="event-venue">Venue</label><input id="event-venue" className="form-control" name="venue" value={eventForm.venue} onChange={changeForm(setEventForm)} maxLength={180} required /></div>
              <div className="col-md-6"><label className="form-label fw-semibold" htmlFor="event-location-url">Location / map link <span className="text-muted fw-normal">(optional)</span></label><input id="event-location-url" type="url" className="form-control" name="locationUrl" value={eventForm.locationUrl} onChange={changeForm(setEventForm)} placeholder="https://maps.google.com/…" /></div>
              <div className="col-md-6"><label className="form-label fw-semibold" htmlFor="event-organiser-name">Organiser name</label><input id="event-organiser-name" className="form-control" name="organiserName" value={eventForm.organiserName} onChange={changeForm(setEventForm)} maxLength={100} placeholder={user?.name || "Event organiser"} /></div>
              <div className="col-md-6"><label className="form-label fw-semibold" htmlFor="event-organiser-email">Organiser contact email</label><input id="event-organiser-email" type="email" className="form-control" name="organiserEmail" value={eventForm.organiserEmail} onChange={changeForm(setEventForm)} maxLength={254} placeholder={user?.email || "organiser@college.edu"} /></div>
              <div className="col-md-6"><label className="form-label fw-semibold" htmlFor="event-organiser-phone">Organiser contact phone</label><input id="event-organiser-phone" className="form-control" name="organiserPhone" value={eventForm.organiserPhone} onChange={changeForm(setEventForm)} maxLength={40} /></div>
              <div className="col-md-6"><label className="form-label fw-semibold" htmlFor="event-category">Category</label><input id="event-category" className="form-control" name="category" value={eventForm.category} onChange={changeForm(setEventForm)} maxLength={80} required /></div>
              <div className="col-md-6"><label className="form-label fw-semibold" htmlFor="event-deadline">Registration deadline</label><input id="event-deadline" type="datetime-local" className="form-control" name="registrationDeadline" value={eventForm.registrationDeadline} onChange={changeForm(setEventForm)} required /></div>
              <div className="col-md-6"><label className="form-label fw-semibold" htmlFor="event-status">Publishing status</label><select id="event-status" className="form-select" name="status" value={eventForm.status} onChange={changeForm(setEventForm)}><option value="draft">Save as draft</option><option value="published">Published</option><option value="registration_open">Published — registration open</option><option value="registration_closed">Published — registration closed</option><option value="completed">Completed</option></select></div>
            </div>
            <div className="d-flex flex-wrap gap-2 mt-4">
              <button className="btn btn-primary" type="submit" disabled={saving || loadingClubs || permittedClubs.length === 0}>{saving ? "Saving…" : editingEventId ? "Save changes" : "Submit event for approval"}</button>
              {editingEventId && <button className="btn btn-outline-secondary" type="button" onClick={cancelEventEdit}>Cancel editing</button>}
            </div>
            {!loadingClubs && permittedClubs.length === 0 && <p className="small text-muted mt-2 mb-0">No assigned active clubs are available for this account yet.</p>}
          </form>
        )}

        {activeTab === "manageEvents" && (
          <div>
            <div className="d-flex flex-column flex-md-row justify-content-between gap-2 align-items-md-end mb-3">
              <div><h4 className="h5 fw-bold mb-1">Manage event proposals</h4><p className="text-muted mb-0">Edit a draft or revise rejected/pending proposals. Changes by non-admins return to the approval queue.</p></div>
              <button className="btn btn-primary" type="button" onClick={() => { cancelEventEdit(); setActiveTab("events"); }}>Create event</button>
            </div>
            {!managedEvents.length ? <div className="alert alert-info">No events are associated with the clubs you manage yet.</div> : <div className="row g-3">{managedEvents.map((event) => {
              const approval = event.approvalStatus || "approved";
              const approvalBadge = approval === "approved" ? "text-bg-success" : approval === "pending" ? "text-bg-warning" : "text-bg-danger";
              return <div className="col-12" key={event._id}><article className="card border-0 shadow-sm"><div className="card-body p-4"><div className="d-flex flex-column flex-lg-row justify-content-between gap-3"><div className="flex-grow-1"><div className="d-flex flex-wrap gap-2 align-items-center mb-2"><h5 className="h6 fw-bold mb-0">{event.title}</h5><span className={`badge ${approvalBadge}`}>{approval === "approved" ? "Approved" : approval === "pending" ? "Awaiting review" : "Rejected"}</span><span className="badge text-bg-light">{String(event.status || "").replaceAll("_", " ")}</span></div><p className="text-muted mb-2">{event.club?.name || permittedClubs.find((club) => club._id === (event.club?._id || event.club))?.name || "Club"} · {getEventStart(event).toLocaleString()}</p><p className="mb-2">{event.description}</p>{event.locationUrl && <a href={event.locationUrl} target="_blank" rel="noreferrer">Open location map ↗</a>}{approval === "rejected" && event.approvalNote && <div className="alert alert-danger mt-3 mb-0 py-2"><strong>Admin feedback:</strong> {event.approvalNote}</div>}{approval === "pending" && <div className="small text-muted mt-2">This proposal is not visible to students until approved.</div>}</div><div className="d-flex align-content-start gap-2"><button type="button" className="btn btn-outline-primary" onClick={() => startEditingEvent(event)}>Edit / revise</button></div></div></div></article></div>;
            })}</div>}
          </div>
        )}

        {activeTab === "announcements" && (
          <form onSubmit={submit}>
            <div className="row g-3">
              <div className="col-md-8"><label className="form-label fw-semibold" htmlFor="announcement-title">Title</label><input id="announcement-title" className="form-control" name="title" value={announcementForm.title} onChange={changeForm(setAnnouncementForm)} maxLength={160} required /></div>
              <div className="col-md-4"><label className="form-label fw-semibold" htmlFor="announcement-priority">Priority</label><select id="announcement-priority" className="form-select" name="priority" value={announcementForm.priority} onChange={changeForm(setAnnouncementForm)}><option value="normal">Normal</option><option value="important">Important</option><option value="urgent">Urgent</option></select></div>
              <div className="col-12"><label className="form-label fw-semibold" htmlFor="announcement-content">Announcement</label><textarea id="announcement-content" className="form-control" rows="5" name="content" value={announcementForm.content} onChange={changeForm(setAnnouncementForm)} maxLength={8000} required /></div>
              <div className="col-md-6"><label className="form-label fw-semibold" htmlFor="announcement-club">Audience</label><select id="announcement-club" className="form-select" name="club" value={announcementForm.club} onChange={changeForm(setAnnouncementForm)}><option value="">{user?.role === "admin" ? "Whole campus" : "Select a club"}</option>{permittedClubs.map((club) => <option key={club._id} value={club._id}>{club.name}</option>)}</select></div>
              <div className="col-md-6"><label className="form-label fw-semibold" htmlFor="announcement-status">Status</label><select id="announcement-status" className="form-select" name="status" value={announcementForm.status} onChange={changeForm(setAnnouncementForm)}><option value="published">Publish now</option><option value="draft">Save as draft</option></select></div>
            </div>
            {user?.role !== "admin" && <p className="small text-muted mt-2 mb-0">Coordinators must select one of their assigned clubs. Campus-wide announcements are admin-only.</p>}
            <button className="btn btn-primary mt-4" type="submit" disabled={saving || (user?.role !== "admin" && permittedClubs.length === 0)}>{saving ? "Saving…" : announcementForm.status === "draft" ? "Save draft" : "Publish announcement"}</button>
          </form>
        )}

        {activeTab === "attendance" && (
          <div>
            {attendanceError && <div className="alert alert-danger" role="alert">{attendanceError}</div>}
            <div className="row g-3 align-items-end mb-4">
              <div className="col-lg-8">
                <label className="form-label fw-semibold" htmlFor="attendance-event-select">Event</label>
                <select id="attendance-event-select" className="form-select" value={attendanceEventId} onChange={(event) => { setSelectedAttendanceEvent(event.target.value); setAttendanceRecords([]); setAttendanceLink(""); }} disabled={!approvedManagedEvents.length}>
                  {approvedManagedEvents.map((event) => <option key={event._id} value={event._id}>{event.title} · {new Date(event.date).toLocaleDateString()}</option>)}
                </select>
              </div>
              <div className="col-lg-4"><button type="button" className="btn btn-outline-primary w-100" onClick={exportAttendance} disabled={!attendanceRecords.length}>Download attendance CSV</button></div>
            </div>
            {!approvedManagedEvents.length && <div className="alert alert-info">Approved events for your managed clubs will appear here. Club event proposals must be approved first.</div>}
            {attendanceLink && managedEvents.length > 0 && (
              <div className="row g-4 align-items-center mb-4">
                <div className="col-auto"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(attendanceLink)}`} alt="Event check-in QR code" width="180" height="180" className="border rounded p-2 bg-white" loading="lazy" /></div>
                <div className="col">
                  <h5 className="fw-bold mb-1">On-site check-in QR</h5>
                  <p className="text-muted">Display this QR at the venue. Students must sign in and have an active event registration. Check-in is available from one hour before the event to four hours after it starts.</p>
                  <div className="input-group"><input className="form-control" readOnly value={attendanceLink} aria-label="Check-in link" /><button className="btn btn-outline-secondary" type="button" onClick={() => navigator.clipboard?.writeText(attendanceLink)}>Copy link</button></div>
                  <div className="small text-muted mt-2">The QR is rendered by an external QR image service. For a production deployment, switch to local QR generation before using sensitive or private event links.</div>
                </div>
              </div>
            )}
            {loadingAttendance ? <div className="py-4 text-center"><div className="spinner-border text-primary" /></div> : attendanceRecords.length > 0 ? (
              <>
                <div className="d-flex flex-wrap gap-3 mb-3"><span className="badge text-bg-primary">Registered: {attendanceCounts.registeredCount}</span><span className="badge text-bg-warning">Waitlist: {attendanceCounts.waitlistedCount}</span><span className="badge text-bg-success">Present: {attendanceRecords.filter((record) => record.checkedInAt).length}</span></div>
                <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Student</th><th>Department / Year</th><th>Registration</th><th>Attendance</th><th className="text-end">Action</th></tr></thead><tbody>
                  {attendanceRecords.map((record) => <tr key={record._id}>
                    <td><div className="fw-semibold">{record.student?.name || "Student"}</div><div className="small text-muted">{record.student?.email}</div></td>
                    <td>{[record.student?.department, record.student?.year].filter(Boolean).join(" · ") || "—"}</td>
                    <td><span className={`badge ${record.status === "waitlisted" ? "text-bg-warning" : "text-bg-light"}`}>{record.status}</span></td>
                    <td>{record.checkedInAt ? <><span className="badge text-bg-success">Present</span><div className="small text-muted">{new Date(record.checkedInAt).toLocaleTimeString()}</div></> : <span className="text-muted">Not checked in</span>}</td>
                    <td className="text-end">{record.status === "registered" && <button type="button" className={`btn btn-sm ${record.checkedInAt ? "btn-outline-secondary" : "btn-outline-success"}`} onClick={() => markPresent(record, !record.checkedInAt)}>{record.checkedInAt ? "Undo" : "Mark present"}</button>}</td>
                  </tr>)}
                </tbody></table></div>
              </>
            ) : !loadingAttendance && attendanceEventId ? <p className="text-muted py-4">No registrations for this event yet.</p> : null}
          </div>
        )}

        {activeTab === "feedback" && (
          <div>
            <div className="row g-3 align-items-end mb-4">
              <div className="col-lg-8">
                <label className="form-label fw-semibold" htmlFor="feedback-event-select">Event</label>
                <select id="feedback-event-select" className="form-select" value={feedbackEventId} onChange={(event) => { setSelectedFeedbackEvent(event.target.value); setFeedbackRecords([]); setError(""); }} disabled={!approvedManagedEvents.length}>
                  {approvedManagedEvents.map((event) => <option key={event._id} value={event._id}>{event.title} · {new Date(event.date).toLocaleDateString()}</option>)}
                </select>
              </div>
              <div className="col-lg-4">
                <div className="p-3 rounded-3 bg-light h-100">
                  <div className="small text-muted">Average rating</div>
                  <div className="h3 fw-bold mb-0">{averageRating}<span className="fs-6 text-muted ms-1">/ 5</span></div>
                  <div className="small text-muted">{feedbackRecords.length} {feedbackRecords.length === 1 ? "response" : "responses"}</div>
                </div>
              </div>
            </div>
            {loadingFeedback && <div className="text-center py-4"><div className="spinner-border text-primary" /><p className="text-muted mt-2 mb-0">Loading feedback…</p></div>}
            {!loadingFeedback && !approvedManagedEvents.length && <div className="text-center py-5"><h6 className="fw-bold">No event feedback available</h6><p className="text-muted mb-0">Published events for your assigned clubs appear here. Feedback becomes available after an event.</p></div>}
            {!loadingFeedback && approvedManagedEvents.length > 0 && feedbackRecords.length === 0 && <div className="text-center py-5"><h6 className="fw-bold">No reviews yet</h6><p className="text-muted mb-0">When eligible students submit feedback, their ratings and comments will appear here.</p></div>}
            {!loadingFeedback && feedbackRecords.length > 0 && (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead><tr><th>Student</th><th>Rating</th><th>Feedback</th><th>Submitted</th></tr></thead>
                  <tbody>{feedbackRecords.map((record) => (
                    <tr key={record._id}>
                      <td><div className="fw-semibold">{record.student?.name || "Student"}</div><div className="small text-muted">{record.student?.email || ""}</div><div className="small text-muted">{[record.student?.department, record.student?.year].filter(Boolean).join(" · ")}</div></td>
                      <td><span className="badge text-bg-light">{record.rating}/5</span></td>
                      <td style={{ minWidth: "240px", whiteSpace: "pre-wrap" }}>{record.comment}</td>
                      <td className="text-nowrap">{new Date(record.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default ManagementWorkspace;
