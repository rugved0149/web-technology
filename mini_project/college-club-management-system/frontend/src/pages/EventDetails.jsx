import { Link, useParams } from "react-router-dom";
import { events } from "../utils/mockData";

function EventDetails() {
  const { id } = useParams();
  const event = events.find((item) => item.id === Number(id));

  if (!event) {
    return (
      <div className="container py-5 text-center">
        <h3>Event not found</h3>
        <p className="text-secondary">
          The event you're looking for does not exist.
        </p>
        <Link to="/events" className="btn btn-dark">
          Back to Events
        </Link>
      </div>
    );
  }

  const seatsLeft = event.capacity - event.registered;

  return (
    <div className="container py-5">
      <Link to="/events" className="text-dark small">
        ← Back to events
      </Link>

      <div className="row g-5 mt-1">
        <div className="col-lg-8">
          <span className="badge text-bg-light mb-3">
            {event.category}
          </span>

          <h1 className="display-5 fw-bold mb-3">{event.title}</h1>

          <p className="lead text-secondary">
            {event.description}
          </p>

          <hr className="my-4" />

          <h4 className="fw-bold mb-3">About this event</h4>

          <p className="text-secondary">
            Join fellow students for this activity organized by{" "}
            <strong>{event.club}</strong>. Event participation is subject to
            availability and registration requirements.
          </p>

          <div className="row g-3 mt-4">
            <div className="col-sm-6">
              <div className="detail-box">
                <span>Date</span>
                <strong>{event.date}</strong>
              </div>
            </div>

            <div className="col-sm-6">
              <div className="detail-box">
                <span>Time</span>
                <strong>{event.time}</strong>
              </div>
            </div>

            <div className="col-sm-6">
              <div className="detail-box">
                <span>Venue</span>
                <strong>{event.venue}</strong>
              </div>
            </div>

            <div className="col-sm-6">
              <div className="detail-box">
                <span>Organized by</span>
                <strong>{event.club}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">Registration</h5>

              <div className="d-flex justify-content-between mb-3">
                <span className="text-secondary">Capacity</span>
                <strong>{event.capacity}</strong>
              </div>

              <div className="d-flex justify-content-between mb-4">
                <span className="text-secondary">Seats available</span>
                <strong>{seatsLeft}</strong>
              </div>

              <Link
                to="/login"
                className="btn btn-dark w-100 py-2"
              >
                Register for Event
              </Link>

              <p className="small text-secondary mt-3 mb-0 text-center">
                Login is required to register.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;