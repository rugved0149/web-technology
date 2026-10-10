import { Link } from "react-router-dom";

const ClubCard = ({ club }) => {
  return (
    <div className="card h-100 border-0 shadow-sm club-card">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <span className="badge bg-primary-subtle text-primary">
            {club.category}
          </span>

          <span className="badge bg-success-subtle text-success">Approved</span>
        </div>

        <h4 className="fw-bold mb-2">{club.name}</h4>

        <p className="small text-primary fw-semibold mb-2">{club.department || "Other department"}</p>
        <p className="text-muted mb-4">{club.description}</p>
        {club.keyMembers?.length > 0 && <p className="small text-muted mb-3">{club.keyMembers.length} listed key {club.keyMembers.length === 1 ? "member" : "members"}</p>}

        <Link
          to={`/clubs/${club._id}`}
          className="btn btn-outline-primary w-100"
        >
          View Club
        </Link>
      </div>
    </div>
  );
};

export default ClubCard;