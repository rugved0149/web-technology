import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SectionHeader from "../components/SectionHeader";
import { resendVerification, verifyEmail } from "../services/api";

const VerifyEmail = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("verification_email");

    if (!storedEmail) {
      navigate("/register");
      return;
    }

    setEmail(storedEmail);
  }, [navigate]);

  const handleResend = async () => {
    if (!email) return;
    try {
      setResending(true);
      setError("");
      setSuccess("");
      const data = await resendVerification(email);
      setOtp("");
      setSuccess(data.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!otp || otp.length !== 6) {
      setError("Enter the 6-digit verification code.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const data = await verifyEmail(email, otp);

      setSuccess(data.message);

      sessionStorage.removeItem("verification_email");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <section className="page-header py-5">
        <div className="container">
          <Link
            to="/register"
            className="text-decoration-none d-inline-block mb-4"
          >
            ← Back to Register
          </Link>

          <SectionHeader
            eyebrow="Email verification"
            title="Verify your email"
            text="Enter the verification code sent to your email address."
          />
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-5">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4 p-md-5">
                  {email && (
                    <div className="text-center mb-4">
                      <p className="text-muted mb-1">
                        Verification code sent to
                      </p>

                      <strong className="text-break">{email}</strong>
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label className="form-label fw-semibold">
                        Verification Code
                      </label>

                      <input
                        type="text"
                        className="form-control form-control-lg text-center"
                        value={otp}
                        onChange={(event) =>
                          setOtp(
                            event.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6)
                          )
                        }
                        placeholder="000000"
                        maxLength="6"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        required
                      />

                      <small className="text-muted">
                        Enter the 6-digit code from your email.
                      </small>
                    </div>

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

                    <button
                      type="submit"
                      className="btn btn-dark w-100"
                      disabled={loading || resending}
                    >
                      {loading ? "Verifying..." : "Verify Email"}
                    </button>
                  </form>

                  <div className="text-center mt-3">
                    <button
                      type="button"
                      className="btn btn-link text-decoration-none"
                      onClick={handleResend}
                      disabled={loading || resending || !email}
                    >
                      {resending ? "Requesting a new code..." : "Resend verification code"}
                    </button>
                  </div>

                  <div className="text-center mt-2">
                    <span className="text-muted">Already verified?</span>{" "}
                    <Link to="/login">Login</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default VerifyEmail;