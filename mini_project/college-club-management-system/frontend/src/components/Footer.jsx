import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="site-footer mt-auto">
      <div className="container py-4 py-lg-5">
        <div className="row g-4 align-items-start">
          <div className="col-lg-6">
            <Link to="/" className="footer-brand">ClubSphere</Link>
            <p className="footer-copy mt-2 mb-0">
              One place to discover campus communities, manage memberships and take part in events.
            </p>
          </div>
          <div className="col-6 col-lg-3">
            <h2 className="footer-heading">Explore</h2>
            <Link to="/clubs">Clubs</Link>
            <Link to="/events">Events</Link>
            <Link to="/announcements">Announcements</Link>
          </div>
          <div className="col-6 col-lg-3">
            <h2 className="footer-heading">Your account</h2>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/about">About ClubSphere</Link>
          </div>
        </div>
        <div className="footer-bottom mt-4 pt-3">
          <span>© {new Date().getFullYear()} ClubSphere</span>
          <span>Built for a more connected campus.</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
