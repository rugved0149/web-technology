import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ClubCard from "../components/ClubCard";
import EventCard from "../components/EventCard";
import SectionHeader from "../components/SectionHeader";
import {
  getAnnouncements,
  getClubs,
  getEvents,
} from "../services/api";

const Home = () => {
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        setError("");

        const [clubsData, eventsData, announcementsData] =
          await Promise.all([
            getClubs(),
            getEvents(),
            getAnnouncements(),
          ]);

        setClubs(clubsData.clubs);
        setEvents(eventsData.events);
        setAnnouncements(announcementsData.announcements);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  return (
    <div>
      <section className="hero-section py-5">
        <div className="container py-5">
          <div className="row align-items-center">
            <div className="col-lg-7">
              <span className="badge bg-primary-subtle text-primary mb-3">
                CAMPUS COMMUNITY
              </span>

              <h1 className="display-3 fw-bold mb-4">
                Connect. Participate. Belong.
              </h1>

              <p className="lead text-muted mb-4">
                Discover college clubs, join communities, explore
                events and stay connected with everything happening
                on campus.
              </p>

              <div className="d-flex flex-wrap gap-3">
                <Link
                  to="/clubs"
                  className="btn btn-primary btn-lg px-4"
                >
                  Explore Clubs
                </Link>

                <Link
                  to="/events"
                  className="btn btn-outline-primary btn-lg px-4"
                >
                  Browse Events
                </Link>
              </div>
            </div>

            <div className="col-lg-5 mt-5 mt-lg-0">
              <div className="hero-panel p-4 rounded-4 shadow-sm">
                <div className="row g-3 text-center">
                  <div className="col-6">
                    <div className="display-6 fw-bold">
                      {loading ? "—" : clubs.length}
                    </div>
                    <div className="text-muted">
                      Active Clubs
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="display-6 fw-bold">
                      {loading ? "—" : events.length}
                    </div>
                    <div className="text-muted">
                      Events
                    </div>
                  </div>

                  <div className="col-12">
                    <hr />
                    <div className="text-muted small">
                      Your campus community, organized in one place.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <SectionHeader
            eyebrow="Discover"
            title="Featured Clubs"
            text="Find a community that matches your interests."
          />

          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" />
            </div>
          )}

          {!loading && error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          {!loading && !error && clubs.length === 0 && (
            <div className="text-center py-4 text-muted">
              No clubs are currently available.
            </div>
          )}

          {!loading && !error && clubs.length > 0 && (
            <div className="row g-4">
              {clubs.slice(0, 3).map((club) => (
                <div
                  className="col-md-6 col-lg-4"
                  key={club._id}
                >
                  <ClubCard club={club} />
                </div>
              ))}
            </div>
          )}

          {!loading && clubs.length > 3 && (
            <div className="text-center mt-4">
              <Link
                to="/clubs"
                className="btn btn-outline-primary"
              >
                View All Clubs
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="py-5 bg-light">
        <div className="container">
          <SectionHeader
            eyebrow="What's happening"
            title="Upcoming Events"
            text="Stay updated with events happening across campus."
          />

          {!loading && !error && events.length === 0 && (
            <div className="text-center py-4 text-muted">
              No events are currently available.
            </div>
          )}

          {!loading && !error && events.length > 0 && (
            <div className="row g-4">
              {events.slice(0, 3).map((event) => (
                <div
                  className="col-md-6 col-lg-4"
                  key={event._id}
                >
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          )}

          {!loading && events.length > 3 && (
            <div className="text-center mt-4">
              <Link
                to="/events"
                className="btn btn-outline-primary"
              >
                View All Events
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <SectionHeader
            eyebrow="Stay informed"
            title="Latest Announcements"
            text="Important updates from clubs and campus administration."
          />

          {!loading &&
            !error &&
            announcements.length === 0 && (
              <div className="text-center py-4 text-muted">
                No announcements available.
              </div>
            )}

          {!loading &&
            !error &&
            announcements.length > 0 && (
              <div className="row g-4">
                {announcements.slice(0, 3).map((announcement) => (
                  <div
                    className="col-md-4"
                    key={announcement._id}
                  >
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body p-4">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <span className="badge bg-primary-subtle text-primary">
                            {announcement.priority}
                          </span>

                          {announcement.club && (
                            <small className="text-muted">
                              {announcement.club.name}
                            </small>
                          )}
                        </div>

                        <h5 className="fw-bold">
                          {announcement.title}
                        </h5>

                        <p className="text-muted mb-0">
                          {announcement.content}
                        </p>
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

export default Home;