import { useEffect, useMemo, useState } from "react";
import ClubCard from "../components/ClubCard";
import SectionHeader from "../components/SectionHeader";
import { getClubs } from "../services/api";

const Clubs = () => {
  const [clubs, setClubs] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadClubs = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getClubs();
        setClubs(data.clubs);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadClubs();
  }, []);

  const categories = useMemo(() => {
    return [
      "All",
      ...new Set(clubs.map((club) => club.category)),
    ];
  }, [clubs]);

  const filteredClubs = useMemo(() => {
    return clubs.filter((club) => {
      const matchesSearch =
        club.name.toLowerCase().includes(search.toLowerCase()) ||
        club.description.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        category === "All" || club.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [clubs, search, category]);

  return (
    <div>
      <section className="page-header py-5">
        <div className="container">
          <SectionHeader
            eyebrow="Discover"
            title="Explore Clubs"
            text="Find communities that match your interests and make your campus experience more engaging."
          />

          <div className="row g-3 mt-3">
            <div className="col-md-8">
              <input
                type="text"
                className="form-control form-control-lg"
                placeholder="Search clubs..."
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
                Loading clubs...
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          {!loading && !error && filteredClubs.length === 0 && (
            <div className="text-center py-5">
              <h5>No clubs found</h5>
              <p className="text-muted">
                Try changing your search or category.
              </p>
            </div>
          )}

          {!loading && !error && filteredClubs.length > 0 && (
            <div className="row g-4">
              {filteredClubs.map((club) => (
                <div className="col-md-6 col-lg-4" key={club._id}>
                  <ClubCard club={club} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Clubs;