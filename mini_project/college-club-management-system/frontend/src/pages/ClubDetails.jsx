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
              {canJoin ? (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleJoin}
                  disabled={joining}
                >
                  {joining ? "Requesting..." : getMembershipText()}
                </button>
              ) : (
                <button
                  className="btn btn-outline-secondary btn-lg"
                  disabled
                >
                  {getMembershipText()}
                </button>
              )}
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
        </div>
      </section>
    </div>
  );
};

export default ClubDetails;