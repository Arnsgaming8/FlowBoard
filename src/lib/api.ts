const API_URL = "https://flowboard-api-kary.onrender.com/api/auth";

async function request(path: string, body?: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export async function register(email: string, password: string) {
  return request("/register", { email, password });
}

export async function login(email: string, password: string) {
  return request("/login", { email, password });
}

export async function recover(email: string) {
  return request("/recover", { email });
}

export async function resetPassword(token: string, password: string) {
  return request("/reset", { token, password });
}

export async function getMe(token: string) {
  const res = await fetch(`${API_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}
