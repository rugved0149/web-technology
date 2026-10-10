import { useState } from "react";
import { Link } from "react-router-dom";
import SectionHeader from "../components/SectionHeader";
import { requestPasswordReset } from "../services/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const result = await requestPasswordReset(email.trim());
      setMessage(result.message || "If your verified account exists, a reset link will be sent shortly.");
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
          <SectionHeader eyebrow="Account recovery" title="Forgot your password?" text="We'll email a secure, time-limited link to reset it." />
        </div>
      </section>
      <section className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-7 col-lg-5">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4 p-md-5">
                  {error && <div className="alert alert-danger" role="alert">{error}</div>}
                  {message && <div className="alert alert-success" role="status">{message}</div>}
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label className="form-label fw-semibold" htmlFor="reset-email">Email address</label>
                      <input id="reset-email" type="email" className="form-control form-control-lg" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} />
                    </div>
                    <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                      {loading ? "Sending link…" : "Send reset link"}
                    </button>
                  </form>
                  <p className="text-center text-muted mt-4 mb-0"><Link to="/login">Back to sign in</Link></p>
                  <p className="small text-muted mt-3 mb-0">For privacy, the confirmation does not disclose whether an email address is registered.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ForgotPassword;
