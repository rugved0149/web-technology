import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import SectionHeader from "../components/SectionHeader";
import { resetPassword } from "../services/api";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (token) window.history.replaceState(window.history.state, "", window.location.pathname);
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!token) {
      setError("This reset link is missing its token. Request a new password reset link.");
      return;
    }
    if (password.length < 8 || password.length > 128) {
      setError("Your new password must contain 8–128 characters.");
      return;
    }
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate("/login", { replace: true }), 1800);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="page-header py-5">
        <div className="container">
          <SectionHeader eyebrow="Account recovery" title="Choose a new password" text="Use a password you haven't used for this account before." />
        </div>
      </section>
      <section className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-7 col-lg-5">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4 p-md-5">
                  {done ? (
                    <div className="alert alert-success" role="status">Password updated. Redirecting you to sign in…</div>
                  ) : (
                    <form onSubmit={handleSubmit}>
                      {error && <div className="alert alert-danger" role="alert">{error}</div>}
                      <div className="mb-3">
                        <label className="form-label fw-semibold" htmlFor="new-password">New password</label>
                        <input id="new-password" type="password" className="form-control form-control-lg" autoComplete="new-password" minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} required />
                        <div className="form-text">Use 8–128 characters.</div>
                      </div>
                      <div className="mb-4">
                        <label className="form-label fw-semibold" htmlFor="confirm-password">Confirm new password</label>
                        <input id="confirm-password" type="password" className="form-control form-control-lg" autoComplete="new-password" minLength={8} maxLength={128} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
                      </div>
                      <button type="submit" className="btn btn-primary w-100" disabled={loading || !token}>
                        {loading ? "Updating password…" : "Reset password"}
                      </button>
                    </form>
                  )}
                  {!token && !done && <div className="alert alert-warning mt-3">No reset token was found. <Link to="/forgot-password">Request another link</Link>.</div>}
                  <p className="text-center text-muted mt-4 mb-0"><Link to="/login">Back to sign in</Link></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ResetPassword;
