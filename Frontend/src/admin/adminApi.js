import axios from "axios";

const AdminAPI = axios.create({ baseURL: `${import.meta.env.VITE_API_URL}/admin` });

AdminAPI.interceptors.request.use((req) => {
  const token = localStorage.getItem("adminToken");
  if (token) req.headers.Authorization = token;
  return req;
});

export default AdminAPI;
