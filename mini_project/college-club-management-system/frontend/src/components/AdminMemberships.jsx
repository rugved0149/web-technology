import { useEffect, useState } from "react";
import {
  getClubs,
  getMyClubs,
  getClubMemberships,
  updateMembershipStatus,
} from "../services/api";

const AdminMemberships = ({ token, user }) => {
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState("");
  const [memberships, setMemberships] = useState([]);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadClubs = async () => {
      try {
        setLoadingClubs(true);
        setError("");

        const data = user?.role === "club_manager" ? await getMyClubs(token) : await getClubs();
        const currentUserId = String(user?._id || user?.id || "");
        const activeClubs = (data.clubs || []).filter((club) => {
          if (club.status !== "active") return false;
          if (user?.role === "admin") return true;
          if (user?.role === "club_manager") {
            return String(club.owner?._id || club.owner || "") === currentUserId;
          }
          if (user?.role === "club_coordinator") {
            return String(club.studentCoordinator?._id || club.studentCoordinator || "") === currentUserId;
          }
          if (user?.role === "faculty_coordinator") {
            return String(club.facultyCoordinator?._id || club.facultyCoordinator || "") === currentUserId;
          }
          return false;
        });

        setClubs(activeClubs);
        setSelectedClub(activeClubs[0]?._id || "");
      } catch (error) {
        setError(error.message);
      } finally {
        setLoadingClubs(false);
      }
    };

    loadClubs();
  }, [user?._id, user?.id, user?.role, token]);

  useEffect(() => {
    const loadMemberships = async () => {
      if (!selectedClub) {
        setMemberships([]);
        return;
      }

      try {
        setLoadingMembers(true);
        setError("");

        const data = await getClubMemberships(token, selectedClub);
        setMemberships(data.memberships || []);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoadingMembers(false);
      }
    };

    loadMemberships();
  }, [selectedClub, token]);

  const handleStatusChange = async (membershipId, status) => {
    try {
      setUpdatingId(membershipId);
      setError("");

      await updateMembershipStatus(token, membershipId, status);

      const data = await getClubMemberships(token, selectedClub);
      setMemberships(data.memberships || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setUpdatingId("");
    }
  };

  const pendingMemberships = memberships.filter(
    (membership) => membership.status === "pending"
  );

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
          <div>
            <h4 className="fw-bold mb-1">Membership Requests</h4>
            <p className="text-muted mb-0">
              {user?.role === "admin" ? "Review requests across all active clubs." : "Review requests for clubs assigned to your account."}
            </p>
          </div>

          <div style={{ minWidth: "240px" }}>
            <label className="form-label fw-semibold">
              Select Club
            </label>

            <select
              className="form-select"
              value={selectedClub}
              onChange={(event) => setSelectedClub(event.target.value)}
              disabled={loadingClubs}
            >
              {loadingClubs && <option>Loading clubs...</option>}

              {!loadingClubs && clubs.length === 0 && (
                <option value="">No clubs available</option>
              )}

              {!loadingClubs &&
                clubs.map((club) => (
                  <option key={club._id} value={club._id}>
                    {club.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        {loadingMembers && (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" />
            <p className="text-muted mt-3 mb-0">
              Loading membership requests...
            </p>
          </div>
        )}

        {!loadingMembers && !error && memberships.length === 0 && (
          <div className="text-center py-5">
            <h6 className="fw-bold">No membership records</h6>
            <p className="text-muted mb-0">
              This club does not have any membership requests yet.
            </p>
          </div>
        )}

        {!loadingMembers && !error && memberships.length > 0 && (
          <>
            <div className="d-flex gap-2 mb-4">
              <span className="badge bg-warning text-dark">
                Pending: {pendingMemberships.length}
              </span>

              <span className="badge bg-success">
                Active:{" "}
                {memberships.filter(
                  (membership) => membership.status === "active"
                ).length}
              </span>
            </div>

            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Year</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {memberships.map((membership) => (
                    <tr key={membership._id}>
                      <td className="fw-semibold">
                        {membership.student?.name || "Unknown"}
                      </td>

                      <td>
                        {membership.student?.email || "—"}
                      </td>

                      <td>
                        {membership.student?.department || "—"}
                      </td>

                      <td>
                        {membership.student?.year || "—"}
                      </td>

                      <td>
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
                      </td>

                      <td className="text-end">
                        {membership.status === "pending" ? (
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              className="btn btn-sm btn-success"
                              disabled={updatingId === membership._id}
                              onClick={() =>
                                handleStatusChange(
                                  membership._id,
                                  "approved"
                                )
                              }
                            >
                              {updatingId === membership._id
                                ? "Updating..."
                                : "Approve"}
                            </button>

                            <button
                              className="btn btn-sm btn-outline-danger"
                              disabled={updatingId === membership._id}
                              onClick={() =>
                                handleStatusChange(
                                  membership._id,
                                  "rejected"
                                )
                              }
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted small">
                            No action
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminMemberships;