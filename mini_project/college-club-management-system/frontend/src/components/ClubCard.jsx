import { Link } from "react-router-dom";

function ClubCard({ club }) {
  return (
    <div className="card h-100 border-0 shadow-sm club-card">
      <div className={`club-banner bg-${club.color}`}></div>

      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <span className="badge text-bg-light">{club.category}</span>
          <span className="text-secondary small">{club.members} members</span>
        </div>

        <h5 className="fw-bold">{club.name}</h5>

        <p className="text-secondary small">
          {club.description}
        </p>

        <div className="d-flex gap-4 text-secondary small mb-4">
          <span>{club.events} events</span>
          <span>{club.coordinator}</span>
        </div>

        <Link
          to={`/clubs/${club.id}`}
          className="btn btn-outline-dark w-100"
        >
          View Club
        </Link>
      </div>
    </div>
  );
}

export default ClubCard;