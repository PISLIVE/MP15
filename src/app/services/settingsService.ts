import { supabase } from "../lib/supabase";

const API_URL = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:5000/api";
const API_BASE_URL = `${API_URL}/settings`;

export interface UserSettings {
  notifications_enabled: boolean;
  theme: string;
  strict_mode: boolean;
}

/**
 * Service to manage user settings via the backend API
 */
export const settingsService = {
  /**
   * Fetch settings for the current authenticated user
   */
  async getSettings(): Promise<UserSettings> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) throw new Error("No active session");

    const response = await fetch(API_BASE_URL, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch settings");
    }

    const { data } = await response.json();
    return data;
  },

  /**
   * Update (upsert) settings for the current user
   */
  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) throw new Error("No active session");

    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update settings");
    }

    const { data } = await response.json();
    return data;
  },
};
