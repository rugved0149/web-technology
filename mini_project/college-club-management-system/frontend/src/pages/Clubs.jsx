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
        club.description.toLowerCase().includes(search.toLowerCase()) ||
        (club.department || "Other").toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        category === "All" || club.category === category;

      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
      const departmentA = (a.department || "Other").trim() || "Other";
      const departmentB = (b.department || "Other").trim() || "Other";
      if (departmentA === "Other" && departmentB !== "Other") return 1;
      if (departmentB === "Other" && departmentA !== "Other") return -1;
      return departmentA.localeCompare(departmentB) || a.name.localeCompare(b.name);
    });
  }, [clubs, search, category]);

  const groupedClubs = useMemo(() => {
    const groups = new Map();
    filteredClubs.forEach((club) => {
      const key = (club.department || "").trim() || "Other";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(club);
    });
    return [...groups.entries()].sort(([a], [b]) => {
      if (a === "Other" && b !== "Other") return 1;
      if (b === "Other" && a !== "Other") return -1;
      return a.localeCompare(b);
    });
  }, [filteredClubs]);

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
            <div className="d-flex flex-column gap-5">
              {groupedClubs.map(([department, items]) => (
                <section key={department} aria-label={`${department} clubs`}>
                  <div className="d-flex align-items-center justify-content-between gap-3 border-bottom pb-2 mb-4">
                    <div><span className="text-uppercase small fw-bold text-primary">Department</span><h2 className="h4 fw-bold mb-0">{department === "Other" ? "Other clubs" : department}</h2></div>
                    <span className="badge text-bg-light">{items.length} {items.length === 1 ? "club" : "clubs"}</span>
                  </div>
                  <div className="row g-4">{items.map((club) => <div className="col-md-6 col-lg-4" key={club._id}><ClubCard club={club} /></div>)}</div>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Clubs;