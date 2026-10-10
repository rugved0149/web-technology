import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAdminOverview, getMyMemberships, getMyRegistrations, leaveClub } from "../services/api";
import AdminMemberships from "../components/AdminMemberships";
import ManagementWorkspace from "../components/ManagementWorkspace";
const Dashboard = () => {
  const { user, token } = useAuth();

  const [memberships, setMemberships] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [leavingId, setLeavingId] = useState("");
  const [adminOverview, setAdminOverview] = useState(null);
  const [adminOverviewError, setAdminOverviewError] = useState("");
  useEffect(() => {
    const loadDashboard = async () => {
      if (!user || !token) {
        setLoading(false);
        return;
      }

      if (user.role === "admin") {
        try {
          setLoading(true);
          setAdminOverviewError("");
          const data = await getAdminOverview(token);
          setAdminOverview(data.overview);
        } catch (overviewError) {
          setAdminOverviewError(overviewError.message);
        } finally {
          setLoading(false);
        }
        return;
      }

      if (user.role !== "student") {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [membershipData, registrationData] = await Promise.all([
          getMyMemberships(token),
          getMyRegistrations(token),
        ]);

        setMemberships(membershipData.memberships || []);
        setRegistrations(registrationData.registrations || []);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user, token]);

  if (!user) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">
          Please log in to access the dashboard.
        </div>
      </div>
    );
  }

  const roleNames = {
    student: "Student",
    club_manager: "Club Representative",
    club_coordinator: "Club Coordinator",
    faculty_coordinator: "Faculty Coordinator",
    admin: "System Administrator",
  };

  const activeMemberships = memberships.filter(
    (membership) =>
      membership.status === "active" || membership.status === "approved"
  );

  const pendingMemberships = memberships.filter(
    (membership) => membership.status === "pending"
  );

  const activeRegistrations = registrations.filter(
    (registration) => registration.status === "registered" || registration.status === "waitlisted"
  );

  const handleLeaveClub = async (membershipId) => {
    const confirmed = window.confirm(
        "Are you sure you want to leave this club?"
    );

    if (!confirmed) {
        return;
    }

    try {
        setLeavingId(membershipId);
        setError("");

        await leaveClub(token, membershipId);

        const data = await getMyMemberships(token);
        setMemberships(data.memberships || []);
    } catch (error) {
        setError(error.message);
    } finally {
        setLeavingId("");
    }
    };

  return (
    <div>
      <section className="page-header py-5">
        <div className="container">
          <span className="text-primary fw-semibold">Dashboard</span>

          <h1 className="display-5 fw-bold mt-2 mb-2">
            Welcome, {user.name}
          </h1>

          <p className="text-muted mb-0">
            {roleNames[user.role] || user.role}
          </p>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          {user.role === "club_manager" && <div className="card border-0 shadow-sm mb-4"><div className="card-body p-4 d-flex flex-column flex-md-row justify-content-between gap-3 align-items-md-center"><div><h3 className="h5 fw-bold mb-1">Your club workspace</h3><p className="text-muted mb-0">Apply for club approval, manage leadership and contact details, and schedule deletion with a seven-day recovery window.</p></div><Link className="btn btn-primary" to="/manage-club">Manage club</Link></div></div>}
          {user.role === "admin" && adminOverviewError && <div className="alert alert-warning" role="alert">Unable to load system metrics: {adminOverviewError}</div>}
          <div className="row g-4 mb-5">
            <div className={user.role === "admin" ? "col-md-6 col-xl-4" : user.role === "student" ? "col-md-6 col-lg-3" : "col-md-6"}>
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <small className="text-muted">{user.role === "admin" ? "Verified Accounts" : "Role"}</small>
                  {user.role === "admin" ? (
                    <h2 className="fw-bold mt-2 mb-0">{adminOverview?.activeUsers ?? "—"}</h2>
                  ) : (
                    <h5 className="fw-bold mt-2 mb-0">{roleNames[user.role] || user.role}</h5>
                  )}
                </div>
              </div>
            </div>

            {(user.role === "student" || user.role === "admin") && <div className={user.role === "admin" ? "col-md-6 col-xl-4" : "col-md-6 col-lg-3"}>
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <small className="text-muted">Active Clubs</small>
                  <h2 className="fw-bold mt-2 mb-0">
                    {user.role === "student" ? activeMemberships.length : user.role === "admin" ? (adminOverview?.activeClubs ?? "—") : "—"}
                  </h2>
                </div>
              </div>
            </div>}

            {(user.role === "student" || user.role === "admin") && <div className={user.role === "admin" ? "col-md-6 col-xl-4" : "col-md-6 col-lg-3"}>
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <small className="text-muted">Pending Requests</small>
                  <h2 className="fw-bold mt-2 mb-0">
                    {user.role === "student" ? pendingMemberships.length : user.role === "admin" ? (adminOverview?.pendingMemberships ?? "—") : "—"}
                  </h2>
                </div>
              </div>
            </div>}

            {(user.role === "student" || user.role === "admin") && <div className={user.role === "admin" ? "col-md-6 col-xl-4" : "col-md-6 col-lg-3"}>
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <small className="text-muted">{user.role === "admin" ? "Upcoming Events" : "Event Registrations"}</small>
                  <h2 className="fw-bold mt-2 mb-0">
                    {user.role === "student" ? activeRegistrations.length : user.role === "admin" ? (adminOverview?.upcomingEvents ?? "—") : "—"}
                  </h2>
                </div>
              </div>
            </div>}
            {!(["student", "admin"].includes(user.role)) && <div className="col-md-6">
              <div className="card border-0 shadow-sm h-100"><div className="card-body p-4 d-flex flex-column justify-content-between gap-3"><div><small className="text-muted">Staff workspace</small><h2 className="h5 fw-bold mt-2 mb-1">Manage membership, events and attendance</h2><p className="text-muted mb-0">Review member requests, create event proposals, manage QR check-in and download attendance reports for clubs assigned to your account.</p></div><a className="btn btn-outline-primary align-self-start" href="#management-workspace-title">Open staff tools ↓</a></div></div>
            </div>}
            {user.role === "admin" && (
              <div className="col-md-6 col-xl-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body p-4">
                    <small className="text-muted">Active Registrations</small>
                    <h2 className="fw-bold mt-2 mb-0">{adminOverview?.activeRegistrations ?? "—"}</h2>
                  </div>
                </div>
              </div>
            )}
            {user.role === "admin" && (
              <>
                <div className="col-md-6 col-xl-4"><Link to="/admin/review" className="text-decoration-none"><div className="card border-0 shadow-sm h-100"><div className="card-body p-4"><small className="text-muted">Club Applications</small><h2 className="fw-bold mt-2 mb-1">{adminOverview?.pendingClubApplications ?? "—"}</h2><span className="small text-primary">Open review queue →</span></div></div></Link></div>
                <div className="col-md-6 col-xl-4"><Link to="/admin/review" className="text-decoration-none"><div className="card border-0 shadow-sm h-100"><div className="card-body p-4"><small className="text-muted">Event Proposals</small><h2 className="fw-bold mt-2 mb-1">{adminOverview?.pendingEventApprovals ?? "—"}</h2><span className="small text-primary">Review proposed events →</span></div></div></Link></div>
                <div className="col-md-6 col-xl-4"><Link to="/admin/review" className="text-decoration-none"><div className="card border-0 shadow-sm h-100"><div className="card-body p-4"><small className="text-muted">Deletion Grace Periods</small><h2 className="fw-bold mt-2 mb-1">{adminOverview?.scheduledDeletions ?? "—"}</h2><span className="small text-primary">Manage deletion requests →</span></div></div></Link></div>
              </>
            )}
          </div>

          {loading && user.role === "student" && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" />
              <p className="text-muted mt-3">
                Loading your dashboard...
              </p>
            </div>
          )}

          {!loading && error && user.role === "student" && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          {!loading && !error && user.role === "student" && (
            <>
              <div className="row g-4 mb-5">
                <div className="col-lg-6">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="fw-bold mb-0">My Clubs</h4>
                        <Link to="/clubs" className="btn btn-sm btn-outline-primary">
                          Browse Clubs
                        </Link>
                      </div>

                      {memberships.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-muted mb-3">
                            You haven't joined or requested any clubs yet.
                          </p>
                          <Link to="/clubs" className="btn btn-primary">
                            Explore Clubs
                          </Link>
                        </div>
                      ) : (
                        <div className="list-group list-group-flush">
                          {memberships.slice(0, 5).map((membership) => (
                            <div
                                key={membership._id}
                                className="list-group-item px-0 d-flex justify-content-between align-items-center gap-3"
                            >
                                <div>
                                <h6 className="fw-semibold mb-1">
                                    {membership.club?.name || "Club"}
                                </h6>

                                <small className="text-muted">
                                    {membership.club?.category || "General"}
                                </small>
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                <span
                                    className={`badge ${
                                    membership.status === "active"
                                        ? "bg-success"
                                        : membership.status === "pending"
                                        ? "bg-warning text-dark"
                                        : membership.status === "rejected"
                                        ? "bg-danger"
                                        : "bg-secondary"
                                    }`}
                                >
                                    {membership.status}
                                </span>

                                {membership.status === "active" && (
                                    <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleLeaveClub(membership._id)}
                                    disabled={leavingId === membership._id}
                                    >
                                    {leavingId === membership._id ? "Leaving..." : "Leave"}
                                    </button>
                                )}
                                </div>
                            </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-lg-6">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="fw-bold mb-0">My Events</h4>
                        <Link to="/events" className="btn btn-sm btn-outline-primary">
                          Browse Events
                        </Link>
                      </div>

                      {registrations.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-muted mb-3">
                            You haven't registered for any events yet.
                          </p>
                          <Link to="/events" className="btn btn-primary">
                            Explore Events
                          </Link>
                        </div>
                      ) : (
                        <div className="list-group list-group-flush">
                          {registrations.slice(0, 5).map((registration) => (
                            <div
                              key={registration._id}
                              className="list-group-item px-0 d-flex justify-content-between align-items-center"
                            >
                              <div>
                                <h6 className="fw-semibold mb-1">
                                  {registration.event?.title || "Event"}
                                </h6>
                                <small className="text-muted">
                                  {registration.event?.club?.name || "Club event"}
                                </small>
                              </div>

                              <span
                                className={`badge ${
                                  registration.status === "registered"
                                    ? "bg-success"
                                    : "bg-secondary"
                                }`}
                              >
                                {registration.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  <h4 className="fw-bold mb-3">Account Information</h4>

                  <div className="row g-3">
                    <div className="col-md-4">
                      <small className="text-muted d-block">Name</small>
                      <span className="fw-semibold">{user.name}</span>
                    </div>

                    <div className="col-md-4">
                      <small className="text-muted d-block">Email</small>
                      <span className="fw-semibold text-break">
                        {user.email}
                      </span>
                    </div>

                    <div className="col-md-4">
                      <small className="text-muted d-block">Account Status</small>
                      <span className="badge bg-success">Active</span>
                    </div>

                    {user.department && (
                      <div className="col-md-4">
                        <small className="text-muted d-block">Department</small>
                        <span className="fw-semibold">
                          {user.department}
                        </span>
                      </div>
                    )}

                    {user.year && (
                      <div className="col-md-4">
                        <small className="text-muted d-block">Year</small>
                        <span className="fw-semibold">{user.year}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {["admin", "club_manager", "club_coordinator", "faculty_coordinator"].includes(user.role) && (
            <>
              <div className="mt-4">
                <AdminMemberships token={token} user={user} />
              </div>
              <ManagementWorkspace token={token} user={user} />
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;