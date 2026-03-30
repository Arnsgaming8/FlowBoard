const BASE_URL = "https://flowboard-api-kary.onrender.com/api";

async function authRequest(path: string, body?: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}/auth${path}`, {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export async function register(email: string, password: string) {
  return authRequest("/register", { email, password });
}

export async function login(email: string, password: string) {
  return authRequest("/login", { email, password });
}

export async function recover(email: string) {
  return authRequest("/recover", { email });
}

export async function resetPassword(token: string, password: string) {
  return authRequest("/reset", { token, password });
}

export async function getMe(token: string) {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export async function loadData(token: string) {
  const res = await fetch(`${BASE_URL}/data`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data.data;
}

export async function saveData(token: string, data: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}/data`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ data }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Request failed");
  return result;
}
