import axios from "axios";
import { supabase } from "../lib/supabase";

const API_URL = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:5000/api";

// Helper: get a valid (auto-refreshed) session token
const getAuthHeaders = async () => {
  // getUser() triggers a silent token refresh if the access_token is expired
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  // After getUser(), getSession() will have the refreshed access_token
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const scanProfile = async (data: {
  name?: string;
  email?: string;
  username?: string;
}) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(`${API_URL}/scan`, data, { headers });
    return response.data;
  } catch (error) {
    console.error("Scan API error:", error);
    throw error;
  }
};

export const getScanHistory = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_URL}/history`, { headers });
    return response.data;
  } catch (error) {
    console.error("History API error:", error);
    throw error;
  }
};

export const getScanById = async (id: string) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_URL}/history/${id}`, { headers });
    return response.data;
  } catch (error) {
    console.error("Scan Detail API error:", error);
    throw error;
  }
};

export const deleteScan = async (id: string) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.delete(`${API_URL}/history/${id}`, { headers });
    return response.data;
  } catch (error) {
    console.error("Delete Scan error:", error);
    throw error;
  }
};