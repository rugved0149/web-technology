import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    year: "",
    accountType: "student",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const data = await register(formData);

      sessionStorage.setItem(
        "verification_email",
        data.email || formData.email
      );

      setSuccess(
        "Registration successful. A verification code has been sent to your email."
      );

      setTimeout(() => {
        navigate("/verify-email");
      }, 1000);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-7 col-lg-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4 p-md-5">
                <h2 className="fw-bold mb-2">Create account</h2>
                <p className="text-muted mb-4">
                  Join your college clubs and events.
                </p>

                {error && (
                  <div className="alert alert-danger">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="alert alert-success">
                    {success}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="account-type">Account type</label>
                    <select id="account-type" name="accountType" className="form-select" value={formData.accountType} onChange={handleChange}>
                      <option value="student">Student — join clubs and register for events</option>
                      <option value="club_manager">Club representative — apply to manage a club</option>
                    </select>
                    <div className="form-text">Club representative accounts must submit a club application and wait for administrator approval before publishing events.</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      minLength="2"
                      maxLength="80"
                      autoComplete="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      name="password"
                      className="form-control"
                      value={formData.password}
                      onChange={handleChange}
                      minLength="8"
                      maxLength="128"
                      autoComplete="new-password"
                      required
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-7 mb-3">
                      <label className="form-label">Department</label>
                      <input
                        type="text"
                        name="department"
                        className="form-control"
                        value={formData.department}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-5 mb-4">
                      <label className="form-label">Year</label>
                      <input
                        type="text"
                        name="year"
                        className="form-control"
                        value={formData.year}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                  >
                    {loading
                      ? "Sending verification code..."
                      : "Create Account"}
                  </button>
                </form>

                <p className="text-center text-muted mt-4 mb-0">
                  Already have an account?{" "}
                  <Link to="/login">Sign in</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;