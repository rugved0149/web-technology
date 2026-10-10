const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const API_BASE_URL = configuredBaseUrl.replace(/\/+$/, "");

const request = async (endpoint, options = {}) => {
  const headers = { ...(options.headers || {}) };
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (options.body && !isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  } catch {
    const error = new Error(`Cannot reach the API at ${API_BASE_URL}. Check the backend URL and server status.`);
    error.status = 0;
    throw error;
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : { message: await response.text().catch(() => "") };

  if (!response.ok) {
    const error = new Error(data.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const checkServer = () => request("/health");
export const registerUser = (userData) => request("/auth/register", { method: "POST", body: JSON.stringify(userData) });
export const loginUser = (credentials) => request("/auth/login", { method: "POST", body: JSON.stringify(credentials) });
export const getProfile = (token) => request("/auth/profile", { headers: { Authorization: `Bearer ${token}` } });
export const getClubs = () => request("/clubs");
export const getClubById = (id) => request(`/clubs/${id}`);
export const getEvents = () => request("/events");
export const getEventById = (id) => request(`/events/${id}`);
export const getAnnouncements = () => request("/announcements");
export const getMyMemberships = (token) => request("/memberships/my", { headers: { Authorization: `Bearer ${token}` } });
export const requestMembership = (token, clubId) => request("/memberships", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ clubId }) });
export const leaveClub = (token, membershipId) => request(`/memberships/${membershipId}/leave`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
export const getMyRegistrations = (token) => request("/registrations/my", { headers: { Authorization: `Bearer ${token}` } });
export const registerForEvent = (token, eventId) => request("/registrations", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ eventId }) });
export const cancelRegistration = (token, registrationId) => request(`/registrations/${registrationId}/cancel`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
export const getClubMemberships = (token, clubId) => request(`/memberships/club/${clubId}`, { headers: { Authorization: `Bearer ${token}` } });
export const updateMembershipStatus = (token, membershipId, status) => request(`/memberships/${membershipId}/status`, { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) });
export const verifyEmail = (email, otp) => request("/auth/verify-email", { method: "POST", body: JSON.stringify({ email, otp }) });
export const resendVerification = (email) => request("/auth/resend-verification", { method: "POST", body: JSON.stringify({ email }) });
export const requestPasswordReset = (email) => request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
export const resetPassword = (token, password) => request("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) });
export const createClub = (token, club) => request("/clubs", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(club) });
export const createEvent = (token, event) => request("/events", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(event) });
export const createAnnouncement = (token, announcement) => request("/announcements", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(announcement) });
export const getCoordinators = (token) => request("/users/coordinators", { headers: { Authorization: `Bearer ${token}` } });
export const getAdminOverview = (token) => request("/admin/overview", { headers: { Authorization: `Bearer ${token}` } });
export const submitEventFeedback = (token, feedback) => request("/feedback", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(feedback) });
export const updateEventFeedback = (token, feedbackId, feedback) => request(`/feedback/${feedbackId}`, { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(feedback) });
export const getMyFeedback = (token) => request("/feedback/my", { headers: { Authorization: `Bearer ${token}` } });
export const getEventFeedback = (token, eventId) => request(`/feedback/event/${eventId}`, { headers: { Authorization: `Bearer ${token}` } });

export const getMyClubs = (token) => request("/clubs/mine", { headers: { Authorization: `Bearer ${token}` } });
export const submitClubApplication = (token, club) => request("/clubs/applications", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(club) });
export const updateClub = (token, clubId, club) => request(`/clubs/${clubId}`, { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(club) });
export const getAdminClubApplications = (token) => request("/clubs/admin/applications", { headers: { Authorization: `Bearer ${token}` } });
export const getAdminClubDetails = (token, clubId) => request(`/clubs/admin/${clubId}/details`, { headers: { Authorization: `Bearer ${token}` } });
export const reviewClubApplication = (token, clubId, decision, note = "") => request(`/clubs/${clubId}/review`, { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ decision, note }) });
export const requestClubDeletion = (token, clubId, reason = "") => request(`/clubs/${clubId}/request-deletion`, { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ reason }) });
export const cancelClubDeletion = (token, clubId) => request(`/clubs/${clubId}/cancel-deletion`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
export const getPendingEvents = (token) => request("/events/admin/pending", { headers: { Authorization: `Bearer ${token}` } });
export const reviewEventProposal = (token, eventId, decision, note = "") => request(`/events/${eventId}/review`, { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ decision, note }) });
export const getEventRegistrations = (token, eventId) => request(`/registrations/event/${eventId}`, { headers: { Authorization: `Bearer ${token}` } });
export const updateAttendance = (token, registrationId, present) => request(`/registrations/${registrationId}/attendance`, { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ present }) });
export const getAttendanceLink = (token, eventId) => request(`/events/${eventId}/attendance-link`, { headers: { Authorization: `Bearer ${token}` } });
export const checkInWithCode = (token, eventId, code) => request("/registrations/check-in", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ eventId, code }) });

export const getMyEvents = (token) => request("/events/mine", { headers: { Authorization: `Bearer ${token}` } });

export const updateEvent = (token, eventId, event) => request(`/events/${eventId}`, { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(event) });
