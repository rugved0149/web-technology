import { useCallback, useEffect, useState } from "react";
import { cancelClubDeletion, getAdminClubApplications, getAdminClubDetails, getMyClubs, getPendingEvents, getCoordinators, requestClubDeletion, reviewClubApplication, reviewEventProposal, updateClub } from "../services/api";
import { useAuth } from "../context/AuthContext";

const tabs = [
  { id: "directory", label: "Club directory" },
  { id: "clubs", label: "Club applications" },
  { id: "events", label: "Event proposals" },
  { id: "deletions", label: "Deletion requests" },
];

const AdminReview = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("clubs");
  const [clubs, setClubs] = useState([]);
  const [directoryClubs, setDirectoryClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [details, setDetails] = useState({});
  const [expandedClubId, setExpandedClubId] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [clubData, eventData, directoryData, coordinatorData] = await Promise.all([getAdminClubApplications(token), getPendingEvents(token), getMyClubs(token), getCoordinators(token)]);
      setClubs(clubData.clubs || []);
      setEvents(eventData.events || []);
      setDirectoryClubs(directoryData.clubs || []);
      setCoordinators(coordinatorData.coordinators || []);
    } catch (loadError) { setError(loadError.message); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { refresh(); }, [refresh]);

  const toggleDetails = async (clubId) => {
    if (expandedClubId === clubId) { setExpandedClubId(""); return; }
    setExpandedClubId(clubId); setError("");
    if (details[clubId]) return;
    try {
      const data = await getAdminClubDetails(token, clubId);
      setDetails((current) => ({ ...current, [clubId]: data }));
    } catch (loadError) { setError(loadError.message); }
  };

  const assignCoordinators = async (event, clubId) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const payload = {
      facultyCoordinator: values.get("facultyCoordinator") || null,
      studentCoordinator: values.get("studentCoordinator") || null,
    };
    setActionId(clubId); setError(""); setMessage("");
    try {
      const result = await updateClub(token, clubId, payload);
      const detail = await getAdminClubDetails(token, clubId);
      setDetails((current) => ({ ...current, [clubId]: detail }));
      const directoryData = await getMyClubs(token);
      setDirectoryClubs(directoryData.clubs || []);
      setMessage(result.message || "Coordinator assignments updated.");
    } catch (actionError) { setError(actionError.message); }
    finally { setActionId(""); }
  };

  const reviewClub = async (club, decision) => {
    const note = decision === "reject" ? window.prompt(`Why are you rejecting ${club.name}? This note will be shown to the applicant.`, "Please update the submitted details.") : "";
    if (decision === "reject" && note === null) return;
    const prompt = decision === "approve"
      ? `Approve ${club.name}? It will become publicly discoverable and the representative can submit event proposals.`
      : `Reject the application from ${club.name}?`;
    if (!window.confirm(prompt)) return;
    setActionId(club._id); setError(""); setMessage("");
    try {
      const result = await reviewClubApplication(token, club._id, decision, note || "");
      setMessage(result.message); await refresh();
    } catch (actionError) { setError(actionError.message); }
    finally { setActionId(""); }
  };

  const reviewEvent = async (event, decision) => {
    const note = decision === "reject" ? window.prompt(`Why are you rejecting ${event.title}? This note will be visible to the proposal manager.`, "Please revise the proposal details.") : "";
    if (decision === "reject" && note === null) return;
    if (!window.confirm(`${decision === "approve" ? "Approve and publish" : "Reject"} “${event.title}”?`)) return;
    setActionId(event._id); setError(""); setMessage("");
    try {
      const result = await reviewEventProposal(token, event._id, decision, note || "");
      setMessage(result.message); await refresh();
    } catch (actionError) { setError(actionError.message); }
    finally { setActionId(""); }
  };

  const scheduleDeletion = async (club) => {
    const reason = window.prompt(`Schedule ${club.name} for deletion? It will disappear from the public directory immediately and be permanently deleted after 7 days.`, "Administrator request");
    if (reason === null) return;
    if (!window.confirm(`Confirm the seven-day deletion schedule for ${club.name}?`)) return;
    setActionId(club._id); setError(""); setMessage("");
    try {
      const result = await requestClubDeletion(token, club._id, reason);
      setMessage(result.message); await refresh();
    } catch (actionError) { setError(actionError.message); }
    finally { setActionId(""); }
  };

  const restoreClub = async (club) => {
    if (!window.confirm(`Cancel permanent deletion for ${club.name}? This restores it as an active public club.`)) return;
    setActionId(club._id); setError(""); setMessage("");
    try {
      const result = await cancelClubDeletion(token, club._id);
      setMessage(result.message); await refresh();
    } catch (actionError) { setError(actionError.message); }
    finally { setActionId(""); }
  };

  const clubApplications = clubs.filter((club) => club.status === "pending_approval");
  const deletionRequests = clubs.filter((club) => club.status === "deletion_pending");

  return (
    <div>
      <section className="page-header py-5">
        <div className="container">
          <span className="eyebrow text-primary">Administrator console</span>
          <h1 className="display-5 fw-bold mt-2 mb-2">Review queue</h1>
          <p className="text-muted mb-0">Review full club dossiers, approve event proposals and manage scheduled club deletions.</p>
        </div>
      </section>
      <section className="py-5"><div className="container">
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {message && <div className="alert alert-success" role="status">{message}</div>}
        <div className="d-flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Review queues">
          {tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} className={`btn ${activeTab === tab.id ? "btn-primary" : "btn-outline-secondary"}`} onClick={() => setActiveTab(tab.id)}>{tab.label} <span className="badge text-bg-light ms-1">{tab.id === "directory" ? directoryClubs.filter((club) => club.status === "active" || club.status === "inactive").length : tab.id === "clubs" ? clubApplications.length : tab.id === "events" ? events.length : deletionRequests.length}</span></button>)}
          <button className="btn btn-outline-secondary ms-auto" type="button" onClick={refresh} disabled={loading}>Refresh</button>
        </div>

        {loading ? <div className="text-center py-5"><div className="spinner-border text-primary" /><p className="text-muted mt-3">Loading review queue…</p></div> : null}

        {!loading && activeTab === "directory" && (directoryClubs.filter((club) => ["active", "inactive"].includes(club.status)).length === 0 ? <div className="card border-0 shadow-sm"><div className="card-body p-5 text-center"><h2 className="h5 fw-bold">No active clubs</h2><p className="text-muted mb-0">Approved clubs will appear here.</p></div></div> : <div className="d-flex flex-column gap-3">{directoryClubs.filter((club) => ["active", "inactive"].includes(club.status)).map((club) => <article className="card border-0 shadow-sm" key={club._id}><div className="card-body p-4"><div className="d-flex flex-column flex-lg-row justify-content-between gap-3"><div className="flex-grow-1"><div className="d-flex flex-wrap gap-2 mb-2"><span className={`badge ${club.status === "active" ? "text-bg-success" : "text-bg-secondary"}`}>{club.status}</span><span className="badge text-bg-light">{club.category}</span><span className="badge text-bg-light">{club.department || "Other department"}</span></div><h2 className="h5 fw-bold mb-2">{club.name}</h2><p className="text-muted mb-2">{club.description}</p><div className="small text-muted">Contact: {club.contactEmail || "—"} · {club.contactPhone || "No phone"} · Key members: {club.keyMembers?.length || 0}</div><div className="small text-muted">Club owner: {club.owner?.name || "Admin-managed / unassigned"} {club.owner?.email ? `· ${club.owner.email}` : ""}</div>{expandedClubId === club._id && <div className="border-top mt-3 pt-3">{!details[club._id] ? <span className="text-muted">Loading full dossier…</span> : <><div className="row g-3 mb-3"><div className="col-md-4"><h3 className="h6 fw-bold">Public contact</h3><div>{details[club._id].club.contactEmail || "—"}</div><div>{details[club._id].club.contactPhone || "—"}</div><div>{details[club._id].club.website || "—"}</div></div><div className="col-md-4"><h3 className="h6 fw-bold">Key members</h3>{details[club._id].club.keyMembers?.length ? details[club._id].club.keyMembers.map((member) => <div key={member._id}><strong>{member.name}</strong> · {member.role}{member.email ? <div className="small text-muted">{member.email}</div> : null}</div>) : <span className="text-muted">No key members</span>}</div><div className="col-md-4"><h3 className="h6 fw-bold">Coordinators</h3><div>Student: {details[club._id].club.studentCoordinator?.name || "Unassigned"}</div><div>Faculty: {details[club._id].club.facultyCoordinator?.name || "Unassigned"}</div></div></div><form className="row g-3 align-items-end border-top pt-3 mb-4" onSubmit={(event) => assignCoordinators(event, club._id)}><div className="col-md-4"><label className="form-label small fw-semibold" htmlFor={`faculty-assignment-${club._id}`}>Faculty coordinator</label><select className="form-select" id={`faculty-assignment-${club._id}`} name="facultyCoordinator" defaultValue={details[club._id].club.facultyCoordinator?._id || ""}><option value="">Unassigned</option>{coordinators.filter((person) => person.role === "faculty_coordinator").map((person) => <option key={person._id} value={person._id}>{person.name} · {person.email}</option>)}</select></div><div className="col-md-4"><label className="form-label small fw-semibold" htmlFor={`student-assignment-${club._id}`}>Student coordinator</label><select className="form-select" id={`student-assignment-${club._id}`} name="studentCoordinator" defaultValue={details[club._id].club.studentCoordinator?._id || ""}><option value="">Unassigned</option>{coordinators.filter((person) => person.role === "club_coordinator").map((person) => <option key={person._id} value={person._id}>{person.name} · {person.email}</option>)}</select></div><div className="col-md-4"><button className="btn btn-outline-primary w-100" type="submit" disabled={actionId === club._id}>{actionId === club._id ? "Saving…" : "Save coordinator assignments"}</button></div></form><h3 className="h6 fw-bold">Events ({details[club._id].events?.length || 0})</h3>{details[club._id].events?.length ? <div className="table-responsive"><table className="table table-sm"><thead><tr><th>Event</th><th>Date</th><th>Status</th><th>Registrations</th></tr></thead><tbody>{details[club._id].events.map((event) => <tr key={event._id}><td>{event.title}</td><td>{new Date(event.date).toLocaleString()}</td><td>{event.approvalStatus || "approved"} · {event.status}</td><td>{event.registeredCount || 0}</td></tr>)}</tbody></table></div> : <p className="text-muted">No events yet.</p>}<h3 className="h6 fw-bold mt-3">Members and requests ({details[club._id].memberships?.length || 0} shown)</h3>{details[club._id].memberships?.length ? details[club._id].memberships.map((membership) => <div className="small border-bottom py-1" key={membership._id}>{membership.student?.name || "Student"} · {membership.status} · {membership.student?.email || ""}</div>) : <p className="text-muted">No member requests yet.</p>}</>}</div>}</div><div className="d-flex flex-wrap gap-2 align-content-start"><button className="btn btn-outline-primary" type="button" onClick={() => toggleDetails(club._id)}>{expandedClubId === club._id ? "Hide dossier" : "View full dossier"}</button><button className="btn btn-outline-danger" type="button" disabled={actionId === club._id} onClick={() => scheduleDeletion(club)}>Schedule deletion</button></div></div></div></article>)}</div>)}

        {!loading && activeTab === "clubs" && (clubApplications.length === 0 ? <div className="card border-0 shadow-sm"><div className="card-body p-5 text-center"><h2 className="h5 fw-bold">No pending club applications</h2><p className="text-muted mb-0">New club submissions will appear here.</p></div></div> : <div className="d-flex flex-column gap-4">{clubApplications.map((club) => {
          const detail = details[club._id];
          return <article className="card border-0 shadow-sm" key={club._id}>
            <div className="card-body p-4 p-lg-5">
              <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
                <div><div className="d-flex flex-wrap gap-2 align-items-center mb-2"><span className="badge text-bg-warning">Pending approval</span><span className="badge text-bg-light">{club.category}</span>{club.department && <span className="badge text-bg-light">{club.department}</span>}</div><h2 className="h3 fw-bold mb-2">{club.name}</h2><p className="text-muted mb-2">{club.description}</p><div className="small text-muted">Submitted by {club.owner?.name || "Club representative"} · {club.owner?.email || "No account email"} · {new Date(club.createdAt).toLocaleString()}</div></div>
                <div className="d-flex flex-wrap align-content-start gap-2"><button className="btn btn-outline-primary" type="button" onClick={() => toggleDetails(club._id)}>{expandedClubId === club._id ? "Hide full dossier" : "Review full dossier"}</button><button className="btn btn-success" type="button" disabled={actionId === club._id} onClick={() => reviewClub(club, "approve")}>{actionId === club._id ? "Saving…" : "Approve club"}</button><button className="btn btn-outline-danger" type="button" disabled={actionId === club._id} onClick={() => reviewClub(club, "reject")}>Reject</button></div>
              </div>
              <div className="row g-3">
                <div className="col-md-4"><div className="p-3 bg-body-tertiary rounded-3 h-100"><small className="text-muted d-block">Public contact</small><div className="fw-semibold text-break">{club.contactEmail || "Not supplied"}</div><div>{club.contactPhone || "No phone supplied"}</div></div></div>
                <div className="col-md-4"><div className="p-3 bg-body-tertiary rounded-3 h-100"><small className="text-muted d-block">Key leadership</small>{(club.keyMembers || []).length ? club.keyMembers.map((member) => <div key={member._id || `${member.name}-${member.role}`}><span className="fw-semibold">{member.name}</span> <span className="text-muted">· {member.role}</span></div>) : <span className="text-muted">No key members listed</span>}</div></div>
                <div className="col-md-4"><div className="p-3 bg-body-tertiary rounded-3 h-100"><small className="text-muted d-block">Links</small>{club.website ? <div><a href={club.website} target="_blank" rel="noreferrer">Website</a></div> : <div className="text-muted">No website</div>}{club.instagram && <div className="text-break">{club.instagram}</div>}</div></div>
              </div>
              {expandedClubId === club._id && <div className="border-top mt-4 pt-4">
                {!detail ? <p className="text-muted">Loading full dossier…</p> : <>
                  <div className="row g-4 mb-4">
                    <div className="col-md-4"><h3 className="h6 fw-bold">Application contact</h3><div>{detail.club.owner?.name || "—"}</div><div className="text-muted small">{detail.club.owner?.email || "—"}</div><div className="text-muted small">{[detail.club.owner?.department, detail.club.owner?.year].filter(Boolean).join(" · ")}</div></div>
                    <div className="col-md-4"><h3 className="h6 fw-bold">Club contact</h3><div>{detail.club.contactEmail || "—"}</div><div>{detail.club.contactPhone || "—"}</div><div>{detail.club.website || "—"}</div></div>
                    <div className="col-md-4"><h3 className="h6 fw-bold">Application status</h3><div>Created: {new Date(detail.club.createdAt).toLocaleString()}</div><div>Updated: {new Date(detail.club.updatedAt).toLocaleString()}</div><div>Key members: {detail.club.keyMembers?.length || 0}</div></div>
                  </div>
                  <h3 className="h6 fw-bold">Key members</h3>
                  {detail.club.keyMembers?.length ? <div className="table-responsive mb-4"><table className="table table-sm align-middle"><thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Department</th></tr></thead><tbody>{detail.club.keyMembers.map((member) => <tr key={member._id}><td>{member.name}</td><td>{member.role}</td><td>{member.email || "—"}</td><td>{member.department || "—"}</td></tr>)}</tbody></table></div> : <p className="text-muted">No key members submitted.</p>}
                  <h3 className="h6 fw-bold">Existing events ({detail.events?.length || 0})</h3>
                  {detail.events?.length ? <div className="table-responsive mb-4"><table className="table table-sm align-middle"><thead><tr><th>Event</th><th>Date</th><th>Status</th><th>Registrations</th></tr></thead><tbody>{detail.events.map((event) => <tr key={event._id}><td>{event.title}</td><td>{new Date(event.date).toLocaleString()}</td><td>{event.approvalStatus || "approved"} · {event.status}</td><td>{event.registeredCount || 0}</td></tr>)}</tbody></table></div> : <p className="text-muted">No events have been created yet.</p>}
                  <h3 className="h6 fw-bold">Membership requests and members ({detail.memberships?.length || 0} shown)</h3>
                  {detail.memberships?.length ? <div className="table-responsive"><table className="table table-sm align-middle"><thead><tr><th>Name</th><th>Email</th><th>Department / Year</th><th>Membership status</th><th>Requested</th></tr></thead><tbody>{detail.memberships.map((membership) => <tr key={membership._id}><td>{membership.student?.name || "—"}</td><td>{membership.student?.email || "—"}</td><td>{[membership.student?.department, membership.student?.year].filter(Boolean).join(" · ")}</td><td>{membership.status}</td><td>{new Date(membership.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div> : <p className="text-muted">No members or membership requests yet.</p>}
                </>}
              </div>}
            </div>
          </article>;
        })}</div>)}

        {!loading && activeTab === "events" && (events.length === 0 ? <div className="card border-0 shadow-sm"><div className="card-body p-5 text-center"><h2 className="h5 fw-bold">No pending event proposals</h2><p className="text-muted mb-0">Events submitted by club managers and coordinators will appear here.</p></div></div> : <div className="d-flex flex-column gap-4">{events.map((event) => <article className="card border-0 shadow-sm" key={event._id}><div className="card-body p-4 p-lg-5"><div className="d-flex flex-column flex-lg-row justify-content-between gap-3"><div className="flex-grow-1"><span className="badge text-bg-warning mb-2">Needs approval</span><h2 className="h4 fw-bold mb-2">{event.title}</h2><p className="text-muted">{event.description}</p><div className="row g-3"><div className="col-md-4"><small className="text-muted d-block">Club</small><strong>{event.club?.name || "Club"}</strong><div className="small text-muted">{event.club?.department || "Other department"}</div></div><div className="col-md-4"><small className="text-muted d-block">Date & time</small><strong>{new Date(event.date).toLocaleString()}</strong><div className="small text-muted">Deadline: {new Date(event.registrationDeadline).toLocaleString()}</div></div><div className="col-md-4"><small className="text-muted d-block">Venue / map</small><strong>{event.venue}</strong>{event.locationUrl && <div><a href={event.locationUrl} target="_blank" rel="noreferrer">Open map</a></div>}</div></div><div className="small text-muted mt-3">Proposed by {event.organiserName || event.createdBy?.name || "Club organiser"} · {event.organiserEmail || event.createdBy?.email || "No contact email"} · Capacity {event.capacity}</div><div className="small text-muted">Category: {event.category} · Requested state: {event.status}</div></div><div className="d-flex align-content-start flex-wrap gap-2"><button className="btn btn-success" type="button" disabled={actionId === event._id} onClick={() => reviewEvent(event, "approve")}>{actionId === event._id ? "Saving…" : "Approve & publish"}</button><button className="btn btn-outline-danger" type="button" disabled={actionId === event._id} onClick={() => reviewEvent(event, "reject")}>Reject</button></div></div></div></article>)}</div>)}

        {!loading && activeTab === "deletions" && (deletionRequests.length === 0 ? <div className="card border-0 shadow-sm"><div className="card-body p-5 text-center"><h2 className="h5 fw-bold">No scheduled club deletions</h2><p className="text-muted mb-0">Deletion requests will appear here during their seven-day grace period.</p></div></div> : <div className="d-flex flex-column gap-3">{deletionRequests.map((club) => <article className="card border-0 shadow-sm" key={club._id}><div className="card-body p-4 d-flex flex-column flex-lg-row justify-content-between gap-3"><div><span className="badge text-bg-danger mb-2">Deletion scheduled</span><h2 className="h5 fw-bold">{club.name}</h2><p className="text-muted mb-2">{club.description}</p><div className="small">Requested by {club.owner?.name || "Club owner"} · {club.owner?.email || "—"}</div><div className="small text-danger">Permanent deletion: {club.deletionScheduledAt ? new Date(club.deletionScheduledAt).toLocaleString() : "Pending scheduled date"}</div>{club.deletionReason && <p className="small text-muted mt-2 mb-0">Reason: {club.deletionReason}</p>}</div><div><button className="btn btn-success" type="button" disabled={actionId === club._id} onClick={() => restoreClub(club)}>Cancel deletion / restore</button><button className="btn btn-outline-primary ms-2" type="button" onClick={() => toggleDetails(club._id)}>{expandedClubId === club._id ? "Hide dossier" : "View dossier"}</button></div>{expandedClubId === club._id && details[club._id] && <div className="w-100 mt-3"><h3 className="h6 fw-bold">Related events</h3>{details[club._id].events?.length ? details[club._id].events.map((event) => <div key={event._id} className="border-bottom py-2"><strong>{event.title}</strong><span className="text-muted ms-2">{new Date(event.date).toLocaleDateString()} · {event.status}</span></div>) : <p className="text-muted">No related events.</p>}</div>}</div></article>)}</div>)}
      </div></section>
    </div>
  );
};

export default AdminReview;
