import axios from "axios";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const loginApi = (email: string, password: string) =>
  api.post("/api/auth/login", { email, password });

export const registerApi = (
  email: string,
  password: string,
  fullname: string
) => {
  console.log("REGISTER payload:", { email, password, fullname });
  return api.post("/api/auth/register", {
    email,
    password,
    fullname,
  });
};


export const checkEmailApi = async (email: string): Promise<boolean> => {
  try {
    const res = await api.get("/api/auth/check-email", {
      params: { email },
    });
    return !res.data.exists;
  } catch (err: any) {
    if (err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }
    throw new Error("Không thể kiểm tra email");
  }
};
