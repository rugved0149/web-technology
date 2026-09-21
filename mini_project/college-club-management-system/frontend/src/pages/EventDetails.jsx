import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getEventById,
  getMyRegistrations,
  registerForEvent,
  cancelRegistration,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();

  const [event, setEvent] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getEventById(id);
        setEvent(data.event);

        if (isAuthenticated && user?.role === "student") {
          try {
            const registrationData = await getMyRegistrations(token);

            const currentRegistration =
              registrationData.registrations.find(
                (item) => item.event?._id === id
              );

            setRegistration(currentRegistration || null);
          } catch {
            setRegistration(null);
          }
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [id, token, user, isAuthenticated]);

  const handleRegister = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (user?.role !== "student") {
      setError("Only students can register for events.");
      return;
    }

    try {
      setRegistering(true);
      setError("");
      setMessage("");

      const data = await registerForEvent(token, id);

      setRegistration(data.registration);
      setMessage(data.message);
    } catch (error) {
      setError(error.message);
    } finally {
      setRegistering(false);
    }
  };

  const handleCancel = async () => {
    if (!registration?._id) {
      return;
    }

    try {
      setCancelling(true);
      setError("");
      setMessage("");

      const data = await cancelRegistration(
        token,
        registration._id
      );

      setRegistration(data.registration);
      setMessage(data.message);
    } catch (error) {
      setError(error.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" />
        <p className="text-muted mt-3">
          Loading event...
        </p>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          {error}
        </div>

        <Link
          to="/events"
          className="btn btn-outline-primary"
        >
          Back to Events
        </Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container py-5 text-center">
        <h3>Event not found</h3>

        <Link
          to="/events"
          className="btn btn-primary mt-3"
        >
          Back to Events
        </Link>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const deadline = new Date(event.registrationDeadline);

  const isRegistered =
    registration?.status === "registered";

  const canRegister =
    event.status === "registration_open" &&
    !isRegistered &&
    new Date() < deadline &&
    new Date() < eventDate;

  return (
    <div>
      <section className="page-header py-5">
        <div className="container">
          <Link
            to="/events"
            className="text-decoration-none d-inline-block mb-4"
          >
            ← Back to Events
          </Link>

          <div className="d-flex flex-column flex-md-row justify-content-between gap-4">
            <div>
              <span className="badge bg-primary-subtle text-primary mb-3">
                {event.category}
              </span>

              <h1 className="display-5 fw-bold mb-3">
                {event.title}
              </h1>

              <p className="lead text-muted mb-0">
                {event.description}
              </p>
            </div>

            <div className="d-flex align-items-start">
              {isRegistered ? (
                <div className="d-flex flex-column gap-2">
                  <button
                    className="btn btn-outline-success btn-lg"
                    disabled
                  >
                    Registered
                  </button>

                  <button
                    className="btn btn-outline-danger"
                    onClick={handleCancel}
                    disabled={cancelling}
                  >
                    {cancelling
                      ? "Cancelling..."
                      : "Cancel Registration"}
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleRegister}
                  disabled={
                    !canRegister || registering
                  }
                >
                  {registering
                    ? "Registering..."
                    : !isAuthenticated
                    ? "Login to Register"
                    : event.status !== "registration_open"
                    ? "Registration Closed"
                    : new Date() >= deadline
                    ? "Registration Closed"
                    : "Register Now"}
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
            <div className="col-md-7">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-4">
                    Event Information
                  </h5>

                  <div className="row g-3">
                    <div className="col-sm-6">
                      <div className="text-muted small">
                        Date
                      </div>
                      <div className="fw-semibold">
                        {eventDate.toLocaleDateString()}
                      </div>
                    </div>

                    <div className="col-sm-6">
                      <div className="text-muted small">
                        Time
                      </div>
                      <div className="fw-semibold">
                        {event.time}
                      </div>
                    </div>

                    <div className="col-sm-6">
                      <div className="text-muted small">
                        Venue
                      </div>
                      <div className="fw-semibold">
                        {event.venue}
                      </div>
                    </div>

                    <div className="col-sm-6">
                      <div className="text-muted small">
                        Capacity
                      </div>
                      <div className="fw-semibold">
                        {event.capacity}
                      </div>
                    </div>

                    <div className="col-sm-6">
                      <div className="text-muted small">
                        Registration Deadline
                      </div>
                      <div className="fw-semibold">
                        {deadline.toLocaleDateString()}
                      </div>
                    </div>

                    <div className="col-sm-6">
                      <div className="text-muted small">
                        Status
                      </div>
                      <div className="fw-semibold text-success text-capitalize">
                        {event.status.replaceAll("_", " ")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-5">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-4">
                    Organized By
                  </h5>

                  {event.club ? (
                    <>
                      <h4 className="fw-bold">
                        {event.club.name}
                      </h4>

                      <p className="text-muted mb-0">
                        {event.club.category}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted mb-0">
                      Club information unavailable.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EventDetails;