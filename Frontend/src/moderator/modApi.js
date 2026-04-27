import axios from "axios";

const ModAPI = axios.create({ baseURL: `${import.meta.env.VITE_API_URL}/admin` });

ModAPI.interceptors.request.use((req) => {
  const token = localStorage.getItem("modToken");
  if (token) req.headers.Authorization = token;
  return req;
});

export default ModAPI;
