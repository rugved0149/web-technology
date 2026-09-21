import { useEffect, useMemo, useState } from "react";
import EventCard from "../components/EventCard";
import SectionHeader from "../components/SectionHeader";
import { getEvents } from "../services/api";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getEvents();
        setEvents(data.events);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const categories = useMemo(() => {
    return [
      "All",
      ...new Set(events.map((event) => event.category)),
    ];
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(search.toLowerCase()) ||
        event.description.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        category === "All" || event.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [events, search, category]);

  return (
    <div>
      <section className="page-header py-5">
        <div className="container">
          <SectionHeader
            eyebrow="What's happening"
            title="Upcoming Events"
            text="Discover events, workshops and activities happening across your campus clubs."
          />

          <div className="row g-3 mt-3">
            <div className="col-md-8">
              <input
                type="text"
                className="form-control form-control-lg"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="col-md-4">
              <select
                className="form-select form-select-lg"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" />
              <p className="text-muted mt-3 mb-0">
                Loading events...
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          {!loading && !error && filteredEvents.length === 0 && (
            <div className="text-center py-5">
              <h5>No events found</h5>
              <p className="text-muted">
                Try changing your search or category.
              </p>
            </div>
          )}

          {!loading && !error && filteredEvents.length > 0 && (
            <div className="row g-4">
              {filteredEvents.map((event) => (
                <div className="col-md-6 col-lg-4" key={event._id}>
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Events;