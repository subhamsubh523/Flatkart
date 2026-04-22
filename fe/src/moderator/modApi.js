import axios from "axios";

const ModAPI = axios.create({ baseURL: "http://localhost:5000/api/admin" });

ModAPI.interceptors.request.use((req) => {
  const token = localStorage.getItem("modToken");
  if (token) req.headers.Authorization = token;
  return req;
});

export default ModAPI;
