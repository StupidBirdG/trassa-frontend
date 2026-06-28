const BASE_URL = typeof window !== "undefined" && window.location.hostname !== "localhost" ? "/api" : (import.meta.env.VITE_API_URL || "http://localhost:3001/api");
const TOKEN_KEY = "trassa_token";
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY)
};

async function request(path, options = {}) {
  const token = tokenStore.get();
  const res = await fetch(BASE_URL + path, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {})
    },
    ...options,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || "HTTP " + res.status);
    err.code = data.code;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const auth = {
  sendCode: (phone) => request("/auth/send-code", { method: "POST", body: { phone } }),
  verify: (phone, code) => request("/auth/verify", { method: "POST", body: { phone, code } }),
  register: (phone, code, name, role, company_name) => request("/auth/register", { method: "POST", body: { phone, code, name, role, company_name } }),
  me: () => request("/auth/me"),
  deleteAccount: () => request("/auth/account", { method: "DELETE" })
};

export const subscription = {
  status: () => request("/auth/subscription/status"),
  activate: () => request("/auth/subscription/activate", { method: "POST" })
};

export const cargos = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request("/cargos" + (qs ? "?" + qs : ""));
  },
  create: (body) => request("/cargos", { method: "POST", body }),
  cancel: (id) => request("/cargos/" + id, { method: "DELETE" }),
  bid: (id, body) => request("/cargos/" + id + "/bids", { method: "POST", body }),
  accept: (id, bidId) => request("/cargos/" + id + "/accept/" + bidId, { method: "POST" }),
  deliver: (id) => request("/cargos/" + id + "/deliver", { method: "POST" }),
  ping: (id, delta = 5) => request("/cargos/" + id + "/ping", { method: "POST", body: { progress_delta: delta } }),
  events: (id) => request("/cargos/" + id + "/events")
};
