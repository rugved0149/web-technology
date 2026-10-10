import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { checkInWithCode } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function CheckIn() {
  const [params] = useSearchParams();
  const { user, token } = useAuth();
  const eventId = params.get("eventId") || "";
  const code = params.get("code") || "";
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    setLoading(true); setMessage(""); setError("");
    try {
      const result = await checkInWithCode(token, eventId, code);
      setMessage(result.message || "Check-in successful.");
    } catch (checkInError) { setError(checkInError.message); }
    finally { setLoading(false); }
  };

  return <section className="py-5"><div className="container"><div className="row justify-content-center"><div className="col-md-8 col-lg-6"><div className="card border-0 shadow-sm"><div className="card-body p-4 p-lg-5 text-center"><div className="display-5 mb-3" aria-hidden="true">✓</div><span className="eyebrow text-primary">ClubSphere attendance</span><h1 className="h2 fw-bold mt-2">Event check-in</h1><p className="text-muted">Confirm your attendance using the event QR code. You must be signed in with the account used to register.</p>{!eventId || !code ? <div className="alert alert-danger">This check-in link is incomplete. Scan the QR provided by the event organisers again.</div> : !user ? <div className="alert alert-warning">Sign in with the account you registered for the event with, then scan the event QR again.<div className="mt-3"><Link className="btn btn-primary" to="/login">Sign in</Link></div></div> : user.role !== "student" ? <div className="alert alert-info">Only student attendees can use this check-in link.</div> : <><div className="rounded-3 bg-body-tertiary p-3 mb-4 text-start"><div className="small text-muted">Signed in as</div><div className="fw-semibold">{user.name}</div><div className="small text-muted text-break">{user.email}</div></div>{error && <div className="alert alert-danger" role="alert">{error}</div>}{message && <div className="alert alert-success" role="status">{message}</div>}<button className="btn btn-primary btn-lg w-100" type="button" disabled={loading || Boolean(message)} onClick={submit}>{loading ? "Checking you in…" : message ? "Attendance confirmed" : "Confirm attendance"}</button><p className="small text-muted mt-3 mb-0">Check-in is available from one hour before the event until four hours after its start. Only active registrations can check in.</p></>}</div></div></div></div></div></section>;
}
