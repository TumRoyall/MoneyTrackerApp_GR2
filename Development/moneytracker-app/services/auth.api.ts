import api from "./axios";

// Login
export const loginApi = (data: { email: string; password: string }) =>
  api.post("/api/auth/login", data);

// Register
export const registerApi = (data: {
  email: string;
  password: string;
  fullname: string;
}) => api.post("/api/auth/register", data);

// Check email
export const checkEmailApi = (email: string) =>
  api.get("/api/auth/check-email", { params: { email } });
