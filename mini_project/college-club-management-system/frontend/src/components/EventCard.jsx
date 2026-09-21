import { Link } from "react-router-dom";

const EventCard = ({ event }) => {
  const eventDate = new Date(event.date);

  return (
    <div className="card h-100 border-0 shadow-sm event-card">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <span className="badge bg-primary-subtle text-primary">
            {event.category}
          </span>

          <span className="badge bg-success-subtle text-success">
            {event.status.replaceAll("_", " ")}
          </span>
        </div>

        <h4 className="fw-bold mb-2">{event.title}</h4>

        <p className="text-muted mb-3">
          {event.description}
        </p>

        <div className="small text-muted mb-3">
          <div className="mb-1">
            <strong>Date:</strong>{" "}
            {eventDate.toLocaleDateString()}
          </div>

          <div className="mb-1">
            <strong>Time:</strong> {event.time}
          </div>

          <div className="mb-1">
            <strong>Venue:</strong> {event.venue}
          </div>

          {event.club && (
            <div>
              <strong>Club:</strong> {event.club.name}
            </div>
          )}
        </div>

        <Link
          to={`/events/${event._id}`}
          className="btn btn-outline-primary w-100"
        >
          View Event
        </Link>
      </div>
    </div>
  );
};

export default EventCard;