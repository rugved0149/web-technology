import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="container py-5 text-center">
      <div className="py-5">
        <div className="display-1 fw-bold">404</div>
        <h2 className="fw-bold">Page not found</h2>
        <p className="text-secondary mb-4">
          The page you're looking for doesn't exist.
        </p>
        <Link to="/" className="btn btn-dark">
          Return Home
        </Link>
      </div>
    </div>
  );
}

export default NotFound;