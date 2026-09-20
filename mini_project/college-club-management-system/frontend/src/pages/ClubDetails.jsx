import { Link, useParams } from "react-router-dom";
import { clubs, events } from "../utils/mockData";

function ClubDetails() {
  const { id } = useParams();
  const club = clubs.find((item) => item.id === Number(id));

  if (!club) {
    return (
      <div className="container py-5 text-center">
        <h3>Club not found</h3>
        <p className="text-secondary">
          The club you're looking for does not exist.
        </p>
        <Link to="/clubs" className="btn btn-dark">
          Back to Clubs
        </Link>
      </div>
    );
  }

  const clubEvents = events.filter((event) => event.club === club.name);

  return (
    <div className="container py-5">
      <Link to="/clubs" className="text-dark small">
        ← Back to clubs
      </Link>

      <section className="club-detail-header mt-4">
        <div className={`club-detail-banner bg-${club.color}`}></div>

        <div className="p-4 p-lg-5">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
            <div>
              <span className="badge text-bg-light mb-3">
                {club.category}
              </span>

              <h1 className="fw-bold mb-3">{club.name}</h1>

              <p className="text-secondary mb-0">
                {club.description}
              </p>
            </div>

            <Link to="/login" className="btn btn-dark px-4">
              Join Club
            </Link>
          </div>

          <div className="row g-3 mt-4">
            <div className="col-sm-4">
              <div className="stat-box">
                <strong>{club.members}</strong>
                <span>Members</span>
              </div>
            </div>

            <div className="col-sm-4">
              <div className="stat-box">
                <strong>{club.events}</strong>
                <span>Events</span>
              </div>
            </div>

            <div className="col-sm-4">
              <div className="stat-box">
                <strong>Active</strong>
                <span>Club Status</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold mb-1">Upcoming Events</h3>
            <p className="text-secondary mb-0">
              Activities organized by this club.
            </p>
          </div>
        </div>

        {clubEvents.length > 0 ? (
          <div className="row g-4">
            {clubEvents.map((event) => (
              <div className="col-md-6 col-lg-4" key={event.id}>
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body p-4">
                    <span className="badge text-bg-light mb-3">
                      {event.category}
                    </span>

                    <h5 className="fw-bold">{event.title}</h5>

                    <p className="text-secondary small">
                      {event.description}
                    </p>

                    <div className="small mb-2">
                      <strong>Date:</strong> {event.date}
                    </div>

                    <div className="small mb-3">
                      <strong>Venue:</strong> {event.venue}
                    </div>

                    <Link
                      to={`/events/${event.id}`}
                      className="btn btn-outline-dark btn-sm"
                    >
                      View Event
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-light rounded-4 p-5 text-center">
            <h5>No upcoming events</h5>
            <p className="text-secondary mb-0">
              This club has no upcoming events at the moment.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

export default ClubDetails;