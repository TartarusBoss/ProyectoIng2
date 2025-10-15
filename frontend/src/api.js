import axios from "axios";

const API_URL = "http://localhost:4000/api/survey";

export const sendSurvey = (data) => axios.post(API_URL, data);
export const getResults = () => axios.get(`${API_URL}/results`);
export const exportResults = () => axios.get(`${API_URL}/export`, { responseType: "blob" });
