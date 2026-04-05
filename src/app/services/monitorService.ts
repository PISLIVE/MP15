import axios from "axios";
import { supabase } from "../lib/supabase";

// Must match scannerService.ts — VITE_API_URL already ends with /api
const API_URL = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:5000/api";

const getAuthHeaders = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function getWatchlist() {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${API_URL}/monitor`, { headers });
    return res.data;
  } catch (error: any) {
    console.error("getWatchlist error:", error);
    throw error;
  }
}

export async function addToWatchlist(email: string) {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.post(`${API_URL}/monitor`, { email }, { headers });
    return res.data;
  } catch (error: any) {
    console.error("addToWatchlist error:", error);
    throw error;
  }
}

export async function removeFromWatchlist(id: string) {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.delete(`${API_URL}/monitor/${id}`, { headers });
    return res.data;
  } catch (error: any) {
    console.error("removeFromWatchlist error:", error);
    throw error;
  }
}

export async function triggerCheckNow(id: string) {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.post(`${API_URL}/monitor/${id}/check`, {}, { headers });
    return res.data;
  } catch (error: any) {
    console.error("triggerCheckNow error:", error);
    throw error;
  }
}
