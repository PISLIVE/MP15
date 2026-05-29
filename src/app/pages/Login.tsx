import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Globe,
  Shield,
  Lock,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { ParticleBackground } from "../components/ParticleBackground";

export function Login() {

  const { user, login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // Redirect authenticated users
  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  // Google login
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);

    try {
      await loginWithGoogle();
      toast.success("Signing with Google!");
    } catch (error: any) {
      toast.error(error?.message || "Google login failed");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Demo Login
  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    try {
      await login("demo@footprintanalyzer.com", "demo123456");
      toast.success("Welcome to Demo Mode!");
    } catch (error: any) {
      try {
        await signup("demo@footprintanalyzer.com", "demo123456");
        toast.success("Demo account initialized. Welcome!");
      } catch (signupError: any) {
        toast.error("Demo login failed. Make sure email confirmations are disabled in Supabase.");
      }
    } finally {
      setIsDemoLoading(false);
    }
  };

  // Email login/signup
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) return;

    setIsSubmitting(true);

    try {

      if (mode === "signin") {
        await login(email, password);
        toast.success("Welcome back!");
      } else {
        await signup(email, password);
        toast.success("Account created! Check your email to confirm.");
      }

      // Navigation is handled by the useEffect watching `user`

    } catch (error: any) {

      const msg = error?.message || "Authentication failed";

      if (msg.includes("Invalid login credentials")) {
        toast.error("Invalid email or password.");
      } else if (msg.includes("User already registered")) {
        toast.error("Email already registered. Try signing in.");
        setMode("signin");
      } else {
        toast.error(msg);
      }

    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">

      {/* --- LAYER 1: BACKGROUNDS --- */}
      {/* Left side Image (only visible on lg+) */}
      <div className="hidden lg:block absolute inset-0 lg:right-1/2 pointer-events-none">
        <motion.div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')",
          }}
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 12, repeat: Infinity, repeatType: "reverse" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-80" />
      </div>

      {/* Right side Solid Background */}
      <div className="absolute inset-0 lg:left-1/2 bg-white dark:bg-slate-950 pointer-events-none" />

      {/* --- LAYER 2: PARTICLES --- */}
      <ParticleBackground />

      {/* --- LAYER 3: CONTENT --- */}
      <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-2">

        {/* LEFT HERO SECTION */}
        <div className="hidden lg:flex flex-col justify-between p-12 text-white pointer-events-none">
          <div className="pointer-events-auto">
            <div className="flex items-center gap-3 mb-10">
              <motion.div
                className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              >
                <Globe className="w-6 h-6 text-white" />
              </motion.div>
              <span className="text-xl font-bold tracking-tight">
                Footprint Analyzer
              </span>
            </div>

            <h1 className="text-5xl font-bold leading-tight mb-6">
              Master Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                Digital Presence
              </span>
            </h1>

            <p className="text-lg text-blue-100/80 max-w-md">
              Advanced monitoring and security analysis for your professional
              digital footprint. Identify risks, track exposure, and protect your reputation.
            </p>
          </div>

          <div className="space-y-4 pointer-events-auto">
            {[
              "Real-time exposure monitoring",
              "Dark web breach scanning",
              "Social media sentiment analysis",
              "AI-powered security recommendations",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-blue-100/90">
                <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT FORM SECTION */}
        <div className="flex items-center justify-center p-8 pointer-events-none">
          <motion.div
            className="w-full max-w-md space-y-8 pointer-events-auto"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                {mode === "signin" ? "Welcome back" : "Create account"}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {mode === "signin"
                  ? "Sign in to access your dashboard"
                  : "Create an account to start monitoring your digital footprint"}
              </p>
            </div>

            <div className="space-y-5">

              {/* GOOGLE LOGIN */}
              <Button
                variant="outline"
                className="w-full h-12"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading
                  ? <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  : <img src="https://www.google.com/favicon.ico" className="w-5 h-5 mr-2" />}

                Continue with Google
              </Button>

              {/* DIVIDER */}
              <div className="relative">

                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>

                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-50 px-2 text-gray-500">
                    Or with email
                  </span>
                </div>

              </div>

              {/* EMAIL FORM */}
              <form onSubmit={handleEmailAuth} className="space-y-4">

                <div className="space-y-2">
                  <Label>Email</Label>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                    <Input
                      type="email"
                      placeholder="name@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11"
                      required
                    />
                  </div>

                </div>

                <div className="space-y-2">
                  <Label>Password</Label>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-11"
                      required
                      minLength={6}
                    />
                  </div>

                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-700 text-white"
                  disabled={isSubmitting}
                >

                  {isSubmitting
                    ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    : null}

                  {mode === "signin" ? "Sign in" : "Create account"}

                  <ArrowRight className="w-4 h-4 ml-2" />

                </Button>

              </form>

              <div className="pt-2">
                <Button
                  variant="secondary"
                  type="button"
                  className="w-full h-11 bg-slate-100 hover:bg-slate-200 text-slate-700"
                  onClick={handleDemoLogin}
                  disabled={isDemoLoading || isSubmitting || isGoogleLoading}
                >
                  {isDemoLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Try Demo Mode (No Registration)
                </Button>
              </div>

            </div>

            <p className="text-center text-sm text-gray-600">

              {mode === "signin" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    onClick={() => setMode("signup")}
                    className="font-semibold text-blue-600"
                  >
                    Create one
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => setMode("signin")}
                    className="font-semibold text-blue-600"
                  >
                    Sign in
                  </button>
                </>
              )}

            </p>

            <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" />
              Your data is encrypted and never sold.
            </p>

          </motion.div>

        </div>
      </div>
    </div>
  );
}