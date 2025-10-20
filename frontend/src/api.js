import axios from "axios";

const API_BASE = "http://localhost:4000/api";

export const loginAPI = (data) => axios.post(`${API_BASE}/auth/login`, data);

export const getSubjects = (token) =>
  axios.get(`${API_BASE}/admin/subjects`, { headers: { Authorization: `Bearer ${token}` } });

export const getProfessors = (token) =>
  axios.get(`${API_BASE}/admin/professors`, { headers: { Authorization: `Bearer ${token}` } });

export const submitSurvey = (token, payload) =>
  axios.post(`${API_BASE}/survey/submit`, payload, { headers: { Authorization: `Bearer ${token}` } });

export const getStats = (token, subjectId) =>
  axios.get(`${API_BASE}/admin/stats/${subjectId}`, { headers: { Authorization: `Bearer ${token}` } });

export const exportResults = (token) =>
  axios.get(`${API_BASE}/survey/export`, { responseType: "blob", headers: { Authorization: `Bearer ${token}` } });

export const getAllResults = (token) =>
  axios.get(`${API_BASE}/survey/results`, { headers: { Authorization: `Bearer ${token}` } });
