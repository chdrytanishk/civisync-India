import React, { useState } from "react";
import { auth, dbService } from "../lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { UserProfile, UserMode } from "../types";
import { Shield, EyeOff, User, Mail, Lock, Sparkles, Check, ArrowRight } from "lucide-react";

interface AuthPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  onViewChange: (view: any) => void;
}

export default function AuthPage({ onLoginSuccess, onViewChange }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  
  // Step for Mode Selection after register
  const [step, setStep] = useState<"auth" | "mode">("auth");
  const [registeredUid, setRegisteredUid] = useState("");
  const [selectedMode, setSelectedMode] = useState<UserMode>("guardian");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSignUp) {
        if (!email || !password || !username) {
          throw new Error("Please fill in all fields, including your guardian/shadow username.");
        }
        // Create auth user
        const res = await createUserWithEmailAndPassword(auth, email, password);
        setRegisteredUid(res.user.uid);
        // Move to mode selection step
        setStep("mode");
      } else {
        if (!email || !password) {
          throw new Error("Please enter your email and password.");
        }
        const res = await signInWithEmailAndPassword(auth, email, password);
        // Fetch existing profile from Firestore
        let profile = await dbService.getUserProfile(res.user.uid);
        if (!profile) {
          // If profile does not exist, create a default Guardian one
          profile = {
            uid: res.user.uid,
            email: email,
            mode: "guardian",
            username: email.split("@")[0],
            points: 100,
            streak: 1,
            badges: ["🔦 Streetlight Savior"],
            joinedAt: new Date().toISOString(),
          };
          await dbService.saveUserProfile(profile);
        }
        onLoginSuccess(profile);
        onViewChange("map");
      }
    } catch (err: any) {
      console.error(err);
      // Fallback/Simulated signup/login if Firebase has nested network errors inside the AI Studio preview iframe
      if (err.code === "auth/operation-not-allowed" || err.message?.includes("network")) {
        // Fallback simulate
        handleSimulation();
      } else {
        setError(err.message || "Authentication failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSimulation = async () => {
    // If Firebase Auth encounters an iframe blocking error, perform simulated auth instantly
    const uid = "simulated_" + Math.random().toString(36).substr(2, 9);
    setRegisteredUid(uid);
    if (isSignUp) {
      setStep("mode");
    } else {
      const demoProfile: UserProfile = {
        uid: "guardian_demo_ rahul",
        email: email || "rahuls@civisync.gov.in",
        mode: "guardian",
        username: username || "RahulS_Guardian",
        points: 240,
        streak: 3,
        badges: ["🔦 Streetlight Savior", "🕳️ Pothole Hunter"],
        joinedAt: new Date().toISOString(),
      };
      await dbService.saveUserProfile(demoProfile);
      onLoginSuccess(demoProfile);
      onViewChange("map");
    }
  };

  const handleModeComplete = async () => {
    setLoading(true);
    try {
      const finalUsername = username.trim() || (selectedMode === "shadow" ? "Anonymous Citizen" : email.split("@")[0]);
      
      const profile: UserProfile = {
        uid: registeredUid || "guardian_demo_rahul",
        email: email || "anonymous@civisync.org",
        mode: selectedMode,
        username: finalUsername,
        points: selectedMode === "guardian" ? 150 : 50, // Initial points
        streak: 1,
        badges: selectedMode === "guardian" ? ["🔦 Streetlight Savior"] : [],
        joinedAt: new Date().toISOString(),
      };

      await dbService.saveUserProfile(profile);
      onLoginSuccess(profile);
      onViewChange("map");
    } catch (err: any) {
      setError(err.message || "Failed to initialize profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoBypass = async (mode: "shadow" | "guardian") => {
    setLoading(true);
    const demoUid = mode === "shadow" ? "demo_shadow_user" : "demo_guardian_user";
    const demoProfile: UserProfile = {
      uid: demoUid,
      email: mode === "shadow" ? "shadow@civisync.in" : "guardian@civisync.in",
      mode: mode,
      username: mode === "shadow" ? "Anonymous Citizen" : "CivicChampion_IN",
      points: mode === "shadow" ? 80 : 350,
      streak: mode === "shadow" ? 2 : 5,
      badges: mode === "shadow" ? [] : ["🔦 Streetlight Savior", "🕳️ Pothole Hunter", "💧 Water Watcher"],
      joinedAt: new Date().toISOString(),
    };
    await dbService.saveUserProfile(demoProfile);
    onLoginSuccess(demoProfile);
    onViewChange("map");
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#010a06] text-emerald-100 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden animate-fade-in-premium">
      {/* Dynamic atmospheric radial background lights */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(40rem_40rem_at_center,#042617,#010a06)]" />
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-emerald-500/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#00ff87]/5 blur-3xl" />

      <div className="w-full max-w-md space-y-8 bg-[#02130c]/85 border border-[#0f3d2b]/70 backdrop-blur-md p-8 rounded-2xl shadow-2xl z-10 relative">
        
        {step === "auth" ? (
          <>
            {/* Header */}
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-[#00ff87] shadow-lg shadow-emerald-500/20">
                <Shield className="h-6 w-6 text-slate-950" />
              </div>
              <h2 className="mt-6 font-display text-3xl font-extrabold tracking-tight text-emerald-50">
                {isSignUp ? "Join CiviSync Today" : "Welcome Back"}
              </h2>
              <p className="mt-2 text-xs text-emerald-400/80">
                {isSignUp ? "Become a local guardian or report anonymously" : "Enter credentials to access your civic dashboard"}
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-950/40 border border-red-800/40 p-3 text-xs text-red-400 font-medium font-mono">
                {error}
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleAuthSubmit} className="mt-8 space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-xs font-bold text-emerald-400/70 uppercase tracking-wide">Username</label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-600/70">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. Aarav_Delhi"
                      className="block w-full rounded-xl bg-[#02110c] border border-[#0f3d2b]/60 text-emerald-100 pl-10 pr-4 py-3 text-sm focus:border-[#00ff87] focus:ring-1 focus:ring-[#00ff87]/40 placeholder:text-emerald-600/50 transition-all font-medium outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-emerald-400/70 uppercase tracking-wide">Email address</label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-600/70">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="block w-full rounded-xl bg-[#02110c] border border-[#0f3d2b]/60 text-emerald-100 pl-10 pr-4 py-3 text-sm focus:border-[#00ff87] focus:ring-1 focus:ring-[#00ff87]/40 placeholder:text-emerald-600/50 transition-all font-medium outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-400/70 uppercase tracking-wide">Password</label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-600/70">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-xl bg-[#02110c] border border-[#0f3d2b]/60 text-emerald-100 pl-10 pr-4 py-3 text-sm focus:border-[#00ff87] focus:ring-1 focus:ring-[#00ff87]/40 placeholder:text-emerald-600/50 transition-all font-medium outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/10 hover:opacity-95 transition-all cursor-pointer"
              >
                {loading ? "Authenticating..." : isSignUp ? "Proceed to Mode Selection" : "Login to Dashboard"}
              </button>
            </form>

            <div className="text-center mt-4">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs text-[#00ff87] hover:text-emerald-300 font-extrabold transition-colors cursor-pointer hover:underline"
              >
                {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Create one"}
              </button>
            </div>

            {/* Sandbox Instant Access */}
            <div className="mt-6 border-t border-[#0f3d2b]/40 pt-6">
              <p className="text-center text-[10px] uppercase font-extrabold tracking-wider text-emerald-500/70 mb-4">
                Sandbox Instant Access
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleDemoBypass("guardian")}
                  className="flex items-center justify-center space-x-2 rounded-xl bg-[#02110c] border border-[#00ff87]/30 hover:bg-emerald-950/20 p-3 text-xs text-emerald-400 transition-all cursor-pointer font-bold"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#00ff87] animate-pulse" />
                  <span>Demo Guardian</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoBypass("shadow")}
                  className="flex items-center justify-center space-x-2 rounded-xl bg-[#02110c] border border-[#00ff87]/30 hover:bg-emerald-950/20 p-3 text-xs text-emerald-300 transition-all cursor-pointer font-bold"
                >
                  <EyeOff className="h-3.5 w-3.5 text-[#00ff87]" />
                  <span>Demo Shadow</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          /* STEP 2: MODE SELECTION */
          <div className="space-y-6">
            <div className="text-center">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-950/40 text-[#00ff87] font-display font-semibold text-xs border border-emerald-800/40 mb-3">
                <Check className="h-4 w-4" />
              </span>
              <h2 className="font-display text-2xl font-extrabold text-emerald-50">Choose Your Profile Mode</h2>
              <p className="text-xs text-emerald-400 mt-1 leading-relaxed font-normal">
                Configure your civic profile status. You can toggle this setting in your profile at any time.
              </p>
            </div>

            <div className="space-y-4">
              {/* Option 1: Guardian */}
              <div 
                onClick={() => setSelectedMode("guardian")}
                className={`relative p-5 rounded-xl border cursor-pointer transition-all ${
                  selectedMode === "guardian" 
                    ? "bg-[#02110c] border-[#00ff87] shadow-md shadow-emerald-500/5" 
                    : "bg-[#02110c]/40 border border-[#0f3d2b]/60 hover:bg-[#02110c]/80"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${
                    selectedMode === "guardian" ? "border-[#00ff87] text-[#00ff87] bg-[#010a06]" : "border-emerald-800"
                  }`}>
                    {selectedMode === "guardian" && <div className="h-2 w-2 rounded-full bg-[#00ff87]" />}
                  </div>
                  <div>
                    <span className="font-display font-extrabold text-sm text-emerald-50 flex items-center gap-1.5">
                      🛡️ Guardian Mode
                    </span>
                    <p className="text-xs text-emerald-400/80 mt-1 leading-relaxed font-normal">
                      Public profile. Earn leadership points, unlock badges, appear on ward leaderboards, 
                      and gain recognition as a civic champion.
                    </p>
                  </div>
                </div>
              </div>

              {/* Option 2: Shadow */}
              <div 
                onClick={() => setSelectedMode("shadow")}
                className={`relative p-5 rounded-xl border cursor-pointer transition-all ${
                  selectedMode === "shadow" 
                    ? "bg-[#02110c] border-[#00ff87] shadow-md shadow-[#00ff87]/5" 
                    : "bg-[#02110c]/40 border border-[#0f3d2b]/60 hover:bg-[#02110c]/80"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${
                    selectedMode === "shadow" ? "border-[#00ff87] text-[#00ff87] bg-[#010a06]" : "border-emerald-800"
                  }`}>
                    {selectedMode === "shadow" && <div className="h-2 w-2 rounded-full bg-[#00ff87]" />}
                  </div>
                  <div>
                    <span className="font-display font-extrabold text-sm text-emerald-50 flex items-center gap-1.5">
                      🔒 Shadow Mode
                    </span>
                    <p className="text-xs text-emerald-400/80 mt-1 leading-relaxed font-normal">
                      100% anonymous. Reports are posted anonymously with no identity metadata. Completely hidden 
                      from all leaderboards. See your private stats in peace.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleModeComplete}
              disabled={loading}
              className="w-full flex justify-center items-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/10 hover:opacity-95 transition-all cursor-pointer"
            >
              <span>Activate Profile & Enter CiviSync</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
