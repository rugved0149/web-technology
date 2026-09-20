const API_URL = "http://localhost:5000/api";

export async function checkServer() {
  const response = await fetch(`${API_URL}/health`);

  if (!response.ok) {
    throw new Error("Unable to connect to server");
  }

  return response.json();
}