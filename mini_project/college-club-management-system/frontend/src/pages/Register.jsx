import { Link } from "react-router-dom";

function Register() {
  return (
    <div className="auth-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-7 col-lg-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4 p-lg-5">
                <div className="text-center mb-4">
                  <h2 className="fw-bold">Create your account</h2>
                  <p className="text-secondary mb-0">
                    Join the college club community.
                  </p>
                </div>

                <form>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Your name"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="you@example.com"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Department</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Computer Engineering"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Year</label>
                      <select className="form-select">
                        <option value="">Select year</option>
                        <option>First Year</option>
                        <option>Second Year</option>
                        <option>Third Year</option>
                        <option>Fourth Year</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Password</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Create a password"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Confirm Password</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Repeat your password"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-dark w-100 mt-4">
                    Create account
                  </button>
                </form>

                <p className="text-center text-secondary small mt-4 mb-0">
                  Already have an account?{" "}
                  <Link to="/login" className="text-dark fw-semibold">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;