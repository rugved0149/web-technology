import { useMemo, useState } from "react";
import EventCard from "../components/EventCard";
import SectionHeader from "../components/SectionHeader";
import { events, categories } from "../utils/mockData";

function Events() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(search.toLowerCase()) ||
        event.club.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        category === "All" || event.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  return (
    <div className="container py-5">
      <SectionHeader
        eyebrow="Events"
        title="What's happening on campus"
        description="Discover upcoming workshops, competitions, performances and activities."
      />

      <div className="row g-3 mb-5">
        <div className="col-lg-7">
          <input
            type="search"
            className="form-control form-control-lg"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="col-lg-5">
          <select
            className="form-select form-select-lg"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "All categories" : item}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredEvents.length > 0 ? (
        <div className="row g-4">
          {filteredEvents.map((event) => (
            <div className="col-md-6 col-lg-4" key={event.id}>
              <EventCard event={event} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5">
          <h5>No events found</h5>
          <p className="text-secondary">
            Try another search or category.
          </p>
        </div>
      )}
    </div>
  );
}

export default Events;