import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navClass = ({ isActive }) => `nav-link${isActive ? " active" : ""}`;

function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const closeMenu = () => setMenuOpen(false);
  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/");
  };

  return (
    <nav className="navbar navbar-expand-lg site-navbar sticky-top">
      <div className="container py-2">
        <Link className="navbar-brand brand-lockup" to="/" onClick={closeMenu}>
          <span className="brand-mark" aria-hidden="true">C</span>
          <span>ClubSphere<span className="brand-period">.</span><small>Campus communities</small></span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          aria-label="Toggle navigation"
          aria-controls="mainNav"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className={`collapse navbar-collapse${menuOpen ? " show" : ""}`} id="mainNav">
          <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-1">
            <li className="nav-item"><NavLink end className={navClass} to="/" onClick={closeMenu}>Home</NavLink></li>
            <li className="nav-item"><NavLink className={navClass} to="/clubs" onClick={closeMenu}>Clubs</NavLink></li>
            <li className="nav-item"><NavLink className={navClass} to="/events" onClick={closeMenu}>Events</NavLink></li>
            <li className="nav-item"><NavLink className={navClass} to="/announcements" onClick={closeMenu}>Announcements</NavLink></li>
            <li className="nav-item"><NavLink className={navClass} to="/about" onClick={closeMenu}>About</NavLink></li>
            {user ? (
              <>
                <li className="nav-item"><NavLink className={navClass} to="/dashboard" onClick={closeMenu}>Dashboard</NavLink></li>
                {user.role === "club_manager" && <li className="nav-item"><NavLink className={navClass} to="/manage-club" onClick={closeMenu}>Manage club</NavLink></li>}
                {user.role === "admin" && <li className="nav-item"><NavLink className={navClass} to="/admin/review" onClick={closeMenu}>Review queue</NavLink></li>}
                <li className="nav-item ms-lg-2 d-flex align-items-center gap-2 account-actions">
                  <span className="user-chip" title={user.email}>{user.name?.split(" ")[0] || "Account"}</span>
                  <button className="btn btn-outline-secondary btn-sm px-3" onClick={handleLogout}>Sign out</button>
                </li>
              </>
            ) : (
              <li className="nav-item ms-lg-2 account-actions">
                <Link className="btn btn-primary px-4" to="/login" onClick={closeMenu}>Sign in</Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
