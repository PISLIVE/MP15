import axios from "axios";
import { supabase } from "../lib/supabase";

const API_URL = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:5000/api";

// Helper: get the current session token and return an axios config with it
const getAuthHeaders = async () => {
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