import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getClubById, getMyMemberships, requestMembership } from "../services/api";
import { useAuth } from "../context/AuthContext";

const ClubDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();

  const [club, setClub] = useState(null);
  const [membership, setMembership] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadClub = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getClubById(id);
        setClub(data.club);
        setEvents(data.events || []);

        if (isAuthenticated && user?.role === "student") {
          try {
            const membershipData = await getMyMemberships(token);

            const currentMembership = membershipData.memberships.find(
              (item) => item.club?._id === id
            );

            setMembership(currentMembership || null);
          } catch {
            setMembership(null);
          }
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadClub();
  }, [id, token, user, isAuthenticated]);

  const handleJoin = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (user?.role !== "student") {
      setError("Only students can request club membership.");
      return;
    }

    try {
      setJoining(true);
      setError("");
      setMessage("");

      const data = await requestMembership(token, id);

      setMembership(data.membership);
      setMessage(data.message);
    } catch (error) {
      setError(error.message);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" />
        <p className="text-muted mt-3">Loading club...</p>
      </div>
    );
  }

  if (error && !club) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error}</div>
        <Link to="/clubs" className="btn btn-outline-primary">
          Back to Clubs
        </Link>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="container py-5 text-center">
        <h3>Club not found</h3>
        <Link to="/clubs" className="btn btn-primary mt-3">
          Back to Clubs
        </Link>
      </div>
    );
  }

  const getMembershipText = () => {
    if (!membership) return "Join Club";

    if (membership.status === "pending") {
      return "Request Pending";
    }

    if (membership.status === "active") {
      return "Member";
    }

    if (membership.status === "rejected") {
      return "Request Again";
    }

    if (membership.status === "suspended") {
      return "Membership Suspended";
    }

    if (membership.status === "left") {
      return "Join Again";
    }

    return "Join Club";
  };

  const canJoin =
    !membership ||
    membership.status === "rejected" ||
    membership.status === "left";

  return (
    <div>
      <section className="page-header py-5">
        <div className="container">
          <Link
            to="/clubs"
            className="text-decoration-none d-inline-block mb-4"
          >
            ← Back to Clubs
          </Link>

          <div className="d-flex flex-column flex-md-row justify-content-between gap-4">
            <div>
              <span className="badge bg-primary-subtle text-primary mb-3">
                {club.category}
              </span>

              <h1 className="display-5 fw-bold mb-3">
                {club.name}
              </h1>

              <p className="lead text-muted mb-0">
                {club.description}
              </p>
            </div>

            <div className="d-flex align-items-start">
              {(!isAuthenticated || user?.role === "student") ? (canJoin ? (
                <button className="btn btn-primary btn-lg" onClick={handleJoin} disabled={joining}>
                  {joining ? "Requesting..." : getMembershipText()}
                </button>
              ) : <button className="btn btn-outline-secondary btn-lg" disabled>{getMembershipText()}</button>) : <span className="small text-muted">Club membership is available to student accounts.</span>}
            </div>
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          {message && (
            <div className="alert alert-success">
              {message}
            </div>
          )}

          <div className="row g-4">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <h5 className="fw-bold">Club Information</h5>

                  <div className="mt-4">
                    <p className="mb-2">
                      <strong>Category:</strong>{" "}
                      {club.category}
                    </p>

                    <p className="mb-2">
                      <strong>Status:</strong>{" "}
                      <span className="text-success">
                        {club.status}
                      </span>
                    </p>

                    {club.facultyCoordinator && (
                      <p className="mb-2">
                        <strong>Faculty Coordinator:</strong>{" "}
                        {club.facultyCoordinator.name}
                      </p>
                    )}

                    {club.studentCoordinator && (
                      <p className="mb-0">
                        <strong>Student Coordinator:</strong>{" "}
                        {club.studentCoordinator.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-8">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-3">
                    About the Club
                  </h5>

                  <p className="text-muted mb-0">
                    {club.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4 mt-1">
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <h3 className="h5 fw-bold mb-3">Contact & links</h3>
                  {club.contactEmail ? <p className="mb-2"><strong>Email:</strong> <a href={`mailto:${club.contactEmail}`}>{club.contactEmail}</a></p> : <p className="text-muted mb-2">No public contact email supplied.</p>}
                  {club.contactPhone && <p className="mb-2"><strong>Phone:</strong> <a href={`tel:${club.contactPhone}`}>{club.contactPhone}</a></p>}
                  {club.website && <p className="mb-2"><strong>Website:</strong> <a href={club.website} target="_blank" rel="noreferrer">Open website ↗</a></p>}
                  {club.instagram && <p className="mb-2"><strong>Social:</strong> <a href={club.instagram.startsWith("http") ? club.instagram : `https://instagram.com/${club.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer">{club.instagram} ↗</a></p>}
                  <p className="small text-muted mb-0">Department: {club.department || "Other"}</p>
                </div>
              </div>
            </div>
            <div className="col-lg-7">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <h3 className="h5 fw-bold mb-3">Club leadership</h3>
                  {club.keyMembers?.length ? <div className="row g-3">{club.keyMembers.map((member) => <div className="col-sm-6" key={member._id || `${member.name}-${member.role}`}><div className="border rounded-3 p-3 h-100"><div className="fw-semibold">{member.name}</div><div className="small text-primary">{member.role}</div>{member.department && <div className="small text-muted">{member.department}</div>}{member.email && <a className="small" href={`mailto:${member.email}`}>{member.email}</a>}</div></div>)}</div> : <p className="text-muted mb-0">Leadership details have not been published yet.</p>}
                  {(club.facultyCoordinator || club.studentCoordinator) && <div className="small text-muted mt-3">{club.facultyCoordinator && <div>Faculty coordinator: {club.facultyCoordinator.name} · <a href={`mailto:${club.facultyCoordinator.email}`}>{club.facultyCoordinator.email}</a></div>}{club.studentCoordinator && <div>Student coordinator: {club.studentCoordinator.name} · <a href={`mailto:${club.studentCoordinator.email}`}>{club.studentCoordinator.email}</a></div>}</div>}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="d-flex justify-content-between align-items-end gap-3 mb-3"><div><span className="eyebrow text-primary">What's happening</span><h2 className="h3 fw-bold mb-0">Events by {club.name}</h2></div><span className="badge text-bg-light">{events.length} listed</span></div>
            {events.length === 0 ? <div className="card border-0 shadow-sm"><div className="card-body p-4"><p className="text-muted mb-0">This club has not published any events yet. Check back for upcoming activities.</p></div></div> : <div className="row g-3">{events.map((event) => <div className="col-md-6" key={event._id}><article className="card border-0 shadow-sm h-100"><div className="card-body p-4"><div className="d-flex justify-content-between gap-2 mb-2"><span className="badge text-bg-light">{event.category}</span><span className="small text-muted">{new Date(event.date).toLocaleDateString()}</span></div><h3 className="h5 fw-bold">{event.title}</h3><p className="text-muted">{event.description}</p><div className="small text-muted mb-3">{event.time} · {event.venue}</div><div className="d-flex flex-wrap gap-2">{event.locationUrl && <a className="btn btn-sm btn-outline-secondary" href={event.locationUrl} target="_blank" rel="noreferrer">Open location</a>}<Link className="btn btn-sm btn-outline-primary" to={`/events/${event._id}`}>Event details</Link></div></div></article></div>)}</div>}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ClubDetails;