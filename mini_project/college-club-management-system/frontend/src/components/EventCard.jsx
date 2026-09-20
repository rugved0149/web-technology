import { Link } from "react-router-dom";

function EventCard({ event }) {
  const seatsLeft = event.capacity - event.registered;

  return (
    <div className="card h-100 border-0 shadow-sm event-card">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <span className="badge text-bg-light">{event.category}</span>
          <span className="small text-secondary">{event.club}</span>
        </div>

        <h5 className="fw-bold">{event.title}</h5>

        <p className="text-secondary small">
          {event.description}
        </p>

        <div className="small mb-2">
          <strong>Date:</strong> {event.date}
        </div>

        <div className="small mb-2">
          <strong>Time:</strong> {event.time}
        </div>

        <div className="small mb-3">
          <strong>Venue:</strong> {event.venue}
        </div>

        <div className="d-flex justify-content-between align-items-center">
          <span className="small text-secondary">
            {seatsLeft} seats left
          </span>

          <Link
            to={`/events/${event.id}`}
            className="btn btn-dark btn-sm px-3"
          >
            View Event
          </Link>
        </div>
      </div>
    </div>
  );
}

export default EventCard;