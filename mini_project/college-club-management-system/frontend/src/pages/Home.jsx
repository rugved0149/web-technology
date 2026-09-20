import { Link } from "react-router-dom";
import ClubCard from "../components/ClubCard";
import EventCard from "../components/EventCard";
import SectionHeader from "../components/SectionHeader";
import { announcements, clubs, events } from "../utils/mockData";

function Home() {
  return (
    <>
      <section className="hero-section">
        <div className="container py-5">
          <div className="row align-items-center min-vh-75 g-5">
            <div className="col-lg-7">
              <span className="badge rounded-pill text-bg-light mb-4 px-3 py-2">
                College Community Platform
              </span>

              <h1 className="display-3 fw-bold mb-4">
                Discover your community.
                <br />
                <span className="text-secondary">Build something together.</span>
              </h1>

              <p className="lead text-secondary mb-4">
                Explore college clubs, discover upcoming events, connect with
                students and take part in the activities that interest you.
              </p>

              <div className="d-flex flex-wrap gap-3">
                <Link to="/clubs" className="btn btn-dark btn-lg px-4">
                  Explore Clubs
                </Link>

                <Link to="/events" className="btn btn-outline-dark btn-lg px-4">
                  View Events
                </Link>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="hero-panel shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <span className="fw-semibold">Campus Activity</span>
                  <span className="badge text-bg-success">Live</span>
                </div>

                <div className="activity-row">
                  <div>
                    <strong>24</strong>
                    <span>Active Clubs</span>
                  </div>

                  <div>
                    <strong>68</strong>
                    <span>Upcoming Events</span>
                  </div>
                </div>

                <div className="activity-row">
                  <div>
                    <strong>2.4K</strong>
                    <span>Student Members</span>
                  </div>

                  <div>
                    <strong>146</strong>
                    <span>Activities</span>
                  </div>
                </div>

                <div className="activity-note">
                  Find something that matches your interests and get involved.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-5">
        <SectionHeader
          eyebrow="Explore"
          title="Find your club"
          description="Discover communities built around technology, culture, sports, creativity and more."
        />

        <div className="row g-4">
          {clubs.slice(0, 3).map((club) => (
            <div className="col-md-6 col-lg-4" key={club.id}>
              <ClubCard club={club} />
            </div>
          ))}
        </div>

        <div className="text-center mt-4">
          <Link to="/clubs" className="btn btn-outline-dark px-4">
            View all clubs
          </Link>
        </div>
      </section>

      <section className="bg-white border-top border-bottom">
        <div className="container py-5">
          <SectionHeader
            eyebrow="What's happening"
            title="Upcoming events"
            description="Participate in workshops, competitions, cultural programs and student activities."
          />

          <div className="row g-4">
            {events.slice(0, 3).map((event) => (
              <div className="col-md-6 col-lg-4" key={event.id}>
                <EventCard event={event} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-5">
        <SectionHeader
          eyebrow="Latest"
          title="Announcements"
          description="Stay updated with the latest club and campus activity announcements."
        />

        <div className="list-group shadow-sm">
          {announcements.map((announcement) => (
            <div
              className="list-group-item p-4 d-flex justify-content-between align-items-center flex-wrap gap-3"
              key={announcement.id}
            >
              <div>
                <h6 className="fw-semibold mb-1">{announcement.title}</h6>
                <span className="text-secondary small">
                  {announcement.club}
                </span>
              </div>

              <span className="text-secondary small">
                {announcement.date}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export default Home;