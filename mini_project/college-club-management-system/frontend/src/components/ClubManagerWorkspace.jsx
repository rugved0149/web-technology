import { useEffect, useState } from "react";
import { cancelClubDeletion, getMyClubs, getMyEvents, requestClubDeletion, submitClubApplication, updateClub } from "../services/api";

const emptyMember = { name: "", role: "", email: "", department: "" };
const emptyClubForm = (user) => ({
  name: "", description: "", category: "", department: user?.department || "",
  contactEmail: user?.email || "", contactPhone: "", website: "", instagram: "", logo: "",
  keyMembers: [{ ...emptyMember }],
});

const statusStyle = {
  active: "text-bg-success",
  pending_approval: "text-bg-warning",
  rejected: "text-bg-danger",
  deletion_pending: "text-bg-danger",
  inactive: "text-bg-secondary",
};

export default function ClubManagerWorkspace({ token, user }) {
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(() => emptyClubForm(user));
  const [editingId, setEditingId] = useState("");
  const [editingRejected, setEditingRejected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const refresh = async () => {
    const [clubData, eventData] = await Promise.all([getMyClubs(token), getMyEvents(token)]);
    setClubs(clubData.clubs || []);
    setEvents(eventData.events || []);
  };

  useEffect(() => {
    let mounted = true;
    Promise.all([getMyClubs(token), getMyEvents(token)])
      .then(([clubData, eventData]) => {
        if (mounted) {
          setClubs(clubData.clubs || []);
          setEvents(eventData.events || []);
        }
      })
      .catch((loadError) => { if (mounted) setError(loadError.message); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [token]);

  const setField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const setMemberField = (index, field, value) => {
    setForm((current) => ({ ...current, keyMembers: current.keyMembers.map((member, memberIndex) => memberIndex === index ? { ...member, [field]: value } : member) }));
  };

  const startEditing = (club) => {
    setEditingId(club._id);
    setEditingRejected(club.status === "rejected");
    setForm({
      name: club.name || "", description: club.description || "", category: club.category || "",
      department: club.department || "", contactEmail: club.contactEmail || user?.email || "",
      contactPhone: club.contactPhone || "", website: club.website || "", instagram: club.instagram || "", logo: club.logo || "",
      keyMembers: club.keyMembers?.length ? club.keyMembers.map((member) => ({ name: member.name || "", role: member.role || "", email: member.email || "", department: member.department || "" })) : [{ ...emptyMember }],
    });
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => { setEditingId(""); setEditingRejected(false); setForm(emptyClubForm(user)); };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true); setError(""); setMessage("");
    try {
      const payload = {
        ...form,
        name: form.name.trim(), description: form.description.trim(), category: form.category.trim(),
        department: form.department.trim(), contactEmail: form.contactEmail.trim(), contactPhone: form.contactPhone.trim(),
        website: form.website.trim(), instagram: form.instagram.trim(), logo: form.logo.trim(),
        keyMembers: form.keyMembers.filter((member) => member.name.trim() || member.role.trim()).map((member) => ({
          name: member.name.trim(), role: member.role.trim(), email: member.email.trim(), department: member.department.trim(),
        })),
      };
      const result = editingRejected
        ? await submitClubApplication(token, payload)
        : editingId
          ? await updateClub(token, editingId, payload)
          : await submitClubApplication(token, payload);
      setMessage(result.message || (editingRejected ? "Club application resubmitted." : editingId ? "Club profile saved." : "Club application submitted."));
      resetForm();
      await refresh();
    } catch (submitError) {
      setError(submitError.message);
    } finally { setSaving(false); }
  };

  const beginDeletion = async (club) => {
    const reason = window.prompt(`Schedule deletion for ${club.name}? The club will be hidden immediately and permanently deleted after 7 days. You can cancel during that period. Enter a reason (optional):`, "");
    if (reason === null) return;
    if (!window.confirm(`Final confirmation: hide ${club.name} now and schedule permanent deletion for 7 days from today?`)) return;
    setError(""); setMessage("");
    try {
      const result = await requestClubDeletion(token, club._id, reason);
      setMessage(result.message);
      await refresh();
    } catch (deleteError) { setError(deleteError.message); }
  };

  const undoDeletion = async (club) => {
    if (!window.confirm(`Cancel the deletion schedule for ${club.name} and restore it to the active clubs directory?`)) return;
    setError(""); setMessage("");
    try {
      const result = await cancelClubDeletion(token, club._id);
      setMessage(result.message);
      await refresh();
    } catch (cancelError) { setError(cancelError.message); }
  };

  const hasActiveClub = clubs.some((club) => ["active", "deletion_pending", "pending_approval"].includes(club.status));

  return (
    <section className="mt-4" aria-labelledby="club-manager-workspace-title">
      <div className="d-flex flex-column flex-md-row justify-content-between gap-3 align-items-md-end mb-4">
        <div>
          <span className="eyebrow text-primary">Club representative workspace</span>
          <h2 id="club-manager-workspace-title" className="h3 fw-bold mb-1">Manage your club</h2>
          <p className="text-muted mb-0">Submit a club for review, keep its public profile current and track the approval process.</p>
        </div>
        {editingId && <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>Cancel editing</button>}
      </div>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {message && <div className="alert alert-success" role="status">{message}</div>}

      {(!hasActiveClub || editingId) && (
        <form className="card border-0 shadow-sm mb-4" onSubmit={submit}>
          <div className="card-body p-4 p-lg-5">
            <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
              <div><h3 className="h5 fw-bold mb-1">{editingRejected ? "Revise rejected application" : editingId ? "Edit club profile" : clubs.some((club) => club.status === "rejected") ? "Revise and resubmit your club" : "Register a club"}</h3><p className="text-muted mb-0">An administrator reviews every new club before it appears publicly.</p></div>
              <span className="badge text-bg-light">{editingId ? "Profile settings" : "Application"}</span>
            </div>
            <div className="row g-3">
              <div className="col-md-6"><label className="form-label fw-semibold" htmlFor="application-name">Club name</label><input id="application-name" className="form-control" name="name" value={form.name} onChange={setField} maxLength={100} required /></div>
              <div className="col-md-6"><label className="form-label fw-semibold" htmlFor="application-category">Category / interest area</label><input id="application-category" className="form-control" name="category" value={form.category} onChange={setField} maxLength={80} placeholder="Technology, arts, sports…" required /></div>
              <div className="col-md-6"><label className="form-label fw-semibold" htmlFor="application-department">Department <span className="text-muted fw-normal">(leave blank for Other)</span></label><input id="application-department" className="form-control" name="department" value={form.department} onChange={setField} maxLength={100} placeholder="Computer Engineering" /></div>
              <div className="col-md-6"><label className="form-label fw-semibold" htmlFor="application-email">Public contact email</label><input id="application-email" type="email" className="form-control" name="contactEmail" value={form.contactEmail} onChange={setField} maxLength={254} required /></div>
              <div className="col-12"><label className="form-label fw-semibold" htmlFor="application-description">About the club</label><textarea id="application-description" className="form-control" name="description" rows="4" value={form.description} onChange={setField} maxLength={3000} required /><div className="form-text">Explain the purpose, activities and who can join.</div></div>
              <div className="col-md-6"><label className="form-label fw-semibold" htmlFor="application-phone">Contact phone</label><input id="application-phone" className="form-control" name="contactPhone" value={form.contactPhone} onChange={setField} maxLength={40} /></div>
              <div className="col-md-6"><label className="form-label fw-semibold" htmlFor="application-website">Website</label><input id="application-website" type="url" className="form-control" name="website" value={form.website} onChange={setField} placeholder="https://…" maxLength={300} /></div>
              <div className="col-md-6"><label className="form-label fw-semibold" htmlFor="application-instagram">Instagram / social link</label><input id="application-instagram" className="form-control" name="instagram" value={form.instagram} onChange={setField} placeholder="@clubname or profile URL" maxLength={200} /></div>
              <div className="col-md-6"><label className="form-label fw-semibold" htmlFor="application-logo">Logo URL</label><input id="application-logo" type="url" className="form-control" name="logo" value={form.logo} onChange={setField} placeholder="https://…" maxLength={500} /></div>
            </div>

            <div className="mt-4">
              <div className="d-flex justify-content-between gap-3 align-items-center mb-2"><div><h4 className="h6 fw-bold mb-1">Key members</h4><p className="small text-muted mb-0">List the people responsible for the club. Add at least one member.</p></div><button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setForm((current) => ({ ...current, keyMembers: [...current.keyMembers, { ...emptyMember }] }))} disabled={form.keyMembers.length >= 30}>Add member</button></div>
              {form.keyMembers.map((member, index) => <div className="row g-2 align-items-end border rounded-3 p-3 mb-2" key={index}>
                <div className="col-md-3"><label className="form-label small" htmlFor={`key-member-name-${index}`}>Name</label><input id={`key-member-name-${index}`} className="form-control" value={member.name} onChange={(event) => setMemberField(index, "name", event.target.value)} maxLength={100} required={index === 0} /></div>
                <div className="col-md-3"><label className="form-label small" htmlFor={`key-member-role-${index}`}>Role</label><input id={`key-member-role-${index}`} className="form-control" value={member.role} onChange={(event) => setMemberField(index, "role", event.target.value)} maxLength={80} required={index === 0} placeholder="President, Treasurer…" /></div>
                <div className="col-md-3"><label className="form-label small" htmlFor={`key-member-email-${index}`}>Email (optional)</label><input id={`key-member-email-${index}`} type="email" className="form-control" value={member.email} onChange={(event) => setMemberField(index, "email", event.target.value)} maxLength={254} /></div>
                <div className="col-md-2"><label className="form-label small" htmlFor={`key-member-dept-${index}`}>Department</label><input id={`key-member-dept-${index}`} className="form-control" value={member.department} onChange={(event) => setMemberField(index, "department", event.target.value)} maxLength={100} /></div>
                <div className="col-md-1"><button type="button" className="btn btn-outline-danger w-100" aria-label={`Remove member ${index + 1}`} disabled={form.keyMembers.length === 1} onClick={() => setForm((current) => ({ ...current, keyMembers: current.keyMembers.filter((_, memberIndex) => memberIndex !== index) }))}>×</button></div>
              </div>)}
            </div>
            <div className="d-flex flex-wrap gap-2 mt-4"><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Saving…" : editingRejected ? "Resubmit for approval" : editingId ? "Save club profile" : "Submit club for approval"}</button>{editingId && <button className="btn btn-outline-secondary" type="button" onClick={resetForm}>Cancel</button>}</div>
          </div>
        </form>
      )}

      <div className="d-flex justify-content-between align-items-end gap-3 mb-3"><div><h3 className="h5 fw-bold mb-1">Your applications and clubs</h3><p className="text-muted mb-0">New applications usually remain private until approved by an administrator.</p></div><button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => refresh().catch((refreshError) => setError(refreshError.message))}>Refresh</button></div>
      {loading ? <div className="py-4 text-center"><div className="spinner-border text-primary" /></div> : clubs.length === 0 ? <div className="card border-0 shadow-sm"><div className="card-body p-4"><p className="mb-0 text-muted">No club applications yet. Complete the form above to submit your first club.</p></div></div> : <div className="row g-3">
        {clubs.map((club) => <div className="col-12" key={club._id}><article className="card border-0 shadow-sm"><div className="card-body p-4"><div className="d-flex flex-column flex-lg-row justify-content-between gap-3"><div className="flex-grow-1"><div className="d-flex flex-wrap align-items-center gap-2 mb-2"><h4 className="h5 fw-bold mb-0">{club.name}</h4><span className={`badge ${statusStyle[club.status] || "text-bg-secondary"}`}>{club.status.replaceAll("_", " ")}</span></div><p className="text-muted mb-2">{club.description}</p><div className="small text-muted d-flex flex-wrap gap-3"><span>{club.category}</span><span>{club.department || "Other department"}</span><span>{club.keyMembers?.length || 0} key members</span></div>
          {club.status === "pending_approval" && <div className="alert alert-warning py-2 mt-3 mb-0">Awaiting administrator review. The club is not listed publicly yet.</div>}
          {club.status === "rejected" && <div className="alert alert-danger py-2 mt-3 mb-0">Review note: {club.rejectionReason || "No specific reason was supplied."} Revise the application and submit again.</div>}
          {club.status === "deletion_pending" && <div className="alert alert-danger py-2 mt-3 mb-0">Scheduled for permanent deletion on {club.deletionScheduledAt ? new Date(club.deletionScheduledAt).toLocaleString() : "the scheduled date"}. It is hidden from public browsing until cancelled.</div>}
          </div><div className="d-flex flex-wrap align-content-start gap-2">{club.status === "active" && <><button className="btn btn-outline-primary" type="button" onClick={() => startEditing(club)}>Edit profile</button><button className="btn btn-outline-danger" type="button" onClick={() => beginDeletion(club)}>Request deletion</button></>}{club.status === "deletion_pending" && <button className="btn btn-success" type="button" onClick={() => undoDeletion(club)}>Cancel deletion</button>}{club.status === "pending_approval" && <button className="btn btn-outline-secondary" type="button" onClick={() => window.alert("Your application will be reviewed by an administrator. You can refresh this page to check the status.")}>Check status</button>}{club.status === "rejected" && <button className="btn btn-outline-primary" type="button" onClick={() => startEditing(club)}>Edit & resubmit</button>}</div></div></div></article></div>)}
      </div>}

      <section className="mt-5" aria-labelledby="club-event-proposals-title">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-2 mb-3">
          <div>
            <h3 id="club-event-proposals-title" className="h5 fw-bold mb-1">Your event proposals</h3>
            <p className="text-muted mb-0">Events you submit stay private until an administrator approves them.</p>
          </div>
          <span className="badge text-bg-light">{events.length} total</span>
        </div>
        {events.length === 0 ? (
          <div className="card border-0 shadow-sm"><div className="card-body p-4 text-muted">No events have been submitted for your club yet. Approved clubs can propose events from the management workspace.</div></div>
        ) : (
          <div className="row g-3">
            {events.map((event) => {
              const approval = event.approvalStatus || "approved";
              const badgeClass = approval === "approved" ? "text-bg-success" : approval === "pending" ? "text-bg-warning" : "text-bg-danger";
              return <div className="col-12" key={event._id}>
                <article className="card border-0 shadow-sm"><div className="card-body p-4">
                  <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
                    <div className="flex-grow-1">
                      <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                        <h4 className="h6 fw-bold mb-0">{event.title}</h4>
                        <span className={`badge ${badgeClass}`}>{approval === "approved" ? "Approved" : approval === "pending" ? "Awaiting review" : "Rejected"}</span>
                        <span className="badge text-bg-light">{String(event.status || "").replaceAll("_", " ")}</span>
                      </div>
                      <div className="small text-muted d-flex flex-wrap gap-3 mb-2">
                        <span>{event.club?.name || "Club"}</span>
                        <span>{event.date ? new Date(event.date).toLocaleString() : "Date not set"}</span>
                        <span>{event.venue || "Venue not set"}</span>
                      </div>
                      {event.description && <p className="mb-2">{event.description}</p>}
                      {event.locationUrl && <a href={event.locationUrl} target="_blank" rel="noreferrer">Open venue map <span aria-hidden="true">↗</span></a>}
                      {approval === "pending" && <div className="alert alert-warning py-2 mt-3 mb-0">Your proposal is waiting for an administrator to approve it.</div>}
                      {approval === "rejected" && <div className="alert alert-danger py-2 mt-3 mb-0"><strong>Review note:</strong> {event.approvalNote || "No reason was supplied."} Update and resubmit the event from the management workspace.</div>}
                    </div>
                  </div>
                </div></article>
              </div>;
            })}
          </div>
        )}
      </section>
    </section>
  );
}
