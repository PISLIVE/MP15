import axios from "axios";
import { supabase } from "../lib/supabase";

const API_URL = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:5000/api";

const getAuthHeaders = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function createSharedReport(scanData: any, query: string) {
  try {
    const headers = await getAuthHeaders();
    const res = await axios.post(
      `${API_URL}/report/share`,
      { scanData, query },
      { headers }
    );
    return res.data;
  } catch (error: any) {
    console.error("createSharedReport error:", error);
    throw error;
  }
}

export async function fetchSharedReport(id: string) {
  try {
    const res = await axios.get(`${API_URL}/report/${id}`);
    return res.data;
  } catch (error: any) {
    console.error("fetchSharedReport error:", error);
    throw error;
  }
}
