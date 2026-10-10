import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getEventById,
  getMyRegistrations,
  getMyFeedback,
  submitEventFeedback,
  updateEventFeedback,
  registerForEvent,
  cancelRegistration,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { downloadEventCalendar, getEventStart } from "../utils/calendar";

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();

  const [event, setEvent] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState("5");
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
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
        const loadedEvent = data.event;
        setEvent(loadedEvent);
        setRegistration(null);
        setFeedback(null);
        setFeedbackRating("5");
        setFeedbackComment("");

        if (isAuthenticated && user?.role === "student") {
          try {
            const registrationData = await getMyRegistrations(token);
            const currentRegistration = registrationData.registrations.find(
              (item) => item.event?._id === id
            );
            setRegistration(currentRegistration || null);
          } catch {
            setRegistration(null);
          }

          if (getEventStart(loadedEvent) <= new Date()) {
            try {
              const feedbackData = await getMyFeedback(token);
              const currentFeedback = (feedbackData.feedback || []).find(
                (item) => item.event?._id === id
              );
              if (currentFeedback) {
                setFeedback(currentFeedback);
                setFeedbackRating(String(currentFeedback.rating));
                setFeedbackComment(currentFeedback.comment || "");
              }
            } catch {
              setFeedback(null);
            }
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


  const handleFeedbackSubmit = async (event) => {
    event.preventDefault();
    try {
      setSubmittingFeedback(true);
      setError("");
      setMessage("");
      const payload = { rating: Number(feedbackRating), comment: feedbackComment.trim() };
      const data = feedback
        ? await updateEventFeedback(token, feedback._id, payload)
        : await submitEventFeedback(token, { eventId: id, ...payload });
      setFeedback(data.feedback);
      setFeedbackRating(String(data.feedback.rating));
      setFeedbackComment(data.feedback.comment || "");
      setMessage(data.message || "Your feedback has been saved.");
    } catch (feedbackError) {
      setError(feedbackError.message);
    } finally {
      setSubmittingFeedback(false);
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

  const eventDate = getEventStart(event);
  const deadline = new Date(event.registrationDeadline);

  const isRegistered = registration?.status === "registered";
  const isWaitlisted = registration?.status === "waitlisted";
  const hasActiveRegistration = isRegistered || isWaitlisted;

  const canRegister =
    event.status === "registration_open" &&
    !hasActiveRegistration &&
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
              {hasActiveRegistration ? (
                <div className="d-flex flex-column gap-2">
                  <button className={`btn ${isWaitlisted ? "btn-outline-warning" : "btn-outline-success"} btn-lg`} disabled>
                    {isWaitlisted ? "On waitlist" : "Registered"}
                  </button>
                  {isWaitlisted && <small className="text-muted">You will be promoted automatically if a place opens.</small>}

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
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                    <h5 className="fw-bold mb-0">Event Information</h5>
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => {
                      try { downloadEventCalendar(event); } catch (calendarError) { setError(calendarError.message); }
                    }}>
                      Add to calendar (.ics)
                    </button>
                  </div>

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
                      <div className="text-muted small">Capacity</div>
                      <div className="fw-semibold">{event.capacity}</div>
                    </div>
                    {event.locationUrl && <div className="col-sm-6">
                      <div className="text-muted small">Venue directions</div>
                      <a className="fw-semibold" href={event.locationUrl} target="_blank" rel="noreferrer">Open map / location ↗</a>
                    </div>}

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
                      <h4 className="fw-bold">{event.club.name}</h4>
                      <p className="text-muted">{event.club.category}{event.club.department ? ` · ${event.club.department}` : ""}</p>
                      {event.club.contactEmail && <p className="mb-2"><strong>Club contact:</strong> <a href={`mailto:${event.club.contactEmail}`}>{event.club.contactEmail}</a></p>}
                      {event.club.contactPhone && <p className="mb-2"><strong>Phone:</strong> <a href={`tel:${event.club.contactPhone}`}>{event.club.contactPhone}</a></p>}
                      <Link className="btn btn-sm btn-outline-primary mt-2" to={`/clubs/${event.club._id}`}>View club profile</Link>
                    </>
                  ) : <p className="text-muted mb-0">Club information unavailable.</p>}
                  <hr className="my-4" />
                  <h5 className="fw-bold mb-3">Event organiser</h5>
                  <div className="fw-semibold">{event.organiserName || event.createdBy?.name || "Club organiser"}</div>
                  {(event.organiserEmail || event.createdBy?.email) && <div><a href={`mailto:${event.organiserEmail || event.createdBy?.email}`}>{event.organiserEmail || event.createdBy?.email}</a></div>}
                  {event.organiserPhone && <div><a href={`tel:${event.organiserPhone}`}>{event.organiserPhone}</a></div>}
                </div>
              </div>
            </div>
          </div>

          {isAuthenticated && user?.role === "student" && registration?.status === "registered" && eventDate <= new Date() && (
            <div className="card border-0 shadow-sm mt-4">
              <div className="card-body p-4 p-lg-5">
                <div className="d-flex flex-column flex-md-row justify-content-between gap-2 mb-4">
                  <div>
                    <span className="text-uppercase small fw-bold text-primary">Your experience</span>
                    <h4 className="fw-bold mb-1">Event feedback</h4>
                    <p className="text-muted mb-0">Tell the organizers what worked and what could be better.</p>
                  </div>
                  {feedback && <span className="badge text-bg-success align-self-md-start">Review submitted</span>}
                </div>
                <form onSubmit={handleFeedbackSubmit}>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold" htmlFor="feedback-rating">Your rating</label>
                      <select id="feedback-rating" className="form-select" value={feedbackRating} onChange={(event) => setFeedbackRating(event.target.value)} required>
                        <option value="5">5 — Excellent</option>
                        <option value="4">4 — Very good</option>
                        <option value="3">3 — Good</option>
                        <option value="2">2 — Needs improvement</option>
                        <option value="1">1 — Poor</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold" htmlFor="feedback-comment">Comments</label>
                      <textarea id="feedback-comment" className="form-control" rows="4" maxLength={2000} value={feedbackComment} onChange={(event) => setFeedbackComment(event.target.value)} placeholder="Share what you liked and what could be improved…" required />
                      <div className="form-text">{feedbackComment.length}/2,000 characters</div>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary mt-3" disabled={submittingFeedback || !feedbackComment.trim()}>
                    {submittingFeedback ? "Saving feedback…" : feedback ? "Update feedback" : "Submit feedback"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default EventDetails;