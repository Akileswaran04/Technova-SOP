import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: { "Content-Type": "application/json" },
});

// Seller endpoints
export const createSeller = (data) => API.post("/sellers/", data);
export const getSellers = (params) => API.get("/sellers/", { params });
export const getSeller = (id) => API.get(`/sellers/${id}`);
export const updateSeller = (id, data) => API.put(`/sellers/${id}`, data);
export const deleteSeller = (id) => API.delete(`/sellers/${id}`);
export const verifySeller = (id, data) =>
  API.put(`/sellers/${id}/verify`, data);
export const getSellerStats = () => API.get("/sellers/stats/summary");

export default API;
