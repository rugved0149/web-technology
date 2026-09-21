const API_BASE_URL = "http://localhost:5000/api";
const request = async (endpoint, options = {}) => {
  const headers = {
    ...(options.headers || {}),
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "Something went wrong");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};
export const checkServer = async () => {
  return request("/health");
};

export const registerUser = async (userData) => {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
};

export const loginUser = async (credentials) => {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
};

export const getProfile = async (token) => {
  return request("/auth/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getClubs = async () => {
  return request("/clubs");
};

export const getClubById = async (id) => {
  return request(`/clubs/${id}`);
};

export const getEvents = async () => {
  return request("/events");
};

export const getEventById = async (id) => {
  return request(`/events/${id}`);
};

export const getAnnouncements = async () => {
  return request("/announcements");
};
export const getMyMemberships = async (token) => {
  return request("/memberships/my", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const requestMembership = async (token, clubId) => {
  return request("/memberships", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ clubId }),
  });
};

export const leaveClub = async (token, membershipId) => {
  return request(`/memberships/${membershipId}/leave`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
export const getMyRegistrations = async (token) => {
  return request("/registrations/my", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const registerForEvent = async (token, eventId) => {
  return request("/registrations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ eventId }),
  });
};

export const cancelRegistration = async (
  token,
  registrationId
) => {
  return request(`/registrations/${registrationId}/cancel`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};