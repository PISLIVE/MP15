import { Outlet } from "react-router";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "./components/ui/sonner";

export default function Layout() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem storageKey="dfa-theme">
      <AuthProvider>
        <Outlet />
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
