import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    loginType: "student",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
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
    setLoading(true);

    try {
      await login(formData);
      navigate("/");
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
          <div className="col-md-6 col-lg-5">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4 p-md-5">
                <h2 className="fw-bold mb-2">Welcome back</h2>
                <p className="text-muted mb-4">
                  Sign in to manage your clubs and events.
                </p>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="login-type">
                      Sign in as
                    </label>
                    <select
                      id="login-type"
                      name="loginType"
                      className="form-select"
                      value={formData.loginType}
                      onChange={handleChange}
                      required
                    >
                      <option value="student">Student</option>
                      <option value="club">Club / Coordinator</option>
                      <option value="admin">Administrator</option>
                    </select>
                    <div className="form-text">
                      Choose the role assigned to your account. This selection
                      does not change your account permissions.
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="login-email">Email</label>
                    <input
                      id="login-email"
                      type="email"
                      name="email"
                      className="form-control"
                      autoComplete="username"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label" htmlFor="login-password">Password</label>
                    <input
                      id="login-password"
                      type="password"
                      name="password"
                      className="form-control"
                      autoComplete="current-password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="text-end mb-4 mt-n2">
                    <Link to="/forgot-password" className="small text-decoration-none">Forgot password?</Link>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </button>
                </form>

                <p className="text-center text-muted mt-4 mb-0">
                  Don't have an account?{" "}
                  <Link to="/register">Create one</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
