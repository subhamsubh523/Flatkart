import axios from "axios";

const AdminAPI = axios.create({ baseURL: "http://localhost:5000/api/admin" });

AdminAPI.interceptors.request.use((req) => {
  const token = localStorage.getItem("adminToken");
  if (token) req.headers.Authorization = token;
  return req;
});

export default AdminAPI;
