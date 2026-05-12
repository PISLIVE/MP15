import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Globe,
  Sun,
  Moon,
  Monitor,
  User,
  Mail,
  Shield,
  LogOut,
  Settings as SettingsIcon,
  Bell,
  Lock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { settingsService } from "../services/settingsService";

export function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme: setNextTheme } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // 1. Fetch settings on mount (notifications only — theme is handled by next-themes localStorage)
  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await settingsService.getSettings();
        setNotificationsEnabled(settings.notifications_enabled);
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setIsInitialLoading(false);
      }
    }
    if (user) loadSettings();
  }, [user]);

  // 2. Persist settings change
  const syncSettings = async (updates: { notifications_enabled?: boolean; theme?: string }) => {
    try {
      setIsSyncing(true);
      await settingsService.updateSettings({
        notifications_enabled: updates.notifications_enabled ?? notificationsEnabled,
        theme: updates.theme ?? (theme || "system"),
      });
    } catch (error) {
      toast.error("Failed to save preference to cloud");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleNotifications = async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue); // Optimistic UI
    toast.success(newValue ? "Notifications enabled" : "Notifications disabled");
    await syncSettings({ notifications_enabled: newValue });
  };

  const handleThemeChange = async (newTheme: string) => {
    setNextTheme(newTheme); // Optimistic UI
    await syncSettings({ theme: newTheme });
  };

  const authEmail = user?.email || "";
  const username =
    user?.user_metadata?.username ||
    user?.user_metadata?.user_name ||
    user?.user_metadata?.preferred_username ||
    "";
  const displayName = username || authEmail || "User";

  function getUserInitials(name?: string | null, email?: string | null) {
    if (name) {
      const parts = name.trim().split(" ").filter(Boolean);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return "??";
  }

  const initials = getUserInitials(displayName, authEmail);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const handleChangePassword = () => {
    toast.info("A password reset email will be sent to " + authEmail);
  };

  if (isInitialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-4 text-sm text-slate-500 font-medium">Syncing your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.12),_transparent_22%),linear-gradient(to_bottom,_#f8fbff,_#eef4ff)] dark:bg-none dark:bg-slate-950">

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/40 bg-white/75 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="flex items-center gap-2">
              <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-3 shadow-lg shadow-blue-200">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  Settings
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage your account & preferences
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
            {isSyncing && <Loader2 className="h-3 w-3 animate-spin text-slate-400 mr-1" />}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-bold text-white">
              {initials}
            </div>
            <p className="hidden text-sm font-medium text-slate-900 dark:text-white sm:block">
              {displayName}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">

        {/* Profile Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-slate-200/70 bg-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/30">
              <User className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Profile</h2>
          </div>

          <div className="space-y-4 p-5">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-bold text-white shadow-lg shadow-blue-200">
                {initials}
              </div>
              <div>
                <p className="text-base font-semibold text-slate-900 dark:text-white">{displayName}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{authEmail}</p>
              </div>
            </div>

            {/* Info rows */}
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Email</span>
                </div>
                <span className="break-all text-sm font-medium text-slate-900 dark:text-white">{authEmail || "—"}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Account Status</span>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  Active
                </span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Appearance Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="rounded-2xl border border-slate-200/70 bg-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/30">
              <SettingsIcon className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Appearance</h2>
          </div>

          <div className="p-5">
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Choose your preferred theme</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Light", value: "light", icon: Sun },
                { label: "Dark", value: "dark", icon: Moon },
                { label: "System", value: "system", icon: Monitor },
              ].map(({ label, value, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handleThemeChange(value)}
                  disabled={isSyncing}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${
                    theme === value
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                  } ${isSyncing ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Notifications Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.14 }}
          className="rounded-2xl border border-slate-200/70 bg-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/30">
              <Bell className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Notifications</h2>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Scan alerts</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Get notified when a scan detects high-risk results</p>
              </div>
              <button
                onClick={handleToggleNotifications}
                disabled={isSyncing}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationsEnabled ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
                } ${isSyncing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    notificationsEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </motion.section>

        {/* Security Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-2xl border border-slate-200/70 bg-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/30">
              <Lock className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Security</h2>
          </div>

          <div className="space-y-3 p-5">
            <Button
              variant="outline"
              className="w-full justify-start rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              onClick={handleChangePassword}
            >
              <Lock className="mr-2 h-4 w-4" />
              Send password reset email
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start rounded-xl border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out of this account
            </Button>
          </div>
        </motion.section>

      </main>
    </div>
  );
}

