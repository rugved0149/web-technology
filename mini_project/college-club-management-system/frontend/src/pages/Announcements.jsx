import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SectionHeader from "../components/SectionHeader";
import { getAnnouncements } from "../services/api";

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getAnnouncements();
        setAnnouncements(data.announcements);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncements();
  }, []);

  return (
    <div>
      <section className="page-header py-5">
        <div className="container">
          <Link
            to="/"
            className="text-decoration-none d-inline-block mb-4"
          >
            ← Back to Home
          </Link>

          <SectionHeader
            eyebrow="Stay informed"
            title="Announcements"
            text="Stay updated with the latest news and important information from your college clubs."
          />
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" />
              <p className="text-muted mt-3 mb-0">
                Loading announcements...
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            announcements.length === 0 && (
              <div className="text-center py-5">
                <h5>No announcements available</h5>
                <p className="text-muted">
                  There are no published announcements at the moment.
                </p>
              </div>
            )}

          {!loading &&
            !error &&
            announcements.length > 0 && (
              <div className="row g-4">
                {announcements.map((announcement) => (
                  <div
                    className="col-md-6 col-lg-4"
                    key={announcement._id}
                  >
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body p-4">
                        <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                          <span
                            className={`badge ${
                              announcement.priority === "urgent"
                                ? "bg-danger"
                                : announcement.priority ===
                                  "important"
                                ? "bg-warning text-dark"
                                : "bg-primary-subtle text-primary"
                            }`}
                          >
                            {announcement.priority}
                          </span>

                          {announcement.club && (
                            <small className="text-muted text-end">
                              {announcement.club.name}
                            </small>
                          )}
                        </div>

                        <h5 className="fw-bold mb-3">
                          {announcement.title}
                        </h5>

                        <p className="text-muted mb-3">
                          {announcement.content}
                        </p>

                        <small className="text-muted">
                          {new Date(
                            announcement.createdAt
                          ).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </section>
    </div>
  );
};

export default Announcements;