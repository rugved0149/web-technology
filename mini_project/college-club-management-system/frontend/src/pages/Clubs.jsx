import { useMemo, useState } from "react";
import ClubCard from "../components/ClubCard";
import SectionHeader from "../components/SectionHeader";
import { categories, clubs } from "../utils/mockData";

function Clubs() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filteredClubs = useMemo(() => {
    return clubs.filter((club) => {
      const matchesSearch =
        club.name.toLowerCase().includes(search.toLowerCase()) ||
        club.description.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        category === "All" || club.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  return (
    <div className="container py-5">
      <SectionHeader
        eyebrow="Clubs"
        title="Find your community"
        description="Explore student communities and discover where your interests fit."
      />

      <div className="row g-3 mb-5">
        <div className="col-lg-7">
          <input
            type="search"
            className="form-control form-control-lg"
            placeholder="Search clubs..."
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

      {filteredClubs.length > 0 ? (
        <div className="row g-4">
          {filteredClubs.map((club) => (
            <div className="col-md-6 col-lg-4" key={club.id}>
              <ClubCard club={club} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5">
          <h5>No clubs found</h5>
          <p className="text-secondary">
            Try changing your search or category.
          </p>
        </div>
      )}
    </div>
  );
}

export default Clubs;